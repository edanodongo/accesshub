import Link from "next/link";
import { createRoleAction } from "@/app/actions/roles";
import RoleForm from "@/components/RoleForm";
import { apiFetch } from "@/lib/api";
import { requireAccess } from "@/lib/guards";
import type { RoleInfo } from "@/lib/types";

export default async function NewRolePage() {
  const me = await requireAccess({ permission: "roles.create" });
  const res = await apiFetch("/roles/");
  const roles: RoleInfo[] = res.ok ? await res.json() : [];

  // You may only pick a parent whose permissions you hold yourself (the server enforces this too).
  const parents = roles
    .filter((r) => r.effective_permissions.every((p) => me.permissions.includes(p)))
    .map((r) => r.name);

  return (
    <div className="max-w-xl">
      <Link href="/dashboard/roles" className="text-sm text-gray-500 hover:underline">← Roles</Link>
      <h1 className="mt-2 text-2xl font-bold">New role</h1>
      <p className="mt-1 text-sm text-gray-600">
        Create the role first, then choose its permissions on the next screen.
      </p>
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <RoleForm action={createRoleAction} parentOptions={parents} canEdit submitLabel="Create role" />
      </div>
    </div>
  );
}