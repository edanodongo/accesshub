"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/lib/types";

type Props = {
  mode: "login" | "register";
  action: (state: FormState, formData: FormData) => Promise<FormState>;
};

const input =
  "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none";

export default function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const isLogin = mode === "login";

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="text-sm font-medium" htmlFor="username">Username</label>
        <input id="username" name="username" required className={input} />
      </div>

      {!isLogin && (
        <div>
          <label className="text-sm font-medium" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className={input} />
        </div>
      )}

      <div>
        <label className="text-sm font-medium" htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={isLogin ? undefined : 8}
          className={input}
        />
      </div>

      {state?.error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>
      )}

      <button
        disabled={pending}
        className="w-full rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {pending ? "Please wait..." : isLogin ? "Log in" : "Create account"}
      </button>

      <p className="text-center text-sm text-gray-600">
        {isLogin ? (
          <>No account? <Link href="/register" className="underline">Register</Link></>
        ) : (
          <>Already registered? <Link href="/login" className="underline">Log in</Link></>
        )}
      </p>
    </form>
  );
}