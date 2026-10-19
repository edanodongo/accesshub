from rest_framework.permissions import BasePermission, IsAuthenticated

from .audit import log_action

AUTHENTICATED = "__authenticated__"  # marker: any logged-in user


def require_permission(codename):
    """Build a DRF permission class that demands one specific permission."""

    class HasPermission(BasePermission):
        message = f"Missing required permission: {codename}"

        def has_permission(self, request, view):
            user = request.user
            if user and user.is_authenticated and user.can(codename):
                return True
            if user and user.is_authenticated:
                log_action(
                    request, "access.denied",
                    details={"required": codename, "method": request.method, "path": request.path},
                )
            return False

    return HasPermission


class DenyAll(BasePermission):
    message = "This action is not permitted."

    def has_permission(self, request, view):
        return False


class PermissionMapMixin:
    """ViewSet mixin: `permission_map = {"destroy": "roles.delete", ...}`.
    An action that is not listed is DENIED, so a forgotten mapping fails closed."""

    permission_map: dict = {}

    def get_permissions(self):
        required = self.permission_map.get(self.action)
        if required is None:
            return [IsAuthenticated(), DenyAll()]
        if required == AUTHENTICATED:
            return [IsAuthenticated()]
        return [IsAuthenticated(), require_permission(required)()]