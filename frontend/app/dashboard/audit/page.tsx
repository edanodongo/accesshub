import Badge from "@/components/Badge";
import { apiFetch } from "@/lib/api";
import { requireAccess } from "@/lib/guards";
import { btnGhost, inputCls } from "@/lib/ui";
import type { AuditEntry } from "@/lib/types";

const FILTERS = [
  ["", "Everything"],
  ["access.denied", "Denied attempts"],
  ["auth.", "Logins and logouts"],
  ["user.", "User changes"],
  ["role.", "Role changes"],
  ["permission.", "Permission changes"],
];

function tone(action: string) {
  if (action === "access.denied" || action === "auth.login_failed" || action.endsWith(".delete")) return "red";
  if (action.startsWith("auth.")) return "light";
  return "green";
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; actor?: string }>;
}) {
  await requireAccess({ permission: "audit.view" });
  const { action = "", actor = "" } = await searchParams;

  const qs = new URLSearchParams({ limit: "200" });
  if (action) qs.set("action", action);
  if (actor) qs.set("actor", actor);
  const res = await apiFetch(`/audit/?${qs}`);
  const entries: AuditEntry[] = res.ok ? await res.json() : [];

  return (
    <div>
      <h1 className="text-2xl font-bold">Audit log</h1>
      <p className="mt-1 text-sm text-gray-600">
        Newest first, last 200 entries. Entries are written by the server in the same step as the change itself.
      </p>

      {/* A plain GET form: the filters live in the URL, so no client code is needed */}
      <form className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="action" className="text-xs text-gray-500">Type</label>
          <select id="action" name="action" defaultValue={action} className={inputCls}>
            {FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="actor" className="text-xs text-gray-500">Actor contains</label>
          <input id="actor" name="actor" defaultValue={actor} className={inputCls} />
        </div>
        <button className={btnGhost}>Filter</button>
      </form>

      <table className="mt-6 w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-left text-sm">
        <thead className="bg-gray-100 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">When (UTC)</th>
            <th className="px-4 py-3">Actor</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Target</th>
            <th className="px-4 py-3">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {entries.map((e) => (
            <tr key={e.id} className="align-top">
              <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                {e.created_at.replace("T", " ").slice(0, 19)}
              </td>
              <td className="px-4 py-3">{e.actor_name || "-"}</td>
              <td className="px-4 py-3"><Badge tone={tone(e.action)}>{e.action}</Badge></td>
              <td className="px-4 py-3 text-gray-700">{e.target_repr || "-"}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-500 break-all">
                {Object.keys(e.details).length ? JSON.stringify(e.details) : ""}
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No entries.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}