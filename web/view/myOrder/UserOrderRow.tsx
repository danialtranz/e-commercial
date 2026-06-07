"use client";

import { useState } from "react";
import type { UserDeliveryStatusRow } from "@/services/user/deliveryAndVoucherService";
import { formatPrice } from "@/lib/utils";
import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import UserOrderStatusModal from "./UserOrderStatusModal";

type StatusTone = "success" | "pending" | "danger" | "neutral";

function formatOrderDate(v?: string) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveDisplayStatus(value: UserDeliveryStatusRow): {
  label: string;
  tone: StatusTone;
} {
  const orderStatus = String(
    (value.order as { status?: string | null }).status ?? ""
  ).toLowerCase();
  const deliveryStatus = String(
    value.delivery?.deliveryStatus ?? ""
  ).toLowerCase();
  const paymentStatus = String(value.payment?.status ?? "").toLowerCase();

  if (
    orderStatus === "cancelled" ||
    orderStatus === "canceled" ||
    orderStatus === "cancel"
  ) {
    return { label: "Đã hủy", tone: "danger" };
  }

  if (orderStatus === "failed" || deliveryStatus === "failed") {
    return { label: "Giao thất bại", tone: "danger" };
  }

  if (
    deliveryStatus === "delivered_at" ||
    deliveryStatus === "delivered" ||
    orderStatus === "completed" ||
    orderStatus === "success"
  ) {
    return { label: "Đã giao", tone: "success" };
  }

  if (
    deliveryStatus === "picked" ||
    deliveryStatus === "assigned" ||
    deliveryStatus === "shipping"
  ) {
    return { label: "Đang giao", tone: "pending" };
  }

  if (
    paymentStatus === "waiting" ||
    paymentStatus === "pending" ||
    orderStatus === "pending" ||
    orderStatus === "processing"
  ) {
    return { label: "Chờ duyệt", tone: "pending" };
  }

  if (paymentStatus === "success" || paymentStatus === "paid") {
    return { label: "Đã thanh toán", tone: "success" };
  }

  const raw =
    (value.order as { status?: string | null }).status ||
    value.delivery?.deliveryStatus ||
    value.payment?.status;
  return { label: raw ? String(raw) : "—", tone: "neutral" };
}

function statusBadgeClass(tone: StatusTone) {
  switch (tone) {
    case "success":
      return "bg-green-100 text-green-600";
    case "pending":
      return "bg-yellow-100 text-yellow-600";
    case "danger":
      return "bg-red-100 text-red-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function StatusIcon({ label, tone }: { label: string; tone: StatusTone }) {
  if (tone === "success" || label === "Đã giao") {
    return <CheckCircle size={14} aria-hidden />;
  }
  if (tone === "pending" || label === "Chờ duyệt") {
    return <Clock size={14} aria-hidden />;
  }
  if (tone === "danger" || label === "Đã hủy" || label === "Giao thất bại") {
    return <XCircle size={14} aria-hidden />;
  }
  if (label === "Đang giao") {
    return <Truck size={14} aria-hidden />;
  }
  return null;
}

interface UserOrderRowProps {
  value: UserDeliveryStatusRow;
}

const UserOrderRow: React.FC<UserOrderRowProps> = ({ value }) => {
  const [open, setOpen] = useState(false);
  const order = value.order as {
    id?: string;
    status?: string | null;
    totalPrice?: number | null;
    createdAt?: string;
  };
  const orderId = order.id ?? "";
  const display = resolveDisplayStatus(value);
  const paymentMethod =
    typeof value.payment?.method === "string" && value.payment.method.trim()
      ? value.payment.method
      : "—";
  const total =
    typeof order.totalPrice === "number" ? order.totalPrice : 0;

  return (
    <>
      <div className="flex flex-col justify-between gap-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md md:flex-row">
        <div className="flex gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-organic/5 text-organic">
            <Package size={32} aria-hidden />
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-800">
              Đơn hàng #{orderId ? orderId.slice(0, 8) : "—"}
            </h4>
            <p className="mb-2 text-sm text-gray-500">
              Ngày đặt: {formatOrderDate(order.createdAt)}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-medium">
                Tổng tiền:{" "}
                <span className="font-bold text-organic">
                  {formatPrice(total)}
                </span>
              </span>
              <span className="text-gray-300" aria-hidden>
                |
              </span>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase">
                {paymentMethod}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between gap-4">
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase ${statusBadgeClass(
              display.tone
            )}`}
          >
            <StatusIcon label={display.label} tone={display.tone} />
            {display.label}
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-sm font-bold text-organic underline underline-offset-4 transition hover:text-organic-dark"
          >
            Xem chi tiết đơn
          </button>
        </div>
      </div>

      <UserOrderStatusModal
        open={open}
        onOpenChange={setOpen}
        data={value}
      />
    </>
  );
};

export default UserOrderRow;
