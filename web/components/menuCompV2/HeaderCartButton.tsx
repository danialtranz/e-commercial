"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useGetUserCartOrderProducts } from "@/hooks/user/useUserHook";
import {
  getAuthSessionServerSnapshot,
  getAuthSessionSnapshot,
  subscribeAuthSession,
} from "@/lib/authSession";
import { formatPrice } from "@/lib/utils";

export function HeaderCartButton() {
  const { isLoggedIn } = useSyncExternalStore(
    subscribeAuthSession,
    getAuthSessionSnapshot,
    getAuthSessionServerSnapshot
  );

  const { order, items, loading } = useGetUserCartOrderProducts(isLoggedIn);

  const totalItems = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const totalPrice = order?.totalPrice ?? 0;
  const badgeCount = isLoggedIn ? (loading ? "…" : totalItems) : 0;

  return (
    <Link
      href="/cart"
      className="relative bg-organic hover:bg-organic-dark transition-colors text-white flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-full shadow-lg group"
      aria-label="Giỏ hàng"
    >
      <div className="relative">
        <ShoppingCart size={20} />
        <span className="absolute -top-3 -right-3 bg-white text-organic text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-organic">
          {badgeCount}
        </span>
      </div>
      <span className="font-bold text-sm hidden sm:inline">
        {isLoggedIn
          ? loading
            ? "..."
            : formatPrice(totalPrice)
          : formatPrice(0)}
      </span>
    </Link>
  );
}
