import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold">AccessHub</Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-black">
                Dashboard
              </Link>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                {user.username} · {user.role ?? "no role"}
              </span>
              <form action={logoutAction}>
                <button className="text-sm text-gray-600 hover:text-black">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-600 hover:text-black">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}