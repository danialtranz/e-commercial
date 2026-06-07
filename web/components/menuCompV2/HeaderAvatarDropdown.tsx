"use client";

import React, { RefObject } from "react";
import Image from "next/image";
import Link from "next/link";

type UserInfo = {
  name?: string;
  email?: string;
  picture?: string;
};

type Props = {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  onLogout: () => void;
  profileDropdownRef: RefObject<HTMLDivElement | null>;
  onLoginClick: () => void;
};

const HeaderAvatarDropdown: React.FC<Props> = ({
  isLoggedIn,
  userInfo,
  isOpen,
  setIsOpen,
  onLogout,
  profileDropdownRef,
  onLoginClick,
}) => {
  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={onLoginClick}
        className="inline-flex items-center gap-2 rounded-full bg-organic hover:bg-organic-dark px-4 py-2 text-xs font-bold text-white shadow-lg transition-colors"
      >
        Đăng nhập
      </button>
    );
  }

  return (
    <div className="relative flex items-center" ref={profileDropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-organic"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Menu tài khoản"
      >
        {userInfo?.picture ? (
          <div className="relative h-9 w-9 overflow-hidden rounded-full border border-gray-200 transition hover:border-organic-dark">
            <Image
              src={userInfo.picture}
              alt="Ảnh đại diện"
              fill
              sizes="36px"
              className="object-cover"
            />
          </div>
        ) : (
          <Image
            src="https://ui-avatars.com/api/?name=User&background=6366f1&color=fff"
            alt="Người dùng"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full ring-2 ring-gray-200 transition hover:ring-organic"
            unoptimized
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center gap-3">
              {userInfo?.picture ? (
                <div className="relative h-10 w-10 overflow-hidden rounded-full border border-gray-200">
                  <Image
                    src={userInfo.picture}
                    alt="Ảnh đại diện"
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <Image
                  src="https://ui-avatars.com/api/?name=User&background=6366f1&color=fff"
                  alt="Người dùng"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full ring-2 ring-gray-200"
                  unoptimized
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {userInfo?.name || "Người dùng"}
                </p>
                {userInfo?.email && (
                  <p className="truncate text-xs text-gray-500">
                    {userInfo.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 p-2">
            <Link
              href="/account"
              className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <i className="fas fa-user w-5" />
              Tài khoản
            </Link>
            <Link
              href="/my-order"
              className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <i className="fas fa-receipt w-5" />
              Đơn hàng của tôi
            </Link>
          </div>

          <div className="p-2">
            <button
              type="button"
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <i className="fas fa-sign-out-alt w-5" />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderAvatarDropdown;
