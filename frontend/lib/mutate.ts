import "server-only";
import { can } from "./access";
import { apiFetch } from "./api";
import { getCurrentUser } from "./auth";
import { flattenErrors } from "./errors";

export type ApiResult<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Server actions are public HTTP endpoints: anyone can POST to them, whatever the UI shows.
 * So every action re-checks the permission itself. Returns an error message, or null if allowed.
 * (Django checks again. This first check just gives a friendlier message.)
 */
export async function checkPermission(permission: string): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return "You are not logged in.";
  if (!can(user, permission)) return `You need the ${permission} permission.`;
  return null;
}

export async function callApi<T = unknown>(
  path: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown
): Promise<ApiResult<T>> {
  try {
    const res = await apiFetch(path, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 204) return { ok: true, data: null as T };
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: flattenErrors(data) || `Request failed (${res.status}).` };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "Cannot reach the server. Is the backend running?" };
  }
}

export const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

/** Pick plain text fields out of a form so we can send them back after an error. */
export function fields(formData: FormData, names: string[]): Record<string, string> {
  return Object.fromEntries(names.map((n) => [n, str(formData.get(n))]));
}