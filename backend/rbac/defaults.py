"""Built-in permissions, roles and demo users. Single source of truth for the seed
command AND for the API rules that protect built-in ("system") roles."""

PERMISSIONS = {
    "dashboard.view": "See the dashboard",
    "profile.view": "See own profile",
    "content.view": "Read content",
    "content.create": "Create content",
    "content.edit": "Edit content",
    "users.view": "List all users",
    "users.create": "Create users",
    "users.edit": "Edit users (email, active status, password reset)",
    "users.delete": "Delete users",
    "users.change_role": "Change a user's role",
    "roles.view": "See roles and their permissions",
    "roles.create": "Create roles",
    "roles.edit": "Edit roles (name, description, parent)",
    "roles.delete": "Delete roles",
    "roles.assign_permissions": "Choose which permissions a role grants",
    "permissions.manage": "Create, edit and delete permissions",
    "audit.view": "Read the audit log",
}

# (name, parent name, description, permissions granted directly)
ROLES = [
    ("USER", None, "Standard user",
     ["dashboard.view", "profile.view", "content.view"]),
    ("EDITOR", "USER", "Can create and edit content",
     ["content.create", "content.edit"]),
    ("ADMIN", "EDITOR", "Can manage users, roles and permissions",
     ["users.view", "users.create", "users.edit", "users.delete", "users.change_role",
      "roles.view", "roles.create", "roles.edit", "roles.delete",
      "roles.assign_permissions", "permissions.manage", "audit.view"]),
]

SYSTEM_ROLE_BASELINE = {name: set(perms) for name, _parent, _desc, perms in ROLES}

DEMO_USERS = [
    ("alice", "alice@example.com", "USER"),
    ("bob", "bob@example.com", "EDITOR"),
    ("carol", "carol@example.com", "ADMIN"),
]
DEMO_PASSWORD = "demo12345"