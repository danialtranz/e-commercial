"use client";

import { useGetUserDeliveryStatus } from "@/hooks/user/useUserHook";
import UserOrdersList from "@/view/myOrder/UserOrdersList";
import { Package } from "lucide-react";
import Link from "next/link";
import React from "react";

const OrdersView: React.FC = () => {
  const { items, loading, data } = useGetUserDeliveryStatus({
    page: 1,
    page_size: 20,
  });

  if (!data && !loading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-12 text-center">
        <p className="text-gray-600">
          Không tải được danh sách đơn hàng. Vui lòng đăng nhập lại.
        </p>
        <Link
          href="/user-login"
          className="mt-4 inline-block text-sm font-bold text-organic underline underline-offset-4 hover:text-organic-dark"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12">
      <h2 className="mb-8 flex items-center gap-3 text-2xl font-bold text-gray-800">
        <Package className="text-organic" size={28} aria-hidden />
        Lịch sử đơn hàng
      </h2>
      <UserOrdersList orders={items} loading={loading} />
    </div>
  );
};

export default OrdersView;
