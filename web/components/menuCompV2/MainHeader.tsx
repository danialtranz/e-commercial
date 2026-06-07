"use client";

import type { RefObject } from "react";
import Link from "next/link";
import { Phone, Truck, ShieldCheck } from "lucide-react";
import HeaderAvatarDropdown from "./HeaderAvatarDropdown";
import { HeaderCartButton } from "./HeaderCartButton";

type UserInfo = {
  name?: string;
  email?: string;
  picture?: string;
  role?: string;
};

type MainHeaderProps = {
  showCart: boolean;
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  isProfileDropdownOpen: boolean;
  setIsProfileDropdownOpen: (v: boolean) => void;
  profileDropdownRef: RefObject<HTMLDivElement | null>;
  onLogout: () => void;
  onLoginClick: () => void;
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
};

const SUPPORT_BLOCKS = [
  {
    Icon: Phone,
    title: "Tư vấn hỗ trợ",
    subtitle: "0123 456 789",
  },
  {
    Icon: Truck,
    title: "Giao hàng tận nơi",
    subtitle: "Toàn quốc nhanh chóng",
  },
  {
    Icon: ShieldCheck,
    title: "An tâm mua sắm",
    subtitle: "Thanh toán bảo mật",
  },
] as const;

export function MainHeader({
  showCart,
  isLoggedIn,
  userInfo,
  isProfileDropdownOpen,
  setIsProfileDropdownOpen,
  profileDropdownRef,
  onLogout,
  onLoginClick,
  onMobileMenuToggle,
  isMobileMenuOpen,
}: MainHeaderProps) {
  return (
    <header className="bg-white py-6 border-b border-gray-100">
      <div className="max-w-[1200px] mx-auto px-4 flex justify-between items-center gap-4">
        <Link href="/product" className="flex flex-col shrink-0">
          <span className="text-organic text-3xl font-bold italic tracking-tighter">
            Commercial
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest text-center">
            Commercial
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {SUPPORT_BLOCKS.map(({ Icon, title, subtitle }) => (
            <div key={title} className="flex items-center gap-2">
              <div className="w-10 h-10 border-2 border-organic rounded-full flex items-center justify-center text-organic">
                <Icon size={20} />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight uppercase">
                  {title}
                </p>
                <p className="text-xs text-gray-500">{subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {showCart && <HeaderCartButton />}

          <HeaderAvatarDropdown
            isLoggedIn={isLoggedIn}
            userInfo={userInfo}
            isOpen={isProfileDropdownOpen}
            setIsOpen={setIsProfileDropdownOpen}
            onLogout={onLogout}
            profileDropdownRef={profileDropdownRef}
            onLoginClick={onLoginClick}
          />

          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="mobile-menu-button flex h-10 w-10 flex-col items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 md:hidden"
            aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={isMobileMenuOpen}
          >
            <span
              className={`block h-0.5 w-5 bg-gray-700 transition-all duration-300 ${
                isMobileMenuOpen ? "translate-y-1.5 rotate-45" : ""
              }`}
            />
            <span
              className={`mt-1.5 block h-0.5 w-5 bg-gray-700 transition-all duration-300 ${
                isMobileMenuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`mt-1.5 block h-0.5 w-5 bg-gray-700 transition-all duration-300 ${
                isMobileMenuOpen ? "-translate-y-1.5 -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
