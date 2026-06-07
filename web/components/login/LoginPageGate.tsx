/* eslint-disable */
"use client";

import { type ReactElement, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { LoginV2View } from "@/view/loginV2";
import { getToken } from "@/utils/tokenManager";
import { LoadingOverlay } from "@/components/utilComponent/LoadingOverlay";

import { safeInternalPath } from "@/lib/security";
import { defaultNextForPortal, type LoginPortal } from "@/lib/oauthState";

export type LoginPageGateProps = {
  portal: LoginPortal;
  renderLogin?: (portal: LoginPortal) => ReactElement;
};

export function LoginPageGate({ portal, renderLogin }: LoginPageGateProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    if (!router.isReady) return;
    const token = getToken();

    if (token) {
      const nextQ = router.query.next;
      const dest = safeInternalPath(
        typeof nextQ === "string" ? nextQ : undefined,
        defaultNextForPortal(portal)
      );
      router.replace(dest);
      return;
    }

    setIsChecking(false);
  }, [router, router.isReady, router.query.next, portal]);

  if (isChecking) {
    return <LoadingOverlay isLoading={true} />;
  }

  if (renderLogin) {
    return renderLogin(portal);
  }

  return <LoginV2View portal={portal} />;
}
