import type { User } from "./types";

/** Does the user hold this permission (own or inherited)? */
export const can = (user: User | null, permission: string) =>
  !!user && user.permissions.includes(permission);

/** Does the user's role, or any role it inherits from, match? */
export const hasRole = (user: User | null, role: string) =>
  !!user && user.role_lineage.includes(role);