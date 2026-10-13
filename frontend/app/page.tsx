import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";

// Illustrative copy of our seeded roles. The live truth is in the database.
const roles = [
  { name: "USER", inherits: null, grants: ["dashboard.view", "profile.view", "content.view"] },
  { name: "EDITOR", inherits: "USER", grants: ["content.create", "content.edit"] },
  { name: "ADMIN", inherits: "EDITOR", grants: ["users.view", "users.change_role", "roles.view"] },
];

const features = [
  {
    title: "Custom roles",
    description: "Define your own roles instead of being locked into a fixed set.",
  },
  {
    title: "Role inheritance",
    description: "Child roles automatically receive everything their parent can do.",
  },
  {
    title: "Server-enforced permissions",
    description: "Hiding a button is cosmetic. Django checks every API call.",
  },
];

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-6">
        <section className="py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight">Access control, made simple.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Give every user the right level of access, nothing more and nothing less.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            {user ? (
              <Link href="/dashboard" className="rounded-md bg-black px-6 py-3 text-white hover:bg-gray-800">
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link href="/register" className="rounded-md bg-black px-6 py-3 text-white hover:bg-gray-800">
                  Create an account
                </Link>
                <Link href="/login" className="rounded-md border border-gray-300 px-6 py-3 hover:bg-gray-50">
                  Log in
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="pb-20">
          <h2 className="text-center text-2xl font-bold">Roles that build on each other</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-gray-600">
            Each role lists only what it adds. Everything else flows down from its parent.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {roles.map((role) => (
              <div key={role.name} className="rounded-lg border border-gray-200 p-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold">{role.name}</h3>
                  <span className="text-xs text-gray-500">
                    {role.inherits ? `inherits ${role.inherits}` : "base role"}
                  </span>
                </div>
                <ul className="mt-3 space-y-1">
                  {role.grants.map((g) => (
                    <li key={g} className="font-mono text-xs text-gray-700">+ {g}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 pb-24 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{f.description}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
