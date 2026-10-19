"use client";

import { useActionState } from "react";
import FormMessage from "@/components/FormMessage";
import { btnPrimary, inputCls, labelCls } from "@/lib/ui";
import type { FormState, User } from "@/lib/types";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  mode: "create" | "edit";
  user?: User;
  roleOptions?: string[]; // create mode: roles you may assign (empty = hide the picker)
  canEdit: boolean;
  isSelf?: boolean;
};

export default function UserForm({ action, mode, user, roleOptions = [], canEdit, isSelf }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const value = (key: string, fallback: string) => state?.values?.[key] ?? fallback;
  const creating = mode === "create";

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="username" className={labelCls}>Username</label>
        <input
          id="username"
          name="username"
          required
          defaultValue={creating ? value("username", "") : user?.username}
          disabled={!creating}
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="email" className={labelCls}>Email</label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={value("email", user?.email ?? "")}
          disabled={!canEdit}
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="password" className={labelCls}>
          {creating ? "Password" : "Reset password (leave empty to keep the current one)"}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required={creating}
          minLength={8}
          autoComplete="new-password"
          disabled={!canEdit}
          className={inputCls}
        />
      </div>

      {creating && roleOptions.length > 0 && (
        <div>
          <label htmlFor="role" className={labelCls}>Role</label>
          <select id="role" name="role" defaultValue={value("role", "")} className={inputCls}>
            <option value="">(default: USER)</option>
            {roleOptions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">Only roles no more powerful than yours are listed.</p>
        </div>
      )}

      {!creating &&
        (isSelf ? (
          <p className="text-xs text-gray-500">You cannot deactivate your own account.</p>
        ) : (
          <label className="flex items-center gap-2 text-sm">
            <input type="hidden" name="has_active" value="1" />
            <input type="checkbox" name="is_active" defaultChecked={user?.is_active} disabled={!canEdit} />
            Account active (inactive users cannot log in and hold no permissions)
          </label>
        ))}

      <FormMessage state={state} />

      {canEdit ? (
        <button disabled={pending} className={btnPrimary}>
          {pending ? "Saving..." : creating ? "Create user" : "Save changes"}
        </button>
      ) : (
        <p className="text-xs text-gray-500">🔒 Read-only: you cannot edit this user.</p>
      )}
    </form>
  );
}