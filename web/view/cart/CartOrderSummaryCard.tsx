"use client";

import React from "react";
import type { IUserCartOrder } from "@/services/user/orderService";
import { formatPrice } from "@/lib/utils";
import { Package } from "lucide-react";

const formatCurrency = (v: number | null | undefined) => {
  if (typeof v !== "number") return "—";
  return `${v.toLocaleString("vi-VN")} ₫`;
};

function orderStatusBadgeClass(status?: string | null) {
  const n = (status || "").toLowerCase();
  if (n === "cart" || n === "pending" || n === "processing") {
    return "bg-yellow-100 text-yellow-600";
  }
  if (n === "paid" || n === "success" || n === "completed") {
    return "bg-green-100 text-green-600";
  }
  if (n === "cancelled" || n === "canceled" || n === "failed") {
    return "bg-red-100 text-red-600";
  }
  return "bg-gray-100 text-gray-600";
}

interface Props {
  order: IUserCartOrder | null;
}

const CartOrderSummaryCard: React.FC<Props> = ({ order }) => {
  if (!order) return null;

  const summaryItems = [
    {
      label: "Tổng tiền",
      value: formatCurrency(order.totalPrice),
      highlight: true,
    },
  ];

  return (
    <div className="flex flex-col justify-between gap-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md md:flex-row">
      <div className="flex gap-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-organic/5 text-organic">
          <Package size={32} aria-hidden />
        </div>
        <div>
          <h4 className="text-lg font-bold text-gray-800">
            Thông tin giỏ hàng
          </h4>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {summaryItems.map((item, idx) => (
              <span key={item.label} className="flex items-center gap-4">
                {idx > 0 ? (
                  <span className="text-gray-300" aria-hidden>
                    |
                  </span>
                ) : null}
                <span className="font-medium text-gray-700">
                  {item.label}:{" "}
                  {item.highlight ? (
                    <span className="font-bold text-organic">
                      {typeof order.totalPrice === "number"
                        ? formatPrice(order.totalPrice)
                        : item.value}
                    </span>
                  ) : (
                    <span className="text-gray-800">{item.value}</span>
                  )}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end justify-center gap-2">
        <span
          className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase ${orderStatusBadgeClass(
            order.status
          )}`}
        >
          {order.status || "—"}
        </span>
        <span className="text-[10px] font-bold uppercase text-gray-400">
          Trạng thái giỏ hàng
        </span>
      </div>
    </div>
  );
};

export default CartOrderSummaryCard;
