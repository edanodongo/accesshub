"use server";

import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { clearToken, setToken } from "@/lib/session";
import type { FormState } from "@/lib/types";

function flattenErrors(data: Record<string, unknown>): string {
  return Object.entries(data)
    .map(([field, msgs]) => {
      const text = Array.isArray(msgs) ? msgs.join(" ") : String(msgs);
      return field === "detail" ? text : `${field}: ${text}`;
    })
    .join(" · ");
}

async function authenticate(path: string, payload: object): Promise<FormState> {
  let res: Response;
  try {
    res = await apiFetch(path, { method: "POST", body: JSON.stringify(payload) });
  } catch {
    return { error: "Cannot reach the server. Is the backend running?" };
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: flattenErrors(data) || "Something went wrong." };

  await setToken(data.token);
  redirect("/dashboard"); // must be outside try/catch
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return authenticate("/auth/login/", {
    username: formData.get("username"),
    password: formData.get("password"),
  });
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return authenticate("/auth/register/", {
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function logoutAction() {
  try {
    await apiFetch("/auth/logout/", { method: "POST" }); // deletes the token in Django
  } catch {
    // even if Django is down, still clear the cookie
  }
  await clearToken();
  redirect("/");
}