"use server";

import { revalidatePath } from "next/cache";
import { callApi, checkPermission, fields, str } from "@/lib/mutate";
import type { FormState } from "@/lib/types";

export async function createPermissionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await checkPermission("permissions.manage");
  if (denied) return { error: denied };

  const result = await callApi("/permissions/", "POST", {
    codename: str(formData.get("codename")),
    description: str(formData.get("description")),
  });
  if (!result.ok) return { error: result.error, values: fields(formData, ["codename", "description"]) };

  revalidatePath("/dashboard/permissions");
  return { success: "Permission created. Assign it to a role to make it useful." };
}

export async function updatePermissionAction(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await checkPermission("permissions.manage");
  if (denied) return { error: denied };

  const result = await callApi(`/permissions/${id}/`, "PATCH", { description: str(formData.get("description")) });
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/permissions");
  return { success: "Saved." };
}

export async function deletePermissionAction(id: number): Promise<{ error?: string }> {
  const denied = await checkPermission("permissions.manage");
  if (denied) return { error: denied };

  const result = await callApi(`/permissions/${id}/`, "DELETE");
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/permissions");
  return {};
}