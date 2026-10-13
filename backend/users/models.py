from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    role = models.ForeignKey(
        "rbac.Role",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="users",
    )

    def get_permissions(self):
        if not self.is_active or self.role is None:
            return set()
        return self.role.effective_permissions()

    def can(self, codename):
        return codename in self.get_permissions()