"use client";

import { useActionState } from "react";
import { createPermissionAction } from "@/app/actions/permissions";
import FormMessage from "@/components/FormMessage";
import { btnPrimary, inputCls, labelCls } from "@/lib/ui";

export default function CreatePermissionForm() {
  const [state, formAction, pending] = useActionState(createPermissionAction, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="codename" className={labelCls}>Codename</label>
          <input
            id="codename"
            name="codename"
            required
            placeholder="reports.view"
            defaultValue={state?.values?.codename ?? ""}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="description" className={labelCls}>Description</label>
          <input
            id="description"
            name="description"
            placeholder="See the reports page"
            defaultValue={state?.values?.description ?? ""}
            className={inputCls}
          />
        </div>
      </div>
      <FormMessage state={state} />
      <button disabled={pending} className={btnPrimary}>{pending ? "Creating..." : "Create permission"}</button>
    </form>
  );
}