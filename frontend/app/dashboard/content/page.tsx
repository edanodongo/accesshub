import { apiFetch } from "@/lib/api";
import { can } from "@/lib/access";
import { requireAccess } from "@/lib/guards";

type Post = { id: number; title: string };

function GatedButton({ allowed, permission, children }: {
  allowed: boolean; permission: string; children: React.ReactNode;
}) {
  return (
    <button
      disabled={!allowed}
      title={allowed ? undefined : `Requires ${permission}`}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm enabled:hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {allowed ? children : <>🔒 {children}</>}
    </button>
  );
}

export default async function ContentPage() {
  const user = await requireAccess({ permission: "content.view" });
  const res = await apiFetch("/content/");
  const posts: Post[] = res.ok ? await res.json() : [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content</h1>
        <GatedButton allowed={can(user, "content.create")} permission="content.create">
          New post
        </GatedButton>
      </div>

      <ul className="mt-6 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
        {posts.map((post) => (
          <li key={post.id} className="flex items-center justify-between px-5 py-3">
            <span className="text-sm">{post.title}</span>
            <GatedButton allowed={can(user, "content.edit")} permission="content.edit">
              Edit
            </GatedButton>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-gray-500">
        These buttons are placeholders. Use the Access tester to fire the real create and edit
        endpoints and see Django's verdict.
      </p>
    </div>
  );
}