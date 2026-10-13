"use server";

import { revalidatePath } from "next/cache";
import { can } from "@/lib/access";
import { apiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export async function changeRoleAction(userId: number, role: string): Promise<{ error?: string }> {
  // Server actions are public HTTP endpoints. Always re-check access inside them.
  const user = await getCurrentUser();
  if (!can(user, "users.change_role")) {
    return { error: "You do not have permission to change roles." };
  }

  const res = await apiFetch(`/users/${userId}/role/`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: data.detail ?? "Could not change role." };
  }

  revalidatePath("/dashboard/users");
  return {};
}