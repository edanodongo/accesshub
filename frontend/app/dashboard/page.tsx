import Badge from "@/components/Badge";
import { NAV_ITEMS, isAllowed } from "@/lib/nav";
import { requireAccess } from "@/lib/guards";

export default async function DashboardPage() {
  const user = await requireAccess({ permission: "dashboard.view" });
  const unlocked = NAV_ITEMS.filter((i) => isAllowed(user, i)).length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Welcome, {user.username}</h1>
        <p className="mt-1 text-sm text-gray-600">
          Everything below is read live from the Django API on each page load.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-xs uppercase text-gray-500">Role</p>
          <p className="mt-1 text-xl font-semibold">{user.role ?? "none"}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-xs uppercase text-gray-500">Permissions</p>
          <p className="mt-1 text-xl font-semibold">{user.permissions.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-xs uppercase text-gray-500">Pages unlocked</p>
          <p className="mt-1 text-xl font-semibold">{unlocked} / {NAV_ITEMS.length}</p>
        </div>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="font-semibold">Inheritance chain</h2>
        <p className="mt-1 text-sm text-gray-600">
          Your role plus every role it inherits from, child first.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {user.role_lineage.length === 0 && <span className="text-sm text-gray-500">No role assigned</span>}
          {user.role_lineage.map((name, i) => (
            <span key={name} className="flex items-center gap-2">
              <Badge tone={i === 0 ? "dark" : "light"}>{name}</Badge>
              {i < user.role_lineage.length - 1 && <span className="text-gray-400">→ inherits</span>}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="font-semibold">Your effective permissions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {user.permissions.map((p) => <Badge key={p} tone="green">{p}</Badge>)}
          {user.permissions.length === 0 && <span className="text-sm text-gray-500">None</span>}
        </div>
      </section>
    </div>
  );
}