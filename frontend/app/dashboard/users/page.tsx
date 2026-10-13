import RoleChanger from "@/components/RoleChanger";
import { can } from "@/lib/access";
import { apiFetch } from "@/lib/api";
import { requireAccess } from "@/lib/guards";
import type { RoleInfo, User } from "@/lib/types";

export default async function UsersPage() {
  const me = await requireAccess({ permission: "users.view" });

  const usersRes = await apiFetch("/users/");
  const users: User[] = usersRes.ok ? await usersRes.json() : [];

  // The role dropdown needs the role list, which needs roles.view
  let roleNames: string[] = [];
  if (can(me, "roles.view")) {
    const rolesRes = await apiFetch("/roles/");
    if (rolesRes.ok) roleNames = ((await rolesRes.json()) as RoleInfo[]).map((r) => r.name);
  }
  const canChange = can(me, "users.change_role") && roleNames.length > 0;

  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="mt-1 text-sm text-gray-600">
        {canChange
          ? "You can change roles. You cannot change your own."
          : "Read-only: you lack users.change_role."}
      </p>

      <table className="mt-6 w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-left text-sm">
        <thead className="bg-gray-100 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Permissions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3 font-medium">
                {u.username} {u.id === me.id && <span className="text-xs text-gray-400">(you)</span>}
              </td>
              <td className="px-4 py-3 text-gray-600">{u.email || "-"}</td>
              <td className="px-4 py-3">
                {canChange ? (
                  <RoleChanger
                    userId={u.id}
                    current={u.role}
                    roles={roleNames}
                    disabled={u.id === me.id}
                  />
                ) : (
                  u.role ?? "none"
                )}
              </td>
              <td className="px-4 py-3 text-gray-600">{u.permissions.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}