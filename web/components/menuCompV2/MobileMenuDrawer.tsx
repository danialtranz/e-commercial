"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { NavLinkItem } from "./navConfig";

type UserInfo = {
  name?: string;
  email?: string;
  picture?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  navLinks: NavLinkItem[];
  isActive: (href: string) => boolean;
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  onLogout: () => void;
  onLogin: () => void;
};

const MobileMenuDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  navLinks,
  isActive,
  isLoggedIn,
  userInfo,
  onLogout,
  onLogin,
}) => {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          aria-label="Đóng menu"
          onClick={onClose}
        />
      )}

      <div
        className={`mobile-menu-drawer fixed right-0 top-0 z-[9999] h-full w-80 max-w-[85vw] transform bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
              aria-label="Đóng menu"
            >
              <i className="fas fa-times text-gray-700" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <nav className="mb-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all duration-200 ${
                    isActive(link.href)
                      ? "bg-organic/10 text-organic"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <i className={`fas ${link.icon} w-5 text-lg`} />
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-6 border-t border-gray-200 pt-6">
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  {userInfo?.picture && (
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-gray-200">
                      <Image
                        src={userInfo.picture}
                        alt="Ảnh đại diện"
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Xin chào, {userInfo?.name || "bạn"}
                    </p>
                    {userInfo?.email && (
                      <p className="truncate text-xs text-gray-500">
                        {userInfo.email}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onLogin();
                    onClose();
                  }}
                  className="group relative w-full overflow-hidden rounded-lg px-4 py-3 text-white transition-all duration-300"
                >
                  <span className="absolute inset-0 bg-organic" />
                  <span className="absolute inset-0 bg-organic-dark opacity-50 blur-lg" />
                  <span className="relative z-10 font-medium">Đăng nhập</span>
                </button>
              )}

              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <i className="fas fa-sign-out-alt" />
                  Đăng xuất
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenuDrawer;
