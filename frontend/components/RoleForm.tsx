"use client";

import { useActionState } from "react";
import FormMessage from "@/components/FormMessage";
import { btnPrimary, inputCls, labelCls } from "@/lib/ui";
import type { FormState, RoleInfo } from "@/lib/types";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  role?: RoleInfo;            // present when editing
  parentOptions: string[];
  canEdit: boolean;
  submitLabel: string;
};

export default function RoleForm({ action, role, parentOptions, canEdit, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  // After a failed submit React clears the form, so we refill it from what the action sent back.
  const value = (key: string, fallback: string) => state?.values?.[key] ?? fallback;
  const locked = role?.is_system ?? false;

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className={labelCls}>Name</label>
        <input
          id="name"
          name="name"
          required
          placeholder="MODERATOR"
          defaultValue={value("name", role?.name ?? "")}
          disabled={!canEdit || locked}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-gray-500">
          {locked ? "Built-in roles cannot be renamed." : "Capital letters, digits and underscores."}
        </p>
      </div>

      <div>
        <label htmlFor="description" className={labelCls}>Description</label>
        <input
          id="description"
          name="description"
          defaultValue={value("description", role?.description ?? "")}
          disabled={!canEdit}
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="parent" className={labelCls}>Inherits from</label>
        <select
          id="parent"
          name="parent"
          defaultValue={value("parent", role?.parent ?? "")}
          disabled={!canEdit || locked}
          className={inputCls}
        >
          <option value="">(none, base role)</option>
          {parentOptions.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {locked
            ? "Built-in roles keep their parent."
            : "This role receives every permission its parent has."}
        </p>
      </div>

      <FormMessage state={state} />

      {canEdit ? (
        <button disabled={pending} className={btnPrimary}>{pending ? "Saving..." : submitLabel}</button>
      ) : (
        <p className="text-xs text-gray-500">🔒 Read-only: you cannot edit this role.</p>
      )}
    </form>
  );
}