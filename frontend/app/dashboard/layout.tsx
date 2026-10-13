import Sidebar from "@/components/Sidebar";
import { requireUser } from "@/lib/guards";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 bg-gray-50 p-8">{children}</main>
    </div>
  );
}