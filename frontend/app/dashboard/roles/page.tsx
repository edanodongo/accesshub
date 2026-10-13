import Badge from "@/components/Badge";
import { apiFetch } from "@/lib/api";
import { requireAccess } from "@/lib/guards";
import type { RoleInfo } from "@/lib/types";

export default async function RolesPage() {
  await requireAccess({ permission: "roles.view" });
  const res = await apiFetch("/roles/");
  const roles: RoleInfo[] = res.ok ? await res.json() : [];

  return (
    <div>
      <h1 className="text-2xl font-bold">Roles</h1>
      <p className="mt-1 text-sm text-gray-600">
        Dark badges are granted directly. Light badges are inherited from a parent.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {roles.map((role) => {
          const inherited = role.effective_permissions.filter(
            (p) => !role.own_permissions.includes(p)
          );
          return (
            <div key={role.id} className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold">{role.name}</h2>
                <span className="text-xs text-gray-500">
                  {role.parent ? `inherits ${role.parent}` : "base role"}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{role.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {role.own_permissions.map((p) => <Badge key={p} tone="dark">{p}</Badge>)}
                {inherited.map((p) => <Badge key={p}>{p}</Badge>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}