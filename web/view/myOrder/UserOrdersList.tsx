"use client";

import type { UserDeliveryStatusRow } from "@/services/user/deliveryAndVoucherService";
import UserOrderRow from "./UserOrderRow";

interface UserOrdersListProps {
  orders: UserDeliveryStatusRow[];
  loading: boolean;
}

const UserOrdersList: React.FC<UserOrdersListProps> = ({ orders, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg bg-gray-100"
            aria-hidden
          />
        ))}
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-12 text-center shadow-sm">
        <p className="text-lg font-bold text-gray-800">
          Bạn chưa có đơn hàng nào.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Hãy mua sắm để bắt đầu tạo đơn đầu tiên của bạn.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((x, index) => {
        const orderId =
          typeof x.order?.id === "string" && x.order.id.trim()
            ? x.order.id
            : `order-${index}`;
        return <UserOrderRow key={orderId} value={x} />;
      })}
    </div>
  );
};

export default UserOrdersList;
