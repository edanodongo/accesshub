import Link from "next/link";
import Badge from "@/components/Badge";
import RoleChanger from "@/components/RoleChanger";
import { can } from "@/lib/access";
import { apiFetch } from "@/lib/api";
import { requireAccess } from "@/lib/guards";
import { btnGhost, btnPrimary } from "@/lib/ui";
import type { RoleInfo, User } from "@/lib/types";

export default async function UsersPage() {
  const me = await requireAccess({ permission: "users.view" });

  const usersRes = await apiFetch("/users/");
  const users: User[] = usersRes.ok ? await usersRes.json() : [];

  // The role dropdown needs the role list, which needs roles.view
  let roles: RoleInfo[] = [];
  if (can(me, "roles.view")) {
    const rolesRes = await apiFetch("/roles/");
    if (rolesRes.ok) roles = await rolesRes.json();
  }
  // Only offer roles no more powerful than yours (the server enforces this as well).
  const grantable = new Set(
    roles.filter((r) => r.effective_permissions.every((p) => me.permissions.includes(p))).map((r) => r.name)
  );
  const canChange = can(me, "users.change_role") && roles.length > 0;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="mt-1 text-sm text-gray-600">
            {canChange
              ? "You can change roles. You cannot change your own, or anyone more powerful than you."
              : "Role changes are disabled: you lack users.change_role."}
          </p>
        </div>
        {can(me, "users.create") ? (
          <Link href="/dashboard/users/new" className={btnPrimary}>New user</Link>
        ) : (
          <span className="text-xs text-gray-500" title="Requires users.create">🔒 New user</span>
        )}
      </div>

      <table className="mt-6 w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-left text-sm">
        <thead className="bg-gray-100 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Perms</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map((u) => {
            const options = roles.map((r) => r.name).filter((n) => grantable.has(n) || n === u.role);
            return (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium">
                  {u.username} {u.id === me.id && <span className="text-xs text-gray-400">(you)</span>}{" "}
                  {!u.is_active && <Badge tone="red">inactive</Badge>}
                </td>
                <td className="px-4 py-3 text-gray-600">{u.email || "-"}</td>
                <td className="px-4 py-3">
                  {canChange ? (
                    <RoleChanger userId={u.id} current={u.role} roles={options} disabled={u.id === me.id} />
                  ) : (
                    u.role ?? "none"
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{u.permissions.length}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/dashboard/users/${u.id}`} className={btnGhost}>
                    {can(me, "users.edit") || can(me, "users.delete") ? "Manage" : "View"}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}