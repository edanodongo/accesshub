from django.core.exceptions import ValidationError
from django.db import models


class Permission(models.Model):
    codename = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.codename


class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=255, blank=True)
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