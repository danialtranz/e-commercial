"use client";

import { createUserOrder } from "@/services/user/shopService";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import toast from "react-hot-toast";

function formatPrice(v: number | null | undefined) {
  if (v == null) return "—";
  return `${v.toLocaleString("vi-VN")} ₫`;
}

const CheckoutView: React.FC = () => {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (items.length === 0) throw new Error("EMPTY");
      const trimmed = address.trim();
      if (trimmed.length < 5) throw new Error("ADDRESS");
      return createUserOrder({
        items: items.map((x) => ({
          productId: x.productId,
          quantity: x.quantity,
        })),
        address: trimmed,
        note: note.trim() || undefined,
      });
    },
    onSuccess: (res) => {
      const c = res.data?.code;
      if (c === 0) {
        toast.success("Đặt hàng thành công!");
        clear();
        const orderId = (res.data?.data as { order?: { id?: string } })?.order
          ?.id;
        if (orderId) {
          router.push(`/account/orders/${orderId}`);
        } else {
          router.push("/account/orders");
        }
      } else {
        toast.error(res.data?.msg || "Không thể đặt hàng");
      }
    },
    onError: (e: unknown) => {
      if (e instanceof Error) {
        if (e.message === "EMPTY") {
          toast.error("Giỏ hàng trống");
          return;
        }
        if (e.message === "ADDRESS") {
          toast.error("Vui lòng nhập địa chỉ giao hàng (ít nhất 5 ký tự).");
          return;
        }
      }
      toast.error("Lỗi mạng hoặc phiên đăng nhập hết hạn.");
    },
  });

  if (itemCount === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-slate-600">Không có sản phẩm để thanh toán.</p>
        <Link href="/shop" className="mt-4 inline-block text-emerald-600">
          ← Về cửa hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 md:px-6">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Thanh toán</h1>
          <p className="mt-1 text-sm text-slate-600">
            Giá và tồn kho được xác nhận trên server khi đặt hàng.
          </p>

          <label className="mt-8 block text-sm font-medium text-slate-700">
            Địa chỉ giao hàng *
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={4}
              maxLength={500}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
              autoComplete="street-address"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Ghi chú (không bắt buộc)
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={2000}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </label>

          <button
            type="button"
            disabled={placeOrder.isPending}
            onClick={() => placeOrder.mutate()}
            className="mt-8 w-full rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {placeOrder.isPending ? "Đang xử lý…" : "Xác nhận đặt hàng"}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Đơn hàng</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((x) => (
              <li
                key={x.productId}
                className="flex justify-between gap-2 border-b border-slate-100 pb-2"
              >
                <span className="text-slate-700">
                  {x.name || x.productId}{" "}
                  <span className="text-slate-500">× {x.quantity}</span>
                </span>
                {x.priceHint != null && (
                  <span className="shrink-0 text-slate-500">
                    ~{formatPrice(x.priceHint * x.quantity)}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-amber-700">
            Tổng tiền chính thức hiển thị sau khi đặt hàng thành công (theo giá
            trong hệ thống).
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutView;
