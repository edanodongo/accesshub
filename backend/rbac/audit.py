from .models import AuditLog


def log_action(request, action, *, target="", target_type="", details=None,
               actor=None, actor_name=""):
    """Write one audit entry. Call it inside the same transaction as the change."""
    if actor is None and request is not None:
        user = getattr(request, "user", None)
        if user is not None and user.is_authenticated:
            actor = user
    return AuditLog.objects.create(
        actor=actor,
        actor_name=(actor.username if actor else actor_name)[:150],
        action=action,
        target_type=target_type,
        target_repr=str(target)[:255],
        details=details or {},
        ip_address=request.META.get("REMOTE_ADDR") if request is not None else None,
    )