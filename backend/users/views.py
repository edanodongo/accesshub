from django.contrib.auth import authenticate
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import mixins, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from rbac.audit import log_action
from rbac.models import Role
from rbac.permissions import PermissionMapMixin, require_permission
from rbac.policy import can_manage_user, deny, missing_for
from .models import User
from .serializers import (
    RegisterSerializer, UserCreateSerializer, UserSerializer, UserUpdateSerializer,
)


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"status": "ok", "message": "Hello from Django!"})


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    with transaction.atomic():
        user = serializer.save()
        log_action(request, "auth.register", actor=user, target=user.username, target_type="user")
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": UserSerializer(user).data}, status=201)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username")
    user = authenticate(username=username, password=request.data.get("password"))
    if user is None:
        log_action(request, "auth.login_failed", actor_name=str(username or "")[:150],
                   details={"username": str(username or "")[:150]})
        return Response({"detail": "Invalid username or password."}, status=401)
    token, _ = Token.objects.get_or_create(user=user)
    log_action(request, "auth.login", actor=user, target=user.username, target_type="user")
    return Response({"token": token.key, "user": UserSerializer(user).data})


@api_view(["POST"])
def logout_view(request):
    log_action(request, "auth.logout", target=request.user.username, target_type="user")
    request.user.auth_token.delete()
    return Response(status=204)


@api_view(["GET"])
def me(request):
    return Response(UserSerializer(request.user).data)


class UserViewSet(
    PermissionMapMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    queryset = User.objects.select_related("role").order_by("id")
    permission_map = {
        "list": "users.view",
        "retrieve": "users.view",
        "create": "users.create",
        "update": "users.edit",
        "partial_update": "users.edit",
        "destroy": "users.delete",
        "set_role": "users.change_role",
    }

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        if self.action in ("update", "partial_update"):
            return UserUpdateSerializer
        return UserSerializer

    def _guard(self, target):
        """Block changes to anyone more powerful than the person asking."""
        if not can_manage_user(self.request.user, target):
            deny(self.request, "You cannot modify a user who is more powerful than you.",
                 target=target.username)

    def create(self, request, *args, **kwargs):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = serializer.validated_data.get("role")
        if role is not None:
            if not request.user.can("users.change_role"):
                deny(request, "Choosing a role needs the users.change_role permission.")
            missing = missing_for(request.user, role.effective_permissions())
            if missing:
                deny(request, f"That role grants permissions you do not hold: {', '.join(sorted(missing))}")
        with transaction.atomic():
            user = serializer.save()
            log_action(request, "user.create", target=user.username, target_type="user",
                       details={"role": user.role.name if user.role else None})
        return Response(UserSerializer(user).data, status=201)

    def perform_update(self, serializer):
        target = serializer.instance
        self._guard(target)
        if target == self.request.user and serializer.validated_data.get("is_active") is False:
            raise ValidationError({"is_active": "You cannot deactivate your own account."})

        before = {"email": target.email, "is_active": target.is_active}
        with transaction.atomic():
            user = serializer.save()
            changes = {k: [before[k], getattr(user, k)] for k in before if before[k] != getattr(user, k)}
            details = {"changes": changes}
            if "password" in serializer.validated_data:
                details["password_reset"] = True  # never log the password itself
            log_action(self.request, "user.update", target=user.username, target_type="user",
                       details=details)

    def perform_destroy(self, target):
        if target == self.request.user:
            raise ValidationError({"detail": "You cannot delete your own account."})
        self._guard(target)
        with transaction.atomic():
            log_action(self.request, "user.delete", target=target.username, target_type="user",
                       details={"role": target.role.name if target.role else None})
            target.delete()

    @action(detail=True, methods=["patch"], url_path="role")
    def set_role(self, request, pk=None):
        target = self.get_object()
        if target == request.user:
            return Response({"detail": "You cannot change your own role."}, status=400)
        role = get_object_or_404(Role, name=request.data.get("role"))
        self._guard(target)
        missing = missing_for(request.user, role.effective_permissions())
        if missing:
            deny(request, f"That role grants permissions you do not hold: {', '.join(sorted(missing))}",
                 target=target.username)
        old = target.role.name if target.role else None
        with transaction.atomic():
            target.role = role
            target.save(update_fields=["role"])
            log_action(request, "user.role_change", target=target.username, target_type="user",
                       details={"from": old, "to": role.name})
        return Response(UserSerializer(target).data)


# --- Stub endpoints so every permission has something real to test against ---

@api_view(["GET"])
@permission_classes([IsAuthenticated, require_permission("content.view")])
def content_list(request):
    return Response([{"id": 1, "title": "Welcome post"}, {"id": 2, "title": "Release notes"}])


@api_view(["POST"])
@permission_classes([IsAuthenticated, require_permission("content.create")])
def content_create(request):
    return Response({"id": 3, "title": request.data.get("title", "Untitled")}, status=201)


@api_view(["PUT"])
@permission_classes([IsAuthenticated, require_permission("content.edit")])
def content_edit(request, content_id):
    return Response({"id": content_id, "updated": True})