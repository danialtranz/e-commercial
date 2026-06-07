import { useState } from "react";
import Link from "next/link";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { LoadingOverlay } from "./LoadingOverlay";
import { Terms } from "./Terms";
import type { LoginPortal } from "@/lib/oauthState";

const portalTitles: Record<LoginPortal, string> = {
  user: "Đăng nhập",
  shopOwner: "Chủ shop",
  collaborator: "Cộng tác viên",
};

const portalSubtitles: Record<LoginPortal, string> = {
  user: "Chào mừng bạn đến với Ban Mi Chu",
  shopOwner: "Quản lý cửa hàng của bạn",
  collaborator: "Đăng nhập tài khoản cộng tác viên",
};

export type LoginV2ViewProps = {
  portal?: LoginPortal;
  titleOverride?: string;
  subtitleOverride?: string;
};

export const LoginV2View = ({
  portal = "user",
  titleOverride,
  subtitleOverride,
}: LoginV2ViewProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const title = titleOverride || portalTitles[portal];
  const subtitle = subtitleOverride || portalSubtitles[portal];

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-20 px-4 bg-login-bg relative">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-organic p-8 text-center">
          <h2 className="text-2xl font-bold text-white uppercase tracking-widest">
            {title}
          </h2>
          <p className="text-white/80 text-xs mt-2 uppercase tracking-tighter">
            {subtitle}
          </p>
        </div>

        <form className="p-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
          <GoogleSignInButton
            disabled={isLoading}
            onLoadingChange={setIsLoading}
            portal={portal}
          />

          <nav
            className="text-center pt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
            aria-label="Các cổng đăng nhập khác"
          >
            {portal !== "user" && (
              <Link
                href="/user-login"
                className="text-xs font-medium text-organic hover:text-organic-dark hover:underline"
              >
                Khách hàng
              </Link>
            )}
            {portal !== "shopOwner" && (
              <Link
                href="/shop-owner-login"
                className="text-xs font-medium text-organic hover:text-organic-dark hover:underline"
              >
                Chủ shop
              </Link>
            )}
            {portal !== "collaborator" && (
              <Link
                href="/collaborator-login"
                className="text-xs font-medium text-organic hover:text-organic-dark hover:underline"
              >
                Cộng tác viên
              </Link>
            )}
          </nav>

          <Terms />
        </form>
      </div>

      <LoadingOverlay isLoading={isLoading} />
    </div>
  );
};
