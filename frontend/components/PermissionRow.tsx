"use client";

import { useActionState } from "react";
import { deletePermissionAction, updatePermissionAction } from "@/app/actions/permissions";
import Badge from "@/components/Badge";
import ConfirmButton from "@/components/ConfirmButton";
import { btnGhost, inputCls } from "@/lib/ui";
import type { PermissionInfo } from "@/lib/types";

export default function PermissionRow({ permission }: { permission: PermissionInfo }) {
  const [state, formAction, pending] = useActionState(
    updatePermissionAction.bind(null, permission.id),
    undefined
  );

  return (
    <tr className="align-top">
      <td className="px-4 py-3">
        <p className="font-mono text-sm">{permission.codename}</p>
        <Badge tone={permission.is_system ? "dark" : "green"}>{permission.is_system ? "built-in" : "custom"}</Badge>
      </td>
      <td className="px-4 py-3">
        <form action={formAction} className="flex gap-2">
          <input
            name="description"
            defaultValue={permission.description}
            className={`${inputCls} mt-0`}
            aria-label={`Description of ${permission.codename}`}
          />
          <button disabled={pending} className={btnGhost}>{pending ? "..." : "Save"}</button>
        </form>
        {state?.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
        {state?.success && <p className="mt-1 text-xs text-green-700">{state.success}</p>}
      </td>
      <td className="px-4 py-3 text-right">
        <ConfirmButton
          action={deletePermissionAction.bind(null, permission.id)}
          label="Delete"
          confirmText={`Delete ${permission.codename}? It will be removed from every role that has it.`}
          disabled={permission.is_system}
          title={permission.is_system ? "Built-in permissions are used by the code" : undefined}
        />
      </td>
    </tr>
  );
}