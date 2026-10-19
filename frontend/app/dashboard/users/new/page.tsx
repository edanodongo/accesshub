import Link from "next/link";
import { createUserAction } from "@/app/actions/users";
import UserForm from "@/components/UserForm";
import { can } from "@/lib/access";
import { apiFetch } from "@/lib/api";
import { requireAccess } from "@/lib/guards";
import type { RoleInfo } from "@/lib/types";

export default async function NewUserPage() {
  const me = await requireAccess({ permission: "users.create" });

  // Choosing a role at creation needs users.change_role (and roles.view to list them).
  let roleOptions: string[] = [];
  if (can(me, "users.change_role") && can(me, "roles.view")) {
    const res = await apiFetch("/roles/");
    const roles: RoleInfo[] = res.ok ? await res.json() : [];
    roleOptions = roles
      .filter((r) => r.effective_permissions.every((p) => me.permissions.includes(p)))
      .map((r) => r.name);
  }

  return (
    <div className="max-w-xl">
      <Link href="/dashboard/users" className="text-sm text-gray-500 hover:underline">← Users</Link>
      <h1 className="mt-2 text-2xl font-bold">New user</h1>
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <UserForm action={createUserAction} mode="create" roleOptions={roleOptions} canEdit />
      </div>
    </div>
  );
}