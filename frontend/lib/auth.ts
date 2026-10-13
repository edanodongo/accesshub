import "server-only";
import { cache } from "react";
import { apiFetch } from "./api";
import type { User } from "./types";

// cache() means many components can call this in one request, and Django is hit once.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const res = await apiFetch("/auth/me/");
    if (!res.ok) return null;
    return (await res.json()) as User;
  } catch {
    return null; // Django unreachable: treat as logged out
  }
});