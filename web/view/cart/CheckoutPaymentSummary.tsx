"use client";

import React from "react";
import type { ICheckoutResultData } from "@/services/user/paymentService";

function formatVnd(v: number | null | undefined) {
  if (typeof v !== "number" || Number.isNaN(v)) return "—";
  return `${v.toLocaleString("vi-VN")} ₫`;
}

function AmountRow({
  label,
  value,
  highlight = false,
  negative = false,
  icon,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  negative?: boolean;
  icon?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm ${
        highlight
          ? "border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-50 to-white font-semibold shadow-sm"
          : "bg-slate-50/90"
      }`}
    >
      <span className="flex items-center gap-2 text-slate-600">
        {icon ? <i className={`fas ${icon} text-xs`} aria-hidden /> : null}
        {label}
      </span>
      <span
        className={
          highlight
            ? "text-lg font-black text-emerald-700"
            : negative
              ? "font-semibold text-red-600"
              : "font-medium text-slate-800"
        }
      >
        {value}
      </span>
    </div>
  );
}

export default function CheckoutPaymentSummary({
  result,
  method,
}: {
  result: ICheckoutResultData;
  method: "COD" | "MOMO";
}) {
  const amounts = result.amounts;
  const orderTotal = amounts?.order_total_price;
  const flashDiscount = amounts?.flash_sale_discount ?? 0;
  const voucherDiscount = amounts?.voucher_discount ?? 0;
  const amountToPay =
    amounts?.amount_to_pay ??
    result.payment?.amount ??
    result.order?.totalPrice ??
    0;
  const totalSaved = amounts?.discount ?? flashDiscount + voucherDiscount;
  const applied = result.flash_sale?.applied ?? [];
  const isCod = method === "COD";

  return (
    <div className="w-full max-w-md space-y-3 text-left">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          <i className="fas fa-receipt text-emerald-600" aria-hidden />
          Chi tiết thanh toán
        </p>

        <div className="space-y-2">
          {typeof orderTotal === "number" ? (
            <AmountRow
              label="Tiền hàng (trước giảm)"
              value={formatVnd(orderTotal)}
              icon="fa-shopping-basket"
            />
          ) : null}

          {flashDiscount > 0 ? (
            <AmountRow
              label="Giảm flash sale"
              value={`−${formatVnd(flashDiscount)}`}
              negative
              icon="fa-bolt"
            />
          ) : null}

          {voucherDiscount > 0 ? (
            <AmountRow
              label="Giảm voucher"
              value={`−${formatVnd(voucherDiscount)}`}
              negative
              icon="fa-ticket-alt"
            />
          ) : null}

          {totalSaved > 0 ? (
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-800">
              <i className="fas fa-piggy-bank mr-1.5" aria-hidden />
              Bạn đã tiết kiệm {formatVnd(totalSaved)}
            </div>
          ) : null}

          <AmountRow
            label={
              isCod
                ? "Thanh toán khi nhận hàng (COD)"
                : "Đã thanh toán qua Momo"
            }
            value={formatVnd(amountToPay)}
            highlight
            icon={isCod ? "fa-hand-holding-usd" : "fa-mobile-alt"}
          />
        </div>
      </div>

      {applied.length > 0 ? (
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-3 text-xs text-red-900">
          <p className="mb-2 font-bold uppercase tracking-wide">
            <i className="fas fa-fire mr-1.5" aria-hidden />
            Flash sale đã áp dụng
          </p>
          <ul className="space-y-1.5">
            {applied.map((row) => (
              <li
                key={`${row.campaignId}-${row.productId}`}
                className="flex justify-between gap-2"
              >
                <span className="font-mono text-[10px] text-red-800/80">
                  {row.productId.slice(0, 8)}… ×{row.quantity}
                </span>
                <span className="font-semibold text-red-700">
                  −{formatVnd(row.flashSaleDiscount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.shipper_assignment?.deliveryAddress ? (
        <p className="text-center text-xs text-slate-500">
          <i className="fas fa-map-marker-alt mr-1 text-sky-500" aria-hidden />
          Giao hàng khu vực {result.shipper_assignment.deliveryAddress}
        </p>
      ) : null}
    </div>
  );
}
