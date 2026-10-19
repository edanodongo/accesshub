import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteUserAction, updateUserAction } from "@/app/actions/users";
import Badge from "@/components/Badge";
import ConfirmButton from "@/components/ConfirmButton";
import RoleChanger from "@/components/RoleChanger";
import UserForm from "@/components/UserForm";
import { can } from "@/lib/access";
import { apiFetch } from "@/lib/api";
import { requireAccess } from "@/lib/guards";
import { card } from "@/lib/ui";
import type { RoleInfo, User } from "@/lib/types";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireAccess({ permission: "users.view" });
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const res = await apiFetch(`/users/${id}/`);
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error("Could not load the user.");
  const user: User = await res.json();

  let roles: RoleInfo[] = [];
  if (can(me, "roles.view")) {
    const r = await apiFetch("/roles/");
    if (r.ok) roles = await r.json();
  }

  const isSelf = user.id === me.id;
  // Can I manage this person? Only if I hold everything their role grants (the server checks too).
  const strongEnough = user.permissions.every((p) => me.permissions.includes(p));
  const canEdit = can(me, "users.edit") && strongEnough;
  const canDelete = can(me, "users.delete") && strongEnough && !isSelf;
  const canChangeRole = can(me, "users.change_role") && strongEnough && !isSelf && roles.length > 0;
  const grantable = roles
    .filter((r) => r.name === user.role || r.effective_permissions.every((p) => me.permissions.includes(p)))
    .map((r) => r.name);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/dashboard/users" className="text-sm text-gray-500 hover:underline">← Users</Link>
        <h1 className="mt-2 text-2xl font-bold">
          {user.username} {isSelf && <span className="text-sm font-normal text-gray-400">(you)</span>}{" "}
          {!user.is_active && <Badge tone="red">inactive</Badge>}
        </h1>
        {!strongEnough && !isSelf && (
          <p className="mt-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            This user is more powerful than you, so you can view them but not change them.
          </p>
        )}
      </div>

      <section className={card}>
        <h2 className="mb-4 font-semibold">Account</h2>
        <UserForm
          key={`${user.email}|${user.is_active}`}
          action={updateUserAction.bind(null, user.id)}
          mode="edit"
          user={user}
          canEdit={canEdit}
          isSelf={isSelf}
        />
      </section>

      <section className={card}>
        <h2 className="font-semibold">Role</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {user.role_lineage.map((r, i) => (
            <Badge key={r} tone={i === 0 ? "dark" : "light"}>{r}</Badge>
          ))}
          {user.role_lineage.length === 0 && <span className="text-sm text-gray-500">No role</span>}
        </div>
        <div className="mt-4">
          {canChangeRole ? (
            <RoleChanger userId={user.id} current={user.role} roles={grantable} disabled={false} />
          ) : (
            <p className="text-xs text-gray-500">🔒 You cannot change this user&apos;s role.</p>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {user.permissions.map((p) => <Badge key={p} tone="green">{p}</Badge>)}
        </div>
      </section>

      <section className="rounded-lg border border-red-200 bg-white p-5">
        <h2 className="font-semibold text-red-700">Danger zone</h2>
        <div className="mt-3">
          <ConfirmButton
            action={deleteUserAction.bind(null, user.id)}
            label="Delete user"
            confirmText={`Permanently delete ${user.username}?`}
            disabled={!canDelete}
            title={
              isSelf ? "You cannot delete yourself"
                : !can(me, "users.delete") ? "Requires users.delete"
                : !strongEnough ? "This user is more powerful than you"
                : undefined
            }
          />
        </div>
      </section>
    </div>
  );
}