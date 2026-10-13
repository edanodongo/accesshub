import "server-only";
import { redirect } from "next/navigation";
import { can, hasRole } from "./access";
import { getCurrentUser } from "./auth";

type Rule = { permission?: string; role?: string };

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAccess(rule: Rule) {
  const user = await requireUser();

  if (rule.permission && !can(user, rule.permission)) {
    redirect(`/dashboard/forbidden?need=${encodeURIComponent(`permission: ${rule.permission}`)}`);
  }
  if (rule.role && !hasRole(user, rule.role)) {
    redirect(`/dashboard/forbidden?need=${encodeURIComponent(`role: ${rule.role}`)}`);
  }
  return user;
}