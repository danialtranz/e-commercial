import { safeInternalPath } from "@/lib/security";

export type LoginPortal = "user" | "shopOwner" | "collaborator";

export type OAuthStatePayload = {
  next: string;
  portal: LoginPortal;
};

/** Đích mặc định sau đăng nhập OAuth thành công (khi không có ?next=). */
const PORTAL_FALLBACK_NEXT: Record<LoginPortal, string> = {
  user: "/product",
  shopOwner: "/product",
  collaborator: "/my-assignment",
};

/** Trang đăng nhập theo portal (redirect khi OAuth lỗi / sai vai trò). */
export function loginPathForPortal(portal: LoginPortal): string {
  if (portal === "shopOwner") return "/shop-owner-login";
  if (portal === "collaborator") return "/collaborator-login";
  return "/user-login";
}

export function defaultNextForPortal(portal: LoginPortal): string {
  return PORTAL_FALLBACK_NEXT[portal];
}

/** Portal shop-owner: admin hệ thống + chủ shop (chuẩn hóa chữ thường khi so khớp). */
const SHOP_OWNER_PORTAL_ROLES = new Set(["shopowner", "admin"]);

/**
 * Chủ shop: tương thích backend hiện tại (admin quản lý shop) + role shop riêng sau này.
 */

const COLLABORATOR_PORTAL_ROLES = new Set([
  "collaborator",
  "collab",
  "staff",
  "shop_staff",
]);

export function normalizeLoginPortal(
  raw: string | undefined | null
): LoginPortal {
  if (raw === "shopOwner" || raw === "shop" || raw === "admin") {
    return "shopOwner";
  }
  if (raw === "collaborator") return "collaborator";
  if (raw === "user") return "user";
  return "user";
}

export function buildOAuthState(next: string, portal: LoginPortal): string {
  const payload: OAuthStatePayload = {
    next: safeInternalPath(next, defaultNextForPortal(portal)),
    portal,
  };
  return JSON.stringify(payload);
}

const OAUTH_CTX_PREFIX = "oauth_ctx:";

/** Lưu next/portal trước khi sang Google; URL chỉ cần id ngắn trong `state`. */
export function stashOAuthContext(next: string, portal: LoginPortal): string {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(
      `${OAUTH_CTX_PREFIX}${id}`,
      buildOAuthState(next, portal)
    );
  }
  return id;
}

/** Đọc next/portal sau redirect Google (ưu tiên sessionStorage, fallback JSON trong state). */
export function consumeOAuthContext(
  stateRaw: string | undefined | null
): OAuthStatePayload {
  if (!stateRaw || typeof stateRaw !== "string") {
    return { next: "/product", portal: "user" };
  }
  if (typeof sessionStorage !== "undefined") {
    const stored = sessionStorage.getItem(`${OAUTH_CTX_PREFIX}${stateRaw}`);
    if (stored) {
      sessionStorage.removeItem(`${OAUTH_CTX_PREFIX}${stateRaw}`);
      return parseOAuthState(stored);
    }
  }
  return parseOAuthState(stateRaw);
}

export function parseOAuthState(
  stateRaw: string | undefined | null
): OAuthStatePayload {
  if (!stateRaw || typeof stateRaw !== "string") {
    return { next: "/product", portal: "user" };
  }
  try {
    const decoded = decodeURIComponent(stateRaw);
    const parsed = JSON.parse(decoded) as Partial<OAuthStatePayload>;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.next === "string"
    ) {
      const portal = normalizeLoginPortal(parsed.portal);
      return {
        next: safeInternalPath(parsed.next, defaultNextForPortal(portal)),
        portal,
      };
    }
  } catch {
    // Legacy: state chỉ là path nội bộ
    try {
      const nextOnly = safeInternalPath(
        decodeURIComponent(stateRaw),
        "/product"
      );
      return { next: nextOnly, portal: "user" };
    } catch {
      return { next: "/product", portal: "user" };
    }
  }
  try {
    const nextOnly = safeInternalPath(decodeURIComponent(stateRaw), "/product");
    return { next: nextOnly, portal: "user" };
  } catch {
    return { next: "/product", portal: "user" };
  }
}

export function roleMatchesLoginPortal(
  roleRaw: string | undefined | null,
  portal: LoginPortal
): boolean {
  if (portal === "user") return true;
  const r = String(roleRaw || "").toLowerCase();
  if (portal === "shopOwner") return SHOP_OWNER_PORTAL_ROLES.has(r);
  if (portal === "collaborator") return COLLABORATOR_PORTAL_ROLES.has(r);
  return true;
}

export function readRoleFromStoredUserInfo(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem("userInfo");
    if (!raw) return "";
    const u = JSON.parse(raw) as { role?: string };
    return String(u?.role ?? "");
  } catch {
    return "";
  }
}
