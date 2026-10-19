import type { FormState } from "@/lib/types";

export default function FormMessage({ state }: { state: FormState }) {
  if (state?.error) {
    return <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>;
  }
  if (state?.success) {
    return <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">{state.success}</p>;
  }
  return null;
}