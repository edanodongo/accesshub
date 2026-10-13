import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import AuthForm from "@/components/AuthForm";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="mb-6 text-2xl font-bold">Log in</h1>
        <AuthForm mode="login" action={loginAction} />

        <div className="mt-8 rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-800">Demo accounts (password: demo12345)</p>
          <ul className="mt-2 space-y-1">
            <li><b>alice</b> is a USER</li>
            <li><b>bob</b> is an EDITOR</li>
            <li><b>carol</b> is an ADMIN</li>
          </ul>
          <p className="mt-2 text-xs">Remove this box before a real deployment.</p>
        </div>
      </main>
    </>
  );
}