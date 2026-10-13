import { can, hasRole } from "./access";
import type { User } from "./types";

export type NavItem = {
  href: string;
  label: string;
  permission?: string; // gate by permission...
  role?: string;       // ...or by role (inheritance-aware)
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", permission: "dashboard.view" },
  { href: "/dashboard/profile", label: "Profile", permission: "profile.view" },
  { href: "/dashboard/content", label: "Content", permission: "content.view" },
  { href: "/dashboard/editors-room", label: "Editors' room", role: "EDITOR" },
  { href: "/dashboard/users", label: "Users", permission: "users.view" },
  { href: "/dashboard/roles", label: "Roles", permission: "roles.view" },
  { href: "/dashboard/access-tester", label: "Access tester" },
];

export function isAllowed(user: User, item: NavItem) {
  if (item.permission && !can(user, item.permission)) return false;
  if (item.role && !hasRole(user, item.role)) return false;
  return true;
}

export function requirementOf(item: NavItem) {
  if (item.permission) return `permission: ${item.permission}`;
  if (item.role) return `role: ${item.role}`;
  return "any logged-in user";
}