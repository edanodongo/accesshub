export type User = {
  id: number;
  username: string;
  email: string;
  role: string | null;
  role_lineage: string[];
  permissions: string[];
};

export type RoleInfo = {
  id: number;
  name: string;
  description: string;
  parent: string | null;
  own_permissions: string[];
  effective_permissions: string[];
};

export type PermissionInfo = { codename: string; description: string };
export type FormState = { error?: string } | undefined;
export type ProbeResult = { status: number; body: string };
