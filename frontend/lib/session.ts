import "server-only";
import { cookies } from "next/headers";

const COOKIE_NAME = "accesshub_token";

export async function getToken() {
  return (await cookies()).get(COOKIE_NAME)?.value ?? null;
}

export async function setToken(token: string) {
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true, // JavaScript in the browser cannot read it
    secure: process.env.COOKIE_SECURE === "true", // true once you serve HTTPS
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearToken() {
  (await cookies()).delete(COOKIE_NAME);
}