"use client";

import { fetchMyOrderById } from "@/services/user/shopService";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

function formatPrice(v: unknown) {
  if (typeof v !== "number") return "—";
  return `${v.toLocaleString("vi-VN")} ₫`;
}

const OrderDetailView: React.FC = () => {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";

  const { data, isLoading } = useQuery({
    queryKey: ["my", "order", id],
    queryFn: async () => {
      const res = await fetchMyOrderById(id);
      const body = res.data;
      if (!body || (body.code !== 0 && body.code !== 200) || !body.data) {
        throw new Error("NOT_FOUND");
      }
      return body.data;
    },
    enabled: !!id,
  });

  if (!id) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20 text-slate-500">
        <i className="fas fa-spinner fa-spin mr-2" /> Đang tải…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p>Không tìm thấy đơn hàng.</p>
        <Link href="/account/orders" className="mt-4 text-emerald-600">
          ← Danh sách đơn
        </Link>
      </div>
    );
  }

  const order = data.order as Record<string, unknown>;
  const items = (data.items as Record<string, unknown>[]) || [];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 md:px-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/account/orders"
          className="text-sm text-emerald-700 hover:underline"
        >
          ← Đơn hàng của tôi
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Chi tiết đơn hàng
        </h1>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs text-slate-500">Mã đơn</p>
          <p className="font-mono text-sm">{String(order.id)}</p>
          <p className="mt-4 text-xs text-slate-500">Trạng thái</p>
          <p className="capitalize">{String(order.status)}</p>
          <p className="mt-4 text-xs text-slate-500">Tổng tiền</p>
          <p className="text-xl font-bold text-emerald-700">
            {formatPrice(order.totalPrice)}
          </p>
          <p className="mt-4 text-xs text-slate-500">Địa chỉ</p>
          <p className="text-sm text-slate-800">{String(order.address)}</p>
          {order.note ? (
            <>
              <p className="mt-4 text-xs text-slate-500">Ghi chú</p>
              <p className="text-sm text-slate-800">{String(order.note)}</p>
            </>
          ) : null}
        </div>

        <h2 className="mt-8 font-semibold text-slate-900">Sản phẩm</h2>
        <ul className="mt-4 space-y-2">
          {items.map((it) => (
            <li
              key={String(it.id)}
              className="flex justify-between rounded-lg border border-slate-100 bg-white px-4 py-3 text-sm"
            >
              <span className="text-slate-700">
                {String(it.productId)}{" "}
                <span className="text-slate-500">× {String(it.quantity)}</span>
              </span>
              <span className="text-slate-600">
                {formatPrice(it.price as number)} / sp
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default OrderDetailView;
