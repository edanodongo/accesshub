export type Probe = {
  key: string;
  label: string;
  method: "GET" | "POST" | "PUT" | "PATCH";
  path: string;
  permission: string | null; // null = any logged-in user
  body?: unknown;
};

// ":me" is replaced with your own user id on the server.
// Changing your own role is always refused with a 400. So a 400 here means
// "permission check PASSED, request rejected for another reason", and 403 means denied.
export const PROBES: Probe[] = [
  { key: "me", label: "Who am I", method: "GET", path: "/auth/me/", permission: null },
  { key: "content_view", label: "Read content", method: "GET", path: "/content/", permission: "content.view" },
  { key: "content_create", label: "Create content", method: "POST", path: "/content/create/", permission: "content.create", body: { title: "Probe" } },
  { key: "content_edit", label: "Edit content", method: "PUT", path: "/content/1/edit/", permission: "content.edit", body: {} },
  { key: "users_view", label: "List users", method: "GET", path: "/users/", permission: "users.view" },
  { key: "roles_view", label: "List roles", method: "GET", path: "/roles/", permission: "roles.view" },
  { key: "users_change_role", label: "Change a role (safe self-probe)", method: "PATCH", path: "/users/:me/role/", permission: "users.change_role", body: { role: "USER" } },
];