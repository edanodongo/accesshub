import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteRoleAction, setRolePermissionsAction, updateRoleAction } from "@/app/actions/roles";
import Badge from "@/components/Badge";
import ConfirmButton from "@/components/ConfirmButton";
import PermissionChecklist from "@/components/PermissionChecklist";
import RoleForm from "@/components/RoleForm";
import { can } from "@/lib/access";
import { apiFetch } from "@/lib/api";
import { requireAccess } from "@/lib/guards";
import { card } from "@/lib/ui";
import type { PermissionInfo, RoleInfo } from "@/lib/types";

export default async function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireAccess({ permission: "roles.view" });
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const [roleRes, rolesRes, permsRes] = await Promise.all([
    apiFetch(`/roles/${id}/`),
    apiFetch("/roles/"),
    apiFetch("/permissions/"),
  ]);
  if (roleRes.status === 404) notFound();
  if (!roleRes.ok) throw new Error("Could not load the role.");

  const role: RoleInfo = await roleRes.json();
  const roles: RoleInfo[] = rolesRes.ok ? await rolesRes.json() : [];
  const catalog: PermissionInfo[] = permsRes.ok ? await permsRes.json() : [];

  const parent = roles.find((r) => r.name === role.parent);
  const inherited = parent?.effective_permissions ?? [];

  // Can I touch this role? Only if I hold every permission it grants (the server checks too).
  const strongEnough = role.effective_permissions.every((p) => me.permissions.includes(p));
  const canEdit = can(me, "roles.edit") && strongEnough;
  const canAssign = can(me, "roles.assign_permissions") && strongEnough;
  const canDelete = can(me, "roles.delete") && strongEnough && !role.is_system;

  const parentOptions = roles
    .filter((r) => r.name !== role.name && r.effective_permissions.every((p) => me.permissions.includes(p)))
    .map((r) => r.name);
  // keep the current parent selectable even if it is above you, so the form shows it correctly
  if (role.parent && !parentOptions.includes(role.parent)) parentOptions.push(role.parent);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link href="/dashboard/roles" className="text-sm text-gray-500 hover:underline">← Roles</Link>
        <h1 className="mt-2 text-2xl font-bold">
          {role.name} {role.is_system && <Badge>built-in</Badge>}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {role.user_count} user(s) · {role.effective_permissions.length} effective permission(s)
        </p>
        {!strongEnough && (
          <p className="mt-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            This role grants permissions you do not hold, so you can view it but not change it.
          </p>
        )}
      </div>

      <section className={card}>
        <h2 className="mb-4 font-semibold">Details</h2>
        <RoleForm
          key={`${role.name}|${role.description}|${role.parent}`}
          action={updateRoleAction.bind(null, role.id)}
          role={role}
          parentOptions={parentOptions}
          canEdit={canEdit}
          submitLabel="Save details"
        />
      </section>

      <section className={card}>
        <h2 className="font-semibold">Permissions</h2>
        <p className="mb-4 mt-1 text-sm text-gray-600">
          Tick what this role grants directly. Greyed, ticked boxes come from the parent role.
          {role.is_system && " Built-in roles can gain permissions but never lose their original ones."}
        </p>
        <PermissionChecklist
          key={role.own_permissions.join(",") + "|" + inherited.join(",")}
          action={setRolePermissionsAction.bind(null, role.id)}
          catalog={catalog}
          own={role.own_permissions}
          inherited={inherited}
          mine={me.permissions}
          canEdit={canAssign}
        />
      </section>

      <section className="rounded-lg border border-red-200 bg-white p-5">
        <h2 className="font-semibold text-red-700">Danger zone</h2>
        <p className="mb-3 mt-1 text-sm text-gray-600">
          A role can be deleted only when no user has it and no other role inherits from it.
        </p>
        <ConfirmButton
          action={deleteRoleAction.bind(null, role.id)}
          label="Delete role"
          confirmText={`Delete the role ${role.name}?`}
          disabled={!canDelete}
          title={
            role.is_system ? "Built-in roles cannot be deleted"
              : !can(me, "roles.delete") ? "Requires roles.delete"
              : !strongEnough ? "This role is more powerful than yours"
              : undefined
          }
        />
      </section>
    </div>
  );
}