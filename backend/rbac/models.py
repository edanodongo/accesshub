from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Permission(models.Model):
    codename = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255, blank=True)
    # System permissions are referenced by code, so they can never be deleted or renamed.
    is_system = models.BooleanField(default=False)

    def __str__(self):
        return self.codename


class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=255, blank=True)
    is_system = models.BooleanField(default=False)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="children",
    )
    permissions = models.ManyToManyField(
        Permission, blank=True, related_name="roles"
    )

    def __str__(self):
        return self.name

    def lineage(self):
        """This role followed by its parent, grandparent, and so on."""
        chain, role = [], self
        while role is not None:
            chain.append(role)
            role = role.parent
        return chain

    def effective_permissions(self):
        """Own permissions plus everything inherited from ancestors."""
        role_ids = [r.pk for r in self.lineage()]
        return set(
            Permission.objects.filter(roles__in=role_ids)
            .values_list("codename", flat=True)
        )

    def clean(self):
        # A role must never inherit from itself, directly or indirectly.
        ancestor, seen = self.parent, set()
        while ancestor is not None and ancestor.pk not in seen:
            if self.pk is not None and ancestor.pk == self.pk:
                raise ValidationError("A role cannot inherit from itself.")
            seen.add(ancestor.pk)
            ancestor = ancestor.parent

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class AuditLog(models.Model):
    """Append-only record of who did what. Never edited through the API."""

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_entries",
    )
    # Copied at write time so the entry stays readable after the user is deleted
    # (and so failed logins, which have no user, can still record a name).
    actor_name = models.CharField(max_length=150, blank=True)
    action = models.CharField(max_length=60, db_index=True)  # e.g. "role.create"
    target_type = models.CharField(max_length=30, blank=True)
    target_repr = models.CharField(max_length=255, blank=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.created_at:%Y-%m-%d %H:%M} {self.actor_name} {self.action}"