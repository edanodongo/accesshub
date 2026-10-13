import { requireAccess } from "@/lib/guards";

export default async function ProfilePage() {
  const user = await requireAccess({ permission: "profile.view" });

  return (
    <div>
      <h1 className="text-2xl font-bold">Profile</h1>
      <dl className="mt-6 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
        {[
          ["Username", user.username],
          ["Email", user.email || "(none)"],
          ["Role", user.role ?? "none"],
        ].map(([label, value]) => (
          <div key={label} className="flex px-5 py-3 text-sm">
            <dt className="w-32 text-gray-500">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <h2 className="mt-8 text-sm font-semibold">Raw response from /api/auth/me/</h2>
      <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-green-300">
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  );
}