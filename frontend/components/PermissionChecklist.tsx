"use client";

import { useActionState } from "react";
import FormMessage from "@/components/FormMessage";
import { btnPrimary } from "@/lib/ui";
import type { FormState, PermissionInfo } from "@/lib/types";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  catalog: PermissionInfo[];
  own: string[];          // granted directly by this role
  inherited: string[];    // everything the parent role grants
  mine: string[];         // what the person using the page holds
  canEdit: boolean;
};

export default function PermissionChecklist({ action, catalog, own, inherited, mine, canEdit }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  // Group "users.view", "users.edit" ... under "users"
  const groups = new Map<string, PermissionInfo[]>();
  for (const p of catalog) {
    const area = p.codename.split(".")[0];
    groups.set(area, [...(groups.get(area) ?? []), p]);
  }

  return (
    <form action={formAction} className="space-y-5">
      {[...groups.entries()].map(([area, perms]) => (
        <fieldset key={area}>
          <legend className="text-xs font-semibold uppercase text-gray-500">{area}</legend>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {perms.map((p) => {
              const isOwn = own.includes(p.codename);
              const isInherited = inherited.includes(p.codename);
              const iHoldIt = mine.includes(p.codename);
              // Inherited-only boxes are ticked but locked (change them on the parent role).
              // You cannot grant what you do not hold: the server enforces it, this just saves a round trip.
              const disabled = !canEdit || (isInherited && !isOwn) || (!isOwn && !iHoldIt);
              const why = isInherited && !isOwn
                ? "Inherited from the parent role"
                : !isOwn && !iHoldIt
                ? "You cannot grant a permission you do not hold"
                : undefined;

              return (
                <label
                  key={p.codename}
                  title={why}
                  className={`flex items-start gap-3 rounded-md border border-gray-200 px-3 py-2 ${
                    disabled ? "bg-gray-50 text-gray-500" : "bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="permissions"
                    value={p.codename}
                    defaultChecked={isOwn || isInherited}
                    disabled={disabled}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-mono text-sm">{p.codename}</span>
                    <span className="block text-xs">{p.description}</span>
                    {isInherited && !isOwn && <span className="text-xs text-blue-700">inherited</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      <FormMessage state={state} />

      {canEdit ? (
        <button disabled={pending} className={btnPrimary}>{pending ? "Saving..." : "Save permissions"}</button>
      ) : (
        <p className="text-xs text-gray-500">🔒 Read-only: you cannot change this role&apos;s permissions.</p>
      )}
    </form>
  );
}