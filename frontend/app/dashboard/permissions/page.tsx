import CreatePermissionForm from "@/components/CreatePermissionForm";
import PermissionRow from "@/components/PermissionRow";
import { apiFetch } from "@/lib/api";
import { requireAccess } from "@/lib/guards";
import { card } from "@/lib/ui";
import type { PermissionInfo } from "@/lib/types";

export default async function PermissionsPage() {
  await requireAccess({ permission: "permissions.manage" });
  const res = await apiFetch("/permissions/");
  const permissions: PermissionInfo[] = res.ok ? await res.json() : [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Permissions</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">
          Built-in permissions are checked by the application code, so they cannot be renamed or
          deleted. Custom ones do nothing on their own until some code checks for them, but you can
          already assign them to roles and see them in the access tester.
        </p>
      </header>

      <section className={card}>
        <h2 className="mb-4 font-semibold">Create a permission</h2>
        <CreatePermissionForm />
      </section>

      <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-left text-sm">
        <thead className="bg-gray-100 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Codename</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {permissions.map((p) => <PermissionRow key={p.id} permission={p} />)}
        </tbody>
      </table>
    </div>
  );
}