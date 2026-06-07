"use client";

import React from "react";
import { useGetUserCartOrderProducts } from "@/hooks/user/useUserHook";
import { ShoppingCart } from "lucide-react";
import CartItemList from "./CartItemList";
import CartOrderSummaryCard from "./CartOrderSummaryCard";

const CartView: React.FC = () => {
  const { order, items, loading, refetch } = useGetUserCartOrderProducts();

  return (
    <div className="mx-auto min-h-screen max-w-[1200px] px-4 py-12">
      <h2 className="mb-8 flex items-center gap-3 text-2xl font-bold text-gray-800">
        <ShoppingCart className="text-organic" size={28} aria-hidden />
        Giỏ hàng
      </h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg bg-gray-100"
              aria-hidden
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <CartOrderSummaryCard order={order} />
          <CartItemList items={items} onOrderComplete={() => void refetch()} />
        </div>
      )}
    </div>
  );
};

export default CartView;
