import Badge from "@/components/Badge";
import { requireUser } from "@/lib/guards";

export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{ need?: string }>;
}) {
  const user = await requireUser();
  const { need } = await searchParams;

  return (
    <div className="mx-auto max-w-lg rounded-lg border border-red-200 bg-white p-8 text-center">
      <p className="text-5xl font-bold text-red-600">403</p>
      <h1 className="mt-2 text-xl font-semibold">Access denied</h1>
      <p className="mt-2 text-sm text-gray-600">
        That page requires <b>{need ?? "additional access"}</b>.
      </p>
      <div className="mt-6 text-left">
        <p className="text-xs uppercase text-gray-500">You are {user.username} ({user.role ?? "no role"}) with:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {user.permissions.map((p) => <Badge key={p}>{p}</Badge>)}
        </div>
      </div>
    </div>
  );
}