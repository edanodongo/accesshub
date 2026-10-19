from django.core.management.base import BaseCommand

from rbac.defaults import DEMO_PASSWORD, DEMO_USERS, PERMISSIONS, ROLES
from rbac.models import Permission, Role
from users.models import User


class Command(BaseCommand):
    help = "Create default permissions and roles (safe to run repeatedly)."

    def add_arguments(self, parser):
        parser.add_argument("--admin", help="Username to promote to ADMIN")
        parser.add_argument(
            "--demo", action="store_true",
            help="Create demo users alice (USER), bob (EDITOR), carol (ADMIN)",
        )

    def handle(self, *args, **options):
        for codename, desc in PERMISSIONS.items():
            Permission.objects.update_or_create(
                codename=codename,
                defaults={"description": desc, "is_system": True},
            )

        for name, parent_name, desc, perms in ROLES:
            parent = Role.objects.get(name=parent_name) if parent_name else None
            role, _ = Role.objects.update_or_create(
                name=name,
                defaults={"description": desc, "parent": parent, "is_system": True},
            )
            # add(), not set(): restores the built-in baseline on every start
            # but never wipes permissions that an admin added through the UI.
            role.permissions.add(*Permission.objects.filter(codename__in=perms))

        self.stdout.write(self.style.SUCCESS("RBAC seeded."))

        username = options.get("admin")
        if username:
            user = User.objects.get(username=username)
            user.role = Role.objects.get(name="ADMIN")
            user.save(update_fields=["role"])
            self.stdout.write(self.style.SUCCESS(f"{username} is now ADMIN."))

        if options["demo"]:
            for username, email, role_name in DEMO_USERS:
                user, created = User.objects.get_or_create(
                    username=username,
                    defaults={"email": email, "role": Role.objects.get(name=role_name)},
                )
                if created:
                    user.set_password(DEMO_PASSWORD)
                    user.save(update_fields=["password"])
            self.stdout.write(self.style.SUCCESS("Demo users ready."))