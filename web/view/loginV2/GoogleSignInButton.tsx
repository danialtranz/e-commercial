/* eslint-disable */
import { useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { ArrowRight } from "lucide-react";
import { safeInternalPath } from "@/lib/security";
import {
  defaultNextForPortal,
  loginPathForPortal,
  stashOAuthContext,
  type LoginPortal,
} from "@/lib/oauthState";

interface GoogleSignInButtonProps {
  disabled?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  portal?: LoginPortal;
}

export const GoogleSignInButton = ({
  disabled = false,
  onLoadingChange,
  portal = "user",
}: GoogleSignInButtonProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      onLoadingChange?.(true);
      const redirectUri = `${process.env.NEXT_PUBLIC_GOOGLE_OAUTH2_CALLBACK}`;
      const clientId = `${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}`;
      const scope = "profile email";
      const responseType = "code";

      const nextParam = router.query.next;
      const nextPath = safeInternalPath(
        typeof nextParam === "string" ? nextParam : undefined,
        defaultNextForPortal(portal)
      );
      const state = encodeURIComponent(stashOAuthContext(nextPath, portal));

      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=${responseType}&client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri || ""
      )}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${state}`;

      if (typeof window !== "undefined") {
        const targetWin = window.top || window;
        try {
          targetWin.location.href = oauthUrl;
        } catch {
          const a = document.createElement("a");
          a.href = oauthUrl;
          a.target = "_top";
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      }
    } catch {
      setLoading(false);
      onLoadingChange?.(false);
      toast.error("Đã xảy ra lỗi");
      router.push(loginPathForPortal(portal));
    }
  };

  const isBusy = disabled || loading;

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={isBusy}
      className="w-full bg-organic hover:bg-organic-dark text-white font-bold py-4 rounded shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isBusy ? "ĐANG XỬ LÝ..." : "ĐĂNG NHẬP VỚI GOOGLE"}
      {!isBusy && (
        <ArrowRight
          size={18}
          className="group-hover:translate-x-1 transition-transform"
        />
      )}
    </button>
  );
};
