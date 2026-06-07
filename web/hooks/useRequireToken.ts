"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/utils/tokenManager";

/**
 * Require token before rendering protected pages.
 * - While checking, page should show a loading overlay to avoid UI flash.
 * - If token is missing, redirects to login and keeps loading state.
 */
export const useRequireToken = (redirectPath: string = "/user-login") => {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [hasToken, setHasToken] = useState<boolean>(false);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      setHasToken(false);
      router.replace(redirectPath);
      return;
    }

    setHasToken(true);
    setIsChecking(false);
  }, [router, redirectPath]);

  return { isChecking, hasToken };
};
