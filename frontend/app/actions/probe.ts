"use server";

import { apiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { PROBES } from "@/lib/probes";
import type { ProbeResult } from "@/lib/types";

// The client sends only a KEY. It can never choose the URL, so this
// action can't be abused to call arbitrary backend endpoints.
export async function runProbe(key: string): Promise<ProbeResult> {
  const user = await getCurrentUser();
  const probe = PROBES.find((p) => p.key === key);
  if (!user || !probe) return { status: 0, body: "Unknown probe or not logged in." };

  try {
    const res = await apiFetch(probe.path.replace(":me", String(user.id)), {
      method: probe.method,
      body: probe.body ? JSON.stringify(probe.body) : undefined,
    });
    return { status: res.status, body: (await res.text()).slice(0, 300) };
  } catch {
    return { status: 0, body: "Cannot reach the backend." };
  }
}