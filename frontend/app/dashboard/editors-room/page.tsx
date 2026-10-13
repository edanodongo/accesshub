import Badge from "@/components/Badge";
import { requireAccess } from "@/lib/guards";

export default async function EditorsRoomPage() {
  const user = await requireAccess({ role: "EDITOR" });

  return (
    <div>
      <h1 className="text-2xl font-bold">Editors' room ✍️</h1>
      <p className="mt-2 max-w-xl text-sm text-gray-600">
        This page is gated by the <b>EDITOR role</b>, not a permission. You're in because EDITOR
        appears in your inheritance chain:
      </p>
      <div className="mt-4 flex gap-2">
        {user.role_lineage.map((r) => (
          <Badge key={r} tone={r === "EDITOR" ? "green" : "light"}>{r}</Badge>
        ))}
      </div>
      <p className="mt-4 text-xs text-gray-500">
        Try it as alice (blocked) and carol (allowed, since ADMIN inherits EDITOR).
      </p>
    </div>
  );
}