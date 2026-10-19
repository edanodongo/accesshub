import json

from django.core.management import call_command
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient, APITestCase

from rbac.models import AuditLog, Permission, Role
from users.models import User


def make_role(name, perms=(), parent=None):
    role = Role.objects.create(name=name, parent=Role.objects.get(name=parent) if parent else None)
    role.permissions.set(Permission.objects.filter(codename__in=perms))
    return role


class Base(APITestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_rbac", "--demo", verbosity=0)
        cls.alice = User.objects.get(username="alice")   # USER
        cls.bob = User.objects.get(username="bob")       # EDITOR
        cls.carol = User.objects.get(username="carol")   # ADMIN

    def as_user(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client


class InheritanceTests(Base):
    def test_admin_inherits_everything_below_it(self):
        admin_perms = self.carol.get_permissions()
        self.assertTrue(self.bob.get_permissions() < admin_perms)
        self.assertTrue(self.alice.get_permissions() < self.bob.get_permissions())
        self.assertIn("content.view", admin_perms)          # two levels up

    def test_custom_child_role_inherits_parent(self):
        make_role("HELPER", ["users.view"], parent="EDITOR")
        user = User.objects.create_user("h", password="x12345678", role=Role.objects.get(name="HELPER"))
        self.assertEqual(
            user.get_permissions(), self.bob.get_permissions() | {"users.view"}
        )

    def test_inactive_user_has_no_permissions(self):
        self.bob.is_active = False
        self.bob.save()
        self.assertEqual(self.bob.get_permissions(), set())

    def test_cycle_is_rejected(self):
        make_role("A")
        make_role("B", parent="A")
        res = self.as_user(self.carol).patch(f"/api/roles/{Role.objects.get(name='A').pk}/", {"parent": "B"}, format="json")
        self.assertEqual(res.status_code, 400)
        res = self.as_user(self.carol).patch(f"/api/roles/{Role.objects.get(name='A').pk}/", {"parent": "A"}, format="json")
        self.assertEqual(res.status_code, 400)


# (method, path, body, permission that endpoint requires)
GATED = [
    ("GET", "/api/users/", None, "users.view"),
    ("POST", "/api/users/", {}, "users.create"),
    ("PATCH", "/api/users/0/", {}, "users.edit"),
    ("DELETE", "/api/users/0/", None, "users.delete"),
    ("PATCH", "/api/users/0/role/", {}, "users.change_role"),
    ("GET", "/api/roles/", None, "roles.view"),
    ("POST", "/api/roles/", {}, "roles.create"),
    ("PATCH", "/api/roles/0/", {}, "roles.edit"),
    ("DELETE", "/api/roles/0/", None, "roles.delete"),
    ("PUT", "/api/roles/0/permissions/", {}, "roles.assign_permissions"),
    ("POST", "/api/permissions/", {}, "permissions.manage"),
    ("PATCH", "/api/permissions/0/", {}, "permissions.manage"),
    ("DELETE", "/api/permissions/0/", None, "permissions.manage"),
    ("GET", "/api/audit/", None, "audit.view"),
    ("GET", "/api/content/", None, "content.view"),
    ("POST", "/api/content/create/", {}, "content.create"),
    ("PUT", "/api/content/1/edit/", {}, "content.edit"),
]


class EndpointMatrixTests(Base):
    def test_every_endpoint_enforces_its_permission(self):
        for user in (self.alice, self.bob, self.carol):
            client = self.as_user(user)
            for method, path, body, needed in GATED:
                res = client.generic(method, path, data=None if body is None else json.dumps(body),
                                     content_type="application/json")
                allowed = needed in user.get_permissions()
                label = f"{user.username} {method} {path} (needs {needed}) -> {res.status_code}"
                if allowed:
                    self.assertNotIn(res.status_code, (401, 403), label)
                else:
                    self.assertEqual(res.status_code, 403, label)

    def test_anonymous_gets_401_everywhere(self):
        client = APIClient()
        for method, path, body, _ in GATED:
            res = client.generic(method, path)
            self.assertEqual(res.status_code, 401, f"{method} {path}")

    def test_permission_list_is_open_to_any_logged_in_user(self):
        self.assertEqual(self.as_user(self.alice).get("/api/permissions/").status_code, 200)


class EscalationTests(Base):
    def setUp(self):
        role = make_role("HELPDESK", ["users.view", "users.edit", "users.change_role"], parent="USER")
        self.helper = User.objects.create_user("helper", password="x12345678", role=role)
        self.client_h = self.as_user(self.helper)

    def test_cannot_edit_a_more_powerful_user(self):
        res = self.client_h.patch(f"/api/users/{self.carol.pk}/", {"email": "evil@x.com"}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_cannot_take_over_a_deactivated_admin(self):
        self.carol.is_active = False
        self.carol.save()
        res = self.client_h.patch(f"/api/users/{self.carol.pk}/",
                                  {"password": "newpassword1", "is_active": True}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_cannot_assign_a_role_stronger_than_your_own(self):
        res = self.client_h.patch(f"/api/users/{self.alice.pk}/role/", {"role": "ADMIN"}, format="json")
        self.assertEqual(res.status_code, 403)
        res = self.client_h.patch(f"/api/users/{self.alice.pk}/role/", {"role": "EDITOR"}, format="json")
        self.assertEqual(res.status_code, 403)   # EDITOR has content.edit, helper does not

    def test_can_assign_a_role_within_your_own_power(self):
        make_role("TEMP", ["content.view"], parent=None)
        res = self.client_h.patch(f"/api/users/{self.alice.pk}/role/", {"role": "TEMP"}, format="json")
        self.assertEqual(res.status_code, 200)

    def test_cannot_grant_permissions_you_do_not_hold(self):
        mgr = make_role("ROLE_MGR", ["roles.view", "roles.assign_permissions"], parent="USER")
        manager = User.objects.create_user("mgr", password="x12345678", role=mgr)
        target = make_role("TARGET")
        client = self.as_user(manager)
        res = client.put(f"/api/roles/{target.pk}/permissions/", {"permissions": ["users.delete"]}, format="json")
        self.assertEqual(res.status_code, 403)
        res = client.put(f"/api/roles/{target.pk}/permissions/", {"permissions": ["content.view"]}, format="json")
        self.assertEqual(res.status_code, 200)

    def test_cannot_edit_a_role_more_powerful_than_yours(self):
        mgr = make_role("ROLE_MGR2", ["roles.view", "roles.edit", "roles.assign_permissions"], parent="USER")
        manager = User.objects.create_user("mgr2", password="x12345678", role=mgr)
        client = self.as_user(manager)
        admin_role = Role.objects.get(name="ADMIN")
        self.assertEqual(client.patch(f"/api/roles/{admin_role.pk}/", {"description": "pwned"}, format="json").status_code, 403)
        self.assertEqual(client.put(f"/api/roles/{admin_role.pk}/permissions/", {"permissions": []}, format="json").status_code, 403)

    def test_cannot_pick_a_parent_that_grants_more_than_you_hold(self):
        mgr = make_role("ROLE_MGR3", ["roles.view", "roles.create"], parent="USER")
        manager = User.objects.create_user("mgr3", password="x12345678", role=mgr)
        res = self.as_user(manager).post("/api/roles/", {"name": "SNEAKY", "parent": "ADMIN"}, format="json")
        self.assertEqual(res.status_code, 400)


class SystemProtectionTests(Base):
    def setUp(self):
        self.admin = self.as_user(self.carol)

    def test_system_roles_cannot_be_deleted_or_renamed(self):
        role = Role.objects.get(name="USER")
        self.assertEqual(self.admin.delete(f"/api/roles/{role.pk}/").status_code, 409)
        self.assertEqual(self.admin.patch(f"/api/roles/{role.pk}/", {"name": "PEASANT"}, format="json").status_code, 400)

    def test_system_role_keeps_baseline_but_can_gain_permissions(self):
        editor = Role.objects.get(name="EDITOR")
        own = list(editor.permissions.values_list("codename", flat=True))
        res = self.admin.put(f"/api/roles/{editor.pk}/permissions/", {"permissions": own[:-1]}, format="json")
        self.assertEqual(res.status_code, 409)
        res = self.admin.put(f"/api/roles/{editor.pk}/permissions/", {"permissions": own + ["users.view"]}, format="json")
        self.assertEqual(res.status_code, 200)

    def test_seed_does_not_wipe_ui_changes(self):
        editor = Role.objects.get(name="EDITOR")
        editor.permissions.add(Permission.objects.get(codename="users.view"))
        call_command("seed_rbac", verbosity=0)
        self.assertTrue(editor.permissions.filter(codename="users.view").exists())

    def test_system_permissions_cannot_be_deleted_or_renamed(self):
        perm = Permission.objects.get(codename="content.view")
        self.assertEqual(self.admin.delete(f"/api/permissions/{perm.pk}/").status_code, 409)
        self.assertEqual(self.admin.patch(f"/api/permissions/{perm.pk}/", {"codename": "x.y"}, format="json").status_code, 400)

    def test_role_in_use_or_with_children_cannot_be_deleted(self):
        parent = make_role("PARENT", ["content.view"])
        make_role("KID", parent="PARENT")
        self.assertEqual(self.admin.delete(f"/api/roles/{parent.pk}/").status_code, 409)
        used = make_role("USED")
        User.objects.create_user("u1", password="x12345678", role=used)
        self.assertEqual(self.admin.delete(f"/api/roles/{used.pk}/").status_code, 409)
        free = make_role("FREE")
        self.assertEqual(self.admin.delete(f"/api/roles/{free.pk}/").status_code, 204)

    def test_self_protection(self):
        me = self.carol.pk
        self.assertEqual(self.admin.delete(f"/api/users/{me}/").status_code, 400)
        self.assertEqual(self.admin.patch(f"/api/users/{me}/role/", {"role": "USER"}, format="json").status_code, 400)
        self.assertEqual(self.admin.patch(f"/api/users/{me}/", {"is_active": False}, format="json").status_code, 400)


class CrudTests(Base):
    def setUp(self):
        self.admin = self.as_user(self.carol)

    def test_permission_crud(self):
        res = self.admin.post("/api/permissions/", {"codename": "reports.view", "description": "Reports"}, format="json")
        self.assertEqual(res.status_code, 201)
        pk = res.data["id"]
        self.assertFalse(res.data["is_system"])
        self.assertEqual(self.admin.post("/api/permissions/", {"codename": "Bad Name"}, format="json").status_code, 400)
        self.assertEqual(self.admin.patch(f"/api/permissions/{pk}/", {"description": "Report pages"}, format="json").status_code, 200)
        self.assertEqual(self.admin.delete(f"/api/permissions/{pk}/").status_code, 204)

    def test_role_crud_and_permission_assignment(self):
        res = self.admin.post("/api/roles/", {"name": "MODERATOR", "description": "Mods", "parent": "EDITOR"}, format="json")
        self.assertEqual(res.status_code, 201)
        pk = res.data["id"]
        self.assertEqual(self.admin.post("/api/roles/", {"name": "lower"}, format="json").status_code, 400)
        res = self.admin.put(f"/api/roles/{pk}/permissions/", {"permissions": ["users.view"]}, format="json")
        self.assertEqual(res.data["own_permissions"], ["users.view"])
        self.assertIn("content.edit", res.data["effective_permissions"])   # inherited
        self.assertEqual(self.admin.put(f"/api/roles/{pk}/permissions/", {"permissions": ["nope.nope"]}, format="json").status_code, 400)
        self.assertEqual(self.admin.patch(f"/api/roles/{pk}/", {"description": "Moderators"}, format="json").status_code, 200)
        self.assertEqual(self.admin.delete(f"/api/roles/{pk}/").status_code, 204)

    def test_user_crud(self):
        res = self.admin.post("/api/users/", {"username": "dave", "email": "d@x.com", "password": "password123"}, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["role"], "USER")        # default role
        pk = res.data["id"]
        res = self.admin.post("/api/users/", {"username": "erin", "password": "password123", "role": "EDITOR"}, format="json")
        self.assertEqual(res.data["role"], "EDITOR")
        self.assertEqual(self.admin.patch(f"/api/users/{pk}/", {"email": "new@x.com"}, format="json").status_code, 200)
        self.assertEqual(User.objects.get(pk=pk).email, "new@x.com")
        self.assertEqual(self.admin.patch(f"/api/users/{pk}/role/", {"role": "EDITOR"}, format="json").data["role"], "EDITOR")
        self.assertEqual(self.admin.delete(f"/api/users/{pk}/").status_code, 204)

    def test_password_reset_signs_the_user_out(self):
        Token.objects.create(user=self.alice)
        self.admin.patch(f"/api/users/{self.alice.pk}/", {"password": "brandnewpass1"}, format="json")
        self.assertFalse(Token.objects.filter(user=self.alice).exists())

    def test_registering_never_lets_you_choose_a_role(self):
        res = APIClient().post("/api/auth/register/", {"username": "z", "password": "password123", "role": "ADMIN"}, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["user"]["role"], "USER")


class AuditTests(Base):
    def test_changes_are_logged_with_actor_and_details(self):
        self.as_user(self.carol).patch(f"/api/users/{self.alice.pk}/role/", {"role": "EDITOR"}, format="json")
        entry = AuditLog.objects.get(action="user.role_change")
        self.assertEqual(entry.actor, self.carol)
        self.assertEqual(entry.target_repr, "alice")
        self.assertEqual(entry.details, {"from": "USER", "to": "EDITOR"})

    def test_denied_attempts_are_logged(self):
        self.as_user(self.alice).get("/api/users/")
        entry = AuditLog.objects.get(action="access.denied")
        self.assertEqual(entry.actor_name, "alice")
        self.assertEqual(entry.details["required"], "users.view")

    def test_login_success_and_failure_are_logged(self):
        client = APIClient()
        client.post("/api/auth/login/", {"username": "alice", "password": "demo12345"}, format="json")
        client.post("/api/auth/login/", {"username": "alice", "password": "wrong"}, format="json")
        self.assertTrue(AuditLog.objects.filter(action="auth.login", actor_name="alice").exists())
        failed = AuditLog.objects.get(action="auth.login_failed")
        self.assertNotIn("wrong", str(failed.details))      # passwords are never logged

    def test_password_values_are_never_logged(self):
        self.as_user(self.carol).patch(f"/api/users/{self.alice.pk}/", {"password": "supersecret99"}, format="json")
        entry = AuditLog.objects.get(action="user.update")
        self.assertTrue(entry.details["password_reset"])
        self.assertNotIn("supersecret99", str(entry.details))

    def test_log_survives_deleting_the_actor(self):
        extra = User.objects.create_user("temp", password="x12345678", role=Role.objects.get(name="ADMIN"))
        self.as_user(extra).post("/api/roles/", {"name": "KEEPER"}, format="json")
        extra.delete()
        entry = AuditLog.objects.get(action="role.create")
        self.assertIsNone(entry.actor)
        self.assertEqual(entry.actor_name, "temp")

    def test_audit_endpoint_filters(self):
        admin = self.as_user(self.carol)
        admin.post("/api/roles/", {"name": "X1"}, format="json")
        res = admin.get("/api/audit/?action=role.")
        self.assertTrue(res.data and all(e["action"].startswith("role.") for e in res.data))