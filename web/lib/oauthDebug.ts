/** Debug OAuth — dùng sessionStorage vì clearAllAuthData() xóa hết localStorage. */
export function persistOAuthDebug(payload: unknown) {
  const entry = JSON.stringify({
    at: new Date().toISOString(),
    payload,
  });
  try {
    sessionStorage.setItem("oauth_debug", entry);
  } catch {
    // ignore quota / private mode
  }
  try {
    localStorage.setItem("oauth_debug", entry);
  } catch {
    // ignore
  }
}

export function normalizeOAuthLoginResult(raw: unknown): {
  code: number;
  httpStatus?: number;
  body: Record<string, unknown> | null;
} {
  if (typeof raw === "number") {
    return { code: raw, body: null };
  }
  if (raw && typeof raw === "object" && "code" in raw) {
    const r = raw as {
      code?: number;
      httpStatus?: number;
      body?: Record<string, unknown> | null;
    };
    return {
      code: typeof r.code === "number" ? r.code : -1,
      httpStatus: r.httpStatus,
      body: r.body ?? null,
    };
  }
  return { code: -1, body: null };
}
