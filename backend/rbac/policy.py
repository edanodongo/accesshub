"""Rules about WHO MAY CHANGE WHAT. Having `users.edit` is not enough on its own:
you must also be at least as powerful as whatever you are changing. Without this,
anyone who can edit users could reset an admin's password and take over the account."""
from rest_framework.exceptions import APIException, PermissionDenied

from .audit import log_action


class Conflict(APIException):
    status_code = 409
    default_detail = "Conflict."
    default_code = "conflict"


def deny(request, message, **details):
    """Log the refusal, then raise a 403."""
    log_action(request, "access.denied", details={"reason": message, **details})
    raise PermissionDenied(message)


def user_role_permissions(user):
    """What the user's ROLE grants, ignoring is_active. Used for the person being
    changed: a deactivated admin is still an admin the moment someone re-enables them."""
    return user.role.effective_permissions() if user.role_id else set()


def can_manage_user(actor, target):
    return user_role_permissions(target) <= actor.get_permissions()


def can_manage_role(actor, role):
    return role.effective_permissions() <= actor.get_permissions()


def missing_for(actor, codenames):
    """Permissions in `codenames` that the actor does not hold themselves."""
    return set(codenames) - actor.get_permissions()