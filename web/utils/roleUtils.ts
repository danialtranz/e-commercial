import { ROLE } from "@/constants/authorization";

export type AppHeaderRole = "guest" | "user" | "collaborator" | "shopowner";

export const isRole = (role: string): boolean => {
  return (
    role === ROLE.USER || role === ROLE.COLLABORATOR || role === ROLE.SHOPOWNER
  );
};

/** Chuẩn hóa role từ JWT / localStorage để hiển thị menu header. */
export function resolveHeaderRole(
  role: string | undefined | null,
  isLoggedIn: boolean
): AppHeaderRole {
  if (!isLoggedIn) return "guest";
  const r = String(role || "").toLowerCase();
  if (r === ROLE.SHOPOWNER || r === "admin") return "shopowner";
  if (r === ROLE.COLLABORATOR) return "collaborator";
  return "user";
}

export function showCartInHeader(headerRole: AppHeaderRole): boolean {
  return headerRole === "guest" || headerRole === "user";
}
