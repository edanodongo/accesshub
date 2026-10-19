"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { NAV_ITEMS, isAllowed } from "@/lib/nav";
import type { User } from "@/lib/types";

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white p-4">
      <Link href="/" className="mb-6 px-2 text-xl font-bold">AccessHub</Link>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const allowed = isAllowed(user, item);
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                active
                  ? "bg-gray-900 text-white"
                  : allowed
                  ? "text-gray-800 hover:bg-gray-100"
                  : "text-gray-400 hover:bg-gray-50"
              }`}
            >
              {item.label}
              {!allowed && <span title="You lack access to this page">🔒</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 pt-4">
        <p className="px-2 text-sm font-medium">{user.username}</p>
        <p className="px-2 text-xs text-gray-500">{user.role ?? "no role"}</p>
        <form action={logoutAction} className="mt-3">
          <button className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}