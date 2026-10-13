from rest_framework.permissions import BasePermission


def require_permission(codename):
    """Build a DRF permission class that demands one specific permission."""

    class HasPermission(BasePermission):
        message = f"Missing required permission: {codename}"

        def has_permission(self, request, view):
            user = request.user
            return bool(user and user.is_authenticated and user.can(codename))

    return HasPermission