"use client";

import { useState, useTransition } from "react";
import { changeRoleAction } from "@/app/actions/users";

type Props = { userId: number; current: string | null; roles: string[]; disabled: boolean };

export default function RoleChanger({ userId, current, roles, disabled }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value;
    setError(null);
    startTransition(async () => {
      const result = await changeRoleAction(userId, role);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div>
      <select
        value={current ?? ""}
        onChange={onChange}
        disabled={disabled || pending}
        className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
      >
        {current === null && <option value="">(none)</option>}
        {roles.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}