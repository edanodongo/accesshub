import Link from "next/link";
import Badge from "@/components/Badge";
import { can } from "@/lib/access";
import { apiFetch } from "@/lib/api";
import { requireAccess } from "@/lib/guards";
import { btnGhost, btnPrimary } from "@/lib/ui";
import type { RoleInfo } from "@/lib/types";

export default async function RolesPage() {
  const me = await requireAccess({ permission: "roles.view" });
  const res = await apiFetch("/roles/");
  const roles: RoleInfo[] = res.ok ? await res.json() : [];

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Roles</h1>
          <p className="mt-1 text-sm text-gray-600">
            Dark badges are granted directly. Light badges are inherited from a parent.
          </p>
        </div>
        {can(me, "roles.create") ? (
          <Link href="/dashboard/roles/new" className={btnPrimary}>New role</Link>
        ) : (
          <span className="text-xs text-gray-500" title="Requires roles.create">🔒 New role</span>
        )}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {roles.map((role) => {
          const inherited = role.effective_permissions.filter((p) => !role.own_permissions.includes(p));
          return (
            <div key={role.id} className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold">
                  {role.name} {role.is_system && <Badge>built-in</Badge>}
                </h2>
                <span className="text-xs text-gray-500">
                  {role.parent ? `inherits ${role.parent}` : "base role"}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{role.description || "No description"}</p>
              <p className="mt-1 text-xs text-gray-500">{role.user_count} user(s)</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {role.own_permissions.map((p) => <Badge key={p} tone="dark">{p}</Badge>)}
                {inherited.map((p) => <Badge key={p}>{p}</Badge>)}
              </div>
              <div className="mt-4">
                <Link href={`/dashboard/roles/${role.id}`} className={btnGhost}>
                  {can(me, "roles.edit") || can(me, "roles.assign_permissions") ? "Manage" : "View"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}