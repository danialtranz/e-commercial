"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";

import {
  getAuthSessionServerSnapshot,
  getAuthSessionSnapshot,
  notifyAuthSessionUpdated,
  subscribeAuthSession,
} from "@/lib/authSession";
import { resolveHeaderRole, showCartInHeader } from "@/utils/roleUtils";
import { getNavLinksForRole } from "./navConfig";
import { MainHeader } from "./MainHeader";
import { OrganicNavbar } from "./OrganicNavbar";
import MobileMenuDrawer from "./MobileMenuDrawer";

const MenuCompV2: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname =
    router.asPath.split("?")[0].split("#")[0] || router.pathname || null;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { isLoggedIn, userInfo } = useSyncExternalStore(
    subscribeAuthSession,
    getAuthSessionSnapshot,
    getAuthSessionServerSnapshot
  );
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const headerRole = useMemo(
    () => resolveHeaderRole(userInfo?.role, isLoggedIn),
    [userInfo?.role, isLoggedIn]
  );

  const navLinks = useMemo(() => getNavLinksForRole(headerRole), [headerRole]);

  const shouldShowHeader = () => {
    if (!pathname) return false;

    const exact = new Set([
      "/",
      "/404",
      "/product",
      "/cart",
      "/checkout",
      "/user-login",
      "/about",
      "/policy",
      "/contact",
      "/my-order",
      "/dashboard-shopowner",
      "/admin/shop",
      "/advertising",
      "/manager-advertising-camp",
      "/collaborator/revenue",
      "/my-assignment",
      "/manager-voucher",
      "/exchange-voucher",
      "/manager-flash-camp",
      "/shop-owner-login",
      "/collaborator-login",
    ]);

    if (exact.has(pathname)) return true;

    const prefixes = [
      "/product/",
      "/account",
      "/product/",
      "/agent-config/",
      "/chat",
      "/learn",
      "/collaborator",
    ];

    for (const p of prefixes) {
      if (pathname.startsWith(p)) return true;
    }

    return false;
  };

  const showHeader = shouldShowHeader();

  useEffect(() => {
    if (!showHeader) return;

    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen, showHeader]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        isMobileMenuOpen &&
        !target.closest(".mobile-menu-drawer") &&
        !target.closest(".mobile-menu-button")
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const onRouteChange = () => notifyAuthSessionUpdated();

    router.events.on("routeChangeComplete", onRouteChange);

    return () => {
      router.events.off("routeChangeComplete", onRouteChange);
    };
  }, [router.events]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href) ?? false;
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      // thay vì clear thì giữa lại các key là shopId và shopInfo . For để xóa tất cả nhưng giữ lại 2 key đó
      const keysToKeep = ["shopId", "shopInfo"];
      Object.keys(localStorage).forEach((key) => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      const allCookies = Cookies.get();
      Object.keys(allCookies).forEach((cookieName) => {
        Cookies.remove(cookieName, { path: "/" });
        if (window.location.hostname) {
          Cookies.remove(cookieName, {
            path: "/",
            domain: window.location.hostname,
          });
          Cookies.remove(cookieName, {
            path: "/",
            domain: `.${window.location.hostname}`,
          });
        }
      });
    }

    setIsProfileDropdownOpen(false);
    notifyAuthSessionUpdated();
    router.push("/user-login");
  };

  const showCart = showCartInHeader(headerRole);

  return (
    <>
      {showHeader && (
        <div className="z-[100]">
          <MainHeader
            showCart={showCart}
            isLoggedIn={isLoggedIn}
            userInfo={userInfo}
            isProfileDropdownOpen={isProfileDropdownOpen}
            setIsProfileDropdownOpen={setIsProfileDropdownOpen}
            onLogout={handleLogout}
            profileDropdownRef={profileDropdownRef}
            onLoginClick={() => router.push("/user-login")}
            onMobileMenuToggle={handleMobileMenuToggle}
            isMobileMenuOpen={isMobileMenuOpen}
          />
          <OrganicNavbar navLinks={navLinks} isActive={isActive} />
        </div>
      )}

      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navLinks={navLinks}
        isActive={isActive}
        isLoggedIn={isLoggedIn}
        userInfo={userInfo}
        onLogout={handleLogout}
        onLogin={() => router.push("/user-login")}
      />

      {children}
    </>
  );
};

export default MenuCompV2;
