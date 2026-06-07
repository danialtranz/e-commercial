"use client";

import { useCallback, useEffect, useState } from "react";
import { getToken } from "@/utils/tokenManager";

/** Đồng bộ trạng thái đăng nhập (token + userInfo) — cùng cơ chế LoginPageGate / menuCompV2. */
export function useAuthSession() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const checkSession = useCallback(() => {
    const hasToken = Boolean(getToken());
    let hasUserInfo = false;
    try {
      hasUserInfo = Boolean(localStorage.getItem("userInfo"));
    } catch {
      hasUserInfo = false;
    }
    setIsLoggedIn(hasToken || hasUserInfo);
    setIsReady(true);
  }, []);

  useEffect(() => {
    checkSession();
    window.addEventListener("storage", checkSession);
    return () => window.removeEventListener("storage", checkSession);
  }, [checkSession]);

  return { isLoggedIn, isReady, refresh: checkSession };
}
