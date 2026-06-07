/**
 * Chỉ cho phép đường dẫn nội bộ (relative path trên cùng origin).
 * Dùng cho ?next=... và OAuth state để tránh open redirect.
 */
export function safeInternalPath(
  raw: string | undefined | null,
  fallback: string
): string {
  if (raw == null || typeof raw !== "string") return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) return fallback;
  return trimmed;
}
