"use client";

import { useState, useTransition } from "react";
import { btnDanger } from "@/lib/ui";

type Props = {
  action: () => Promise<{ error?: string } | void>;
  label: string;
  confirmText: string;
  disabled?: boolean;
  title?: string;
};

export default function ConfirmButton({ action, label, confirmText, disabled, title }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm(confirmText)) return;
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result && result.error) setError(result.error);
    });
  }

  return (
    <div>
      <button type="button" onClick={onClick} disabled={disabled || pending} title={title} className={btnDanger}>
        {pending ? "Working..." : label}
      </button>
      {error && <p className="mt-1 max-w-xs text-xs text-red-600">{error}</p>}
    </div>
  );
}