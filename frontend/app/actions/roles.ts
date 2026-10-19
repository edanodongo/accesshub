"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { callApi, checkPermission, fields, str } from "@/lib/mutate";
import type { FormState } from "@/lib/types";

export async function createRoleAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await checkPermission("roles.create");
  if (denied) return { error: denied };

  const result = await callApi<{ id: number }>("/roles/", "POST", {
    name: str(formData.get("name")).toUpperCase(),
    description: str(formData.get("description")),
    parent: str(formData.get("parent")) || null,
  });
  if (!result.ok) {
    return { error: result.error, values: fields(formData, ["name", "description", "parent"]) };
  }

  revalidatePath("/dashboard/roles");
  redirect(`/dashboard/roles/${result.data.id}`); // outside any try/catch
}

// `id` comes first because the page calls updateRoleAction.bind(null, role.id)
export async function updateRoleAction(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await checkPermission("roles.edit");
  if (denied) return { error: denied };

  const body: Record<string, unknown> = { description: str(formData.get("description")) };
  // Disabled inputs (system roles) are not submitted, so only send what is present.
  if (formData.has("name")) body.name = str(formData.get("name")).toUpperCase();
  if (formData.has("parent")) body.parent = str(formData.get("parent")) || null;

  const result = await callApi(`/roles/${id}/`, "PATCH", body);
  if (!result.ok) {
    return { error: result.error, values: fields(formData, ["name", "description", "parent"]) };
  }
  revalidatePath("/dashboard/roles");
  revalidatePath(`/dashboard/roles/${id}`);
  return { success: "Role saved." };
}

export async function setRolePermissionsAction(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await checkPermission("roles.assign_permissions");
  if (denied) return { error: denied };

  const permissions = formData.getAll("permissions").filter((p): p is string => typeof p === "string");
  const result = await callApi(`/roles/${id}/permissions/`, "PUT", { permissions });
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/roles");
  revalidatePath(`/dashboard/roles/${id}`);
  return { success: "Permissions saved." };
}

export async function deleteRoleAction(id: number): Promise<{ error?: string }> {
  const denied = await checkPermission("roles.delete");
  if (denied) return { error: denied };

  const result = await callApi(`/roles/${id}/`, "DELETE");
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/roles");
  redirect("/dashboard/roles");
}