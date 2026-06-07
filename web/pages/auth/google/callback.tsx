import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { useClientOnly } from "../../../hooks/useClientOnly";
import { IMAGES } from "../../../configs/images";
import toast from "react-hot-toast";

import {
  consumeOAuthContext,
  loginPathForPortal,
  roleMatchesLoginPortal,
  readRoleFromStoredUserInfo,
  type LoginPortal,
} from "@/lib/oauthState";
import { clearAllAuthData } from "@/utils/nextRequest";
import { getToken } from "@/utils/tokenManager";
import { persistDefaultShopInLocalStorage } from "@/services/shopowner/shopOwnerInfoService";
import { persistOAuthDebug } from "@/lib/oauthDebug";
import {
  applyAuthFromOAuthBody,
  exchangeGoogleOAuthCode,
} from "@/lib/googleOAuthLogin";

const OAUTH_CODE_STORAGE_PREFIX = "google_oauth_code:";

type OAuthExchangeResult = {
  ok: boolean;
  afterLogin: string;
  portal: LoginPortal;
  wrongPortal?: boolean;
};

let activeOAuthExchange: Promise<OAuthExchangeResult> | null = null;

function oauthCodeStorageKey(code: string) {
  return `${OAUTH_CODE_STORAGE_PREFIX}${code}`;
}

function readOAuthParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    code: params.get("code") || "",
    stateRaw: params.get("state") || "",
    oauthError: params.get("error") || "",
  };
}

/** Chỉ gọi SAU khi đã đọc code/state và xong API — tránh Next.js hủy request đang bay. */
function stripOAuthQueryFromUrl() {
  window.history.replaceState({}, "", "/auth/google/callback");
}

function redirectTo(path: string) {
  window.location.replace(path);
}

export default function GoogleCallback() {
  const { t } = useTranslation();
  const isMounted = useClientOnly();
  const tRef = useRef(t);

  useEffect(() => {
    tRef.current = t;

    const { code, stateRaw, oauthError } = readOAuthParams();
    const { next: afterLogin, portal } = consumeOAuthContext(stateRaw);
    const loginPath = loginPathForPortal(portal);

    const fail = (messageKey = "pages.common.errorOccurred") => {
      stripOAuthQueryFromUrl();
      toast.error(tRef.current(messageKey));
      redirectTo(loginPath);
    };

    const succeed = async () => {
      stripOAuthQueryFromUrl();
      await persistDefaultShopInLocalStorage();
      redirectTo(afterLogin);
    };

    if (oauthError) {
      fail();
      return;
    }

    if (!code) {
      fail();
      return;
    }

    const codeKey = oauthCodeStorageKey(code);
    const priorStatus = sessionStorage.getItem(codeKey);

    if (priorStatus === "done") {
      if (getToken()) {
        void succeed();
      } else {
        fail();
      }
      return;
    }

    if (priorStatus === "processing") {
      if (activeOAuthExchange) {
        void activeOAuthExchange.then((result) => {
          if (result.ok) void succeed();
          else fail();
        });
        return;
      }
      sessionStorage.setItem(codeKey, "failed");
      fail();
      return;
    }

    if (priorStatus === "failed") {
      fail();
      return;
    }

    if (!activeOAuthExchange) {
      const google_redirect_uri = `${process.env.NEXT_PUBLIC_GOOGLE_OAUTH2_CALLBACK}`;

      activeOAuthExchange = (async (): Promise<OAuthExchangeResult> => {
        sessionStorage.setItem(codeKey, "processing");

        const loginResult = await exchangeGoogleOAuthCode(
          portal,
          code,
          google_redirect_uri
        );

        persistOAuthDebug({
          portal,
          phase: "callback_after_exchange",
          loginResult,
        });

        if (loginResult.code !== 0) {
          sessionStorage.setItem(codeKey, "failed");
          return { ok: false, afterLogin, portal };
        }

        if (!applyAuthFromOAuthBody(loginResult.body)) {
          sessionStorage.setItem(codeKey, "failed");
          return { ok: false, afterLogin, portal };
        }

        const role = readRoleFromStoredUserInfo();
        if (!roleMatchesLoginPortal(role, portal)) {
          clearAllAuthData();
          sessionStorage.setItem(codeKey, "failed");
          return { ok: false, afterLogin, portal, wrongPortal: true };
        }

        sessionStorage.setItem(codeKey, "done");
        return { ok: true, afterLogin, portal };
      })().finally(() => {
        activeOAuthExchange = null;
      });
    }

    void activeOAuthExchange.then((result) => {
      if (result.ok) {
        void succeed();
        return;
      }

      if (result.wrongPortal) {
        const msgKey =
          portal === "shopOwner"
            ? "auth.callback.wrongPortalShopOwner"
            : portal === "collaborator"
              ? "auth.callback.wrongPortalCollaborator"
              : "auth.callback.wrongPortalUser";
        toast.error(tRef.current(msgKey));
      } else {
        fail();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadingStyles = `
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%);
      background-size: 400% 400%;
      animation: gradientShift 8s ease infinite;
      position: relative;
      overflow: hidden;
    }
    
    .loading-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      pointer-events: none;
    }
    
    .loading-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    
    .loading-title {
      color: white;
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 12px;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .loading-text {
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
      font-weight: 400;
      margin-top: 8px;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    }
    
    .avatar-container {
      position: relative;
      width: 120px;
      height: 120px;
      margin-bottom: 24px;
    }
    
    .avatar-wrapper {
      width: 100%;
      height: 100%;
      position: relative;
      animation: float 3s ease-in-out infinite;
    }
    
    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 50%;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      animation: moveAround 4s ease-in-out infinite;
    }
    
    @keyframes gradientShift {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }
    
    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-20px);
      }
    }
    
    @keyframes moveAround {
      0% {
        transform: translate(0, 0) scale(1);
      }
      25% {
        transform: translate(15px, -15px) scale(1.05);
      }
      50% {
        transform: translate(-10px, -25px) scale(1);
      }
      75% {
        transform: translate(-15px, 10px) scale(1.05);
      }
      100% {
        transform: translate(0, 0) scale(1);
      }
    }
  `;

  const redirectingText = isMounted
    ? t("auth.callback.redirecting")
    : "Redirecting";
  const pleaseWaitText = isMounted
    ? t("auth.callback.pleaseWait")
    : "You are being redirected, please wait...";

  return (
    <div className="loading-container">
      <style>{loadingStyles}</style>
      <div className="loading-content">
        <div className="avatar-container">
          <div className="avatar-wrapper">
            <Image
              src={IMAGES.miniShop.logo}
              alt="MiniShop Logo"
              width={120}
              height={120}
              className="avatar-image"
              priority
            />
          </div>
        </div>
        <div className="loading-title">{redirectingText}</div>
        <div className="loading-text">{pleaseWaitText}</div>
      </div>
    </div>
  );
}
