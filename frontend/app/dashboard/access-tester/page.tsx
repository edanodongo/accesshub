import Link from "next/link";
import Badge from "@/components/Badge";
import ProbePanel from "@/components/ProbePanel";
import { apiFetch } from "@/lib/api";
import { requireUser } from "@/lib/guards";
import { NAV_ITEMS, isAllowed, requirementOf } from "@/lib/nav";
import type { PermissionInfo } from "@/lib/types";

export default async function AccessTesterPage() {
  const user = await requireUser();
  const res = await apiFetch("/permissions/");
  const catalog: PermissionInfo[] = res.ok ? await res.json() : [];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-bold">Access tester</h1>
        <p className="mt-1 text-sm text-gray-600">
          Signed in as <b>{user.username}</b> with role <b>{user.role ?? "none"}</b>. Log in as
          different users to compare results.
        </p>
      </header>

      <section>
        <h2 className="font-semibold">1. Permission matrix</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {catalog.map((p) => {
            const granted = user.permissions.includes(p.codename);
            return (
              <div key={p.codename} className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-2">
                <div>
                  <p className="font-mono text-sm">{p.codename}</p>
                  <p className="text-xs text-gray-500">{p.description}</p>
                </div>
                <Badge tone={granted ? "green" : "red"}>{granted ? "granted" : "denied"}</Badge>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-semibold">2. Page access</h2>
        <p className="mt-1 text-sm text-gray-600">
          Click through to locked pages to watch the page-level guard redirect you.
        </p>
        <table className="mt-3 w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-left text-sm">
          <tbody className="divide-y divide-gray-200">
            {NAV_ITEMS.map((item) => {
              const allowed = isAllowed(user, item);
              return (
                <tr key={item.href}>
                  <td className="px-4 py-3 font-medium">{item.label}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{requirementOf(item)}</td>
                  <td className="px-4 py-3"><Badge tone={allowed ? "green" : "red"}>{allowed ? "open" : "locked"}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <Link href={item.href} className="text-xs underline">Visit →</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="font-semibold">3. Real API calls</h2>
        <p className="mb-3 mt-1 text-sm text-gray-600">
          Each button calls Django with your token. A ⚠️ MISMATCH would mean the UI and the server
          disagree, which is exactly the kind of bug this page exists to catch.
        </p>
        <ProbePanel permissions={user.permissions} />
      </section>
    </div>
  );
}