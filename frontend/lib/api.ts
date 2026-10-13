import "server-only";
import { getToken } from "./session";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = await getToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Token ${token}`);

  return fetch(`${API_URL}/api${path}`, { ...init, headers, cache: "no-store" });
}