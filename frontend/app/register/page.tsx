import { redirect } from "next/navigation";
import { registerAction } from "@/app/actions/auth";
import AuthForm from "@/components/AuthForm";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="mb-6 text-2xl font-bold">Create your account</h1>
        <AuthForm mode="register" action={registerAction} />
      </main>
    </>
  );
}