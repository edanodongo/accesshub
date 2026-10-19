export type User = {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  role: string | null;
  role_lineage: string[];
  permissions: string[];
};

export type RoleInfo = {
  id: number;
  name: string;
  description: string;
  parent: string | null;
  is_system: boolean;
  user_count: number;
  own_permissions: string[];
  effective_permissions: string[];
};

export type PermissionInfo = {
  id: number;
  codename: string;
  description: string;
  is_system: boolean;
};

export type AuditEntry = {
  id: number;
  created_at: string;
  actor_name: string;
  action: string;
  target_type: string;
  target_repr: string;
  details: Record<string, unknown>;
  ip_address: string | null;
};

// `values` lets a form re-fill itself after a failed submit (React 19 resets forms).
export type FormState =
  | { error?: string; success?: string; values?: Record<string, string> }
  | undefined;
export type ProbeResult = { status: number; body: string };