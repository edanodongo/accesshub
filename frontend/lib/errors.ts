/** Turn a Django REST Framework error body into one readable sentence. */
export function flattenErrors(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  return Object.entries(data as Record<string, unknown>)
    .map(([field, msgs]) => {
      const text = Array.isArray(msgs) ? msgs.join(" ") : String(msgs);
      return field === "detail" || field === "non_field_errors" ? text : `${field}: ${text}`;
    })
    .join(" · ");
}