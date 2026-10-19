"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { callApi, checkPermission, fields, str } from "@/lib/mutate";
import type { FormState } from "@/lib/types";

export async function createUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await checkPermission("users.create");
  if (denied) return { error: denied };

  const role = str(formData.get("role"));
  const result = await callApi("/users/", "POST", {
    username: str(formData.get("username")),
    email: str(formData.get("email")),
    password: String(formData.get("password") ?? ""),
    ...(role ? { role } : {}),
  });
  if (!result.ok) return { error: result.error, values: fields(formData, ["username", "email", "role"]) };

  revalidatePath("/dashboard/users");
  redirect("/dashboard/users");
}

export async function updateUserAction(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await checkPermission("users.edit");
  if (denied) return { error: denied };

  const body: Record<string, unknown> = { email: str(formData.get("email")) };
  // An unticked checkbox sends nothing, so a hidden marker says "the checkbox was on the form".
  if (formData.has("has_active")) body.is_active = formData.get("is_active") === "on";
  const password = String(formData.get("password") ?? "");
  if (password) body.password = password;

  const result = await callApi(`/users/${id}/`, "PATCH", body);
  if (!result.ok) return { error: result.error, values: fields(formData, ["email"]) };

  revalidatePath("/dashboard/users");
  revalidatePath(`/dashboard/users/${id}`);
  return { success: "User saved." };
}

export async function changeRoleAction(userId: number, role: string): Promise<{ error?: string }> {
  // Server actions are public HTTP endpoints. Always re-check access inside them.
  const denied = await checkPermission("users.change_role");
  if (denied) return { error: denied };

  const result = await callApi(`/users/${userId}/role/`, "PATCH", { role });
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/users");
  revalidatePath(`/dashboard/users/${userId}`);
  return {};
}

export async function deleteUserAction(id: number): Promise<{ error?: string }> {
  const denied = await checkPermission("users.delete");
  if (denied) return { error: denied };

  const result = await callApi(`/users/${id}/`, "DELETE");
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/users");
  redirect("/dashboard/users");
}