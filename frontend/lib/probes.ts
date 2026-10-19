export type Probe = {
  key: string;
  label: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  permission: string | null; // null = any logged-in user
  body?: unknown;
};

// These probes are SAFE: the dangerous ones send an empty body or id 0, so nothing is changed.
// Django checks permission first. So 403 = denied. Anything else (400 invalid, 404 not found,
// 200 ok) means the permission check PASSED and the request failed or succeeded afterwards.
// ":me" is replaced with your own user id on the server (changing your own role is always a 400).
export const PROBES: Probe[] = [
  { key: "me", label: "Who am I", method: "GET", path: "/auth/me/", permission: null },
  { key: "content_view", label: "Read content", method: "GET", path: "/content/", permission: "content.view" },
  { key: "content_create", label: "Create content", method: "POST", path: "/content/create/", permission: "content.create", body: { title: "Probe" } },
  { key: "content_edit", label: "Edit content", method: "PUT", path: "/content/1/edit/", permission: "content.edit", body: {} },
  { key: "users_view", label: "List users", method: "GET", path: "/users/", permission: "users.view" },
  { key: "users_create", label: "Create user (empty body)", method: "POST", path: "/users/", permission: "users.create", body: {} },
  { key: "users_edit", label: "Edit user 0", method: "PATCH", path: "/users/0/", permission: "users.edit", body: {} },
  { key: "users_delete", label: "Delete user 0", method: "DELETE", path: "/users/0/", permission: "users.delete" },
  { key: "users_change_role", label: "Change a role (safe self-probe)", method: "PATCH", path: "/users/:me/role/", permission: "users.change_role", body: { role: "USER" } },
  { key: "roles_view", label: "List roles", method: "GET", path: "/roles/", permission: "roles.view" },
  { key: "roles_create", label: "Create role (empty body)", method: "POST", path: "/roles/", permission: "roles.create", body: {} },
  { key: "roles_edit", label: "Edit role 0", method: "PATCH", path: "/roles/0/", permission: "roles.edit", body: {} },
  { key: "roles_delete", label: "Delete role 0", method: "DELETE", path: "/roles/0/", permission: "roles.delete" },
  { key: "roles_assign", label: "Assign permissions to role 0", method: "PUT", path: "/roles/0/permissions/", permission: "roles.assign_permissions", body: { permissions: [] } },
  { key: "perms_manage", label: "Create permission (empty body)", method: "POST", path: "/permissions/", permission: "permissions.manage", body: {} },
  { key: "audit_view", label: "Read audit log", method: "GET", path: "/audit/", permission: "audit.view" },
];