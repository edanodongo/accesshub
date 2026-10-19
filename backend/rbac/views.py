from django.db import transaction
from rest_framework import viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .audit import log_action
from .defaults import SYSTEM_ROLE_BASELINE
from .models import AuditLog, Permission, Role
from .permissions import AUTHENTICATED, PermissionMapMixin, require_permission
from .policy import Conflict, can_manage_role, deny, missing_for
from .serializers import AuditLogSerializer, PermissionSerializer, RoleSerializer


class PermissionViewSet(PermissionMapMixin, viewsets.ModelViewSet):
    queryset = Permission.objects.order_by("codename")
    serializer_class = PermissionSerializer
    permission_map = {
        "list": AUTHENTICATED,       # the catalog is not secret; the tester page needs it
        "retrieve": AUTHENTICATED,
        "create": "permissions.manage",
        "update": "permissions.manage",
        "partial_update": "permissions.manage",
        "destroy": "permissions.manage",
    }

    def perform_create(self, serializer):
        with transaction.atomic():
            perm = serializer.save()
            log_action(self.request, "permission.create", target=perm.codename, target_type="permission")

    def perform_update(self, serializer):
        before = serializer.instance.description
        with transaction.atomic():
            perm = serializer.save()
            log_action(
                self.request, "permission.update", target=perm.codename, target_type="permission",
                details={"description": [before, perm.description]},
            )

    def perform_destroy(self, perm):
        if perm.is_system:
            raise Conflict("Built-in permissions are used by the code and cannot be deleted.")
        with transaction.atomic():
            roles = sorted(perm.roles.values_list("name", flat=True))
            log_action(
                self.request, "permission.delete", target=perm.codename, target_type="permission",
                details={"removed_from_roles": roles},
            )
            perm.delete()


class RoleViewSet(PermissionMapMixin, viewsets.ModelViewSet):
    queryset = Role.objects.select_related("parent").prefetch_related("permissions").order_by("id")
    serializer_class = RoleSerializer
    permission_map = {
        "list": "roles.view",
        "retrieve": "roles.view",
        "create": "roles.create",
        "update": "roles.edit",
        "partial_update": "roles.edit",
        "destroy": "roles.delete",
        "set_permissions": "roles.assign_permissions",
    }

    def perform_create(self, serializer):
        with transaction.atomic():
            role = serializer.save()
            log_action(
                self.request, "role.create", target=role.name, target_type="role",
                details={"parent": role.parent.name if role.parent else None},
            )

    def perform_update(self, serializer):
        role = serializer.instance
        if not can_manage_role(self.request.user, role):
            deny(self.request, "You cannot modify a role that is more powerful than your own.", role=role.name)

        before = {"name": role.name, "description": role.description,
                  "parent": role.parent.name if role.parent else None}
        with transaction.atomic():
            role = serializer.save()
            after = {"name": role.name, "description": role.description,
                     "parent": role.parent.name if role.parent else None}
            changes = {k: [before[k], after[k]] for k in before if before[k] != after[k]}
            log_action(self.request, "role.update", target=role.name, target_type="role",
                       details={"changes": changes})

    def perform_destroy(self, role):
        if role.is_system:
            raise Conflict("Built-in roles cannot be deleted.")
        if not can_manage_role(self.request.user, role):
            deny(self.request, "You cannot delete a role that is more powerful than your own.", role=role.name)
        if role.users.exists():
            raise Conflict(f"{role.users.count()} user(s) still have this role. Reassign them first.")
        if role.children.exists():
            raise Conflict("Other roles inherit from this one. Change their parent first.")
        with transaction.atomic():
            log_action(self.request, "role.delete", target=role.name, target_type="role")
            role.delete()

    @action(detail=True, methods=["put"], url_path="permissions")
    def set_permissions(self, request, pk=None):
        """Replace the role's OWN permission set with exactly the list sent."""
        role = self.get_object()
        codenames = request.data.get("permissions")
        if not isinstance(codenames, list) or not all(isinstance(c, str) for c in codenames):
            raise ValidationError({"permissions": "Send a list of permission codenames."})

        wanted = set(codenames)
        known = set(Permission.objects.filter(codename__in=wanted).values_list("codename", flat=True))
        if wanted - known:
            raise ValidationError({"permissions": f"Unknown: {', '.join(sorted(wanted - known))}"})

        current = set(role.permissions.values_list("codename", flat=True))
        added, removed = wanted - current, current - wanted

        if not can_manage_role(request.user, role):
            deny(request, "You cannot modify a role that is more powerful than your own.", role=role.name)
        missing = missing_for(request.user, added)
        if missing:
            deny(request, f"You can only grant permissions you hold yourself: {', '.join(sorted(missing))}",
                 role=role.name)
        if role.is_system:
            blocked = removed & SYSTEM_ROLE_BASELINE.get(role.name, set())
            if blocked:
                raise Conflict(
                    f"Built-in permissions of {role.name} cannot be removed: {', '.join(sorted(blocked))}"
                )

        with transaction.atomic():
            role.permissions.set(Permission.objects.filter(codename__in=wanted))
            log_action(request, "role.permissions_set", target=role.name, target_type="role",
                       details={"added": sorted(added), "removed": sorted(removed)})

        return Response(RoleSerializer(self.get_queryset().get(pk=role.pk)).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, require_permission("audit.view")])
def audit_list(request):
    entries = AuditLog.objects.all()
    action_prefix = request.query_params.get("action")
    actor = request.query_params.get("actor")
    if action_prefix:
        entries = entries.filter(action__startswith=action_prefix)
    if actor:
        entries = entries.filter(actor_name__icontains=actor)
    try:
        limit = max(1, min(int(request.query_params.get("limit", 100)), 500))
    except ValueError:
        limit = 100
    return Response(AuditLogSerializer(entries[:limit], many=True).data)