import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Lớp bảo vệ sớm: yêu cầu cookie `token` (đồng bộ với js-cookie khi đăng nhập).
 * Không thay thế kiểm tra quyền admin trên API — server vẫn là chuẩn cuối.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  const needsAuth =
    pathname.startsWith("/checkout") || pathname.startsWith("/account");

  if (needsAuth && !token) {
    const login = new URL("/user-login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/admin/shop") && !token) {
    const login = new URL("/shop-owner-login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/shop/owner") && !token) {
    const login = new URL("/collaborator-login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/checkout",
    "/account",
    "/account/:path*",
    "/admin/shop",
    "/shop/owner",
  ],
};
