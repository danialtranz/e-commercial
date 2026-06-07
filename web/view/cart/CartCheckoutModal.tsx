"use client";

import React, { useState } from "react";
import { Modal } from "antd";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import type { ICheckoutResultData } from "@/services/user/paymentService";
import CheckoutCelebration from "./CheckoutCelebration";
import CheckoutPaymentSummary from "./CheckoutPaymentSummary";

export type CheckoutStep =
  | "select"
  | "creating"
  | "momo-qr"
  | "cod-done"
  | "momo-done";

interface Props {
  open: boolean;
  step: CheckoutStep;
  orderId: string | null;
  checkoutResult?: ICheckoutResultData | null;
  checkoutLoading?: boolean;
  deliveryTarget: "I3" | "I4" | "I5";
  onDeliveryTargetChange: (target: "I3" | "I4" | "I5") => void;
  vouchers: Array<{
    id: string;
    name: string;
    discount: number;
  }>;
  selectedVoucherId: string | null;
  onVoucherChange: (voucherId: string | null) => void;
  onClose: () => void;
  /** Gọi sau khi user chọn COD hoặc Momo và bấm xác nhận */
  onConfirmPaymentMethod: (method: "COD" | "MOMO") => void;
}

const DELIVERY_ZONES = ["I3", "I4", "I5"] as const;

function ModalSectionHeading({
  icon,
  label,
  className = "text-emerald-600",
}: {
  icon: string;
  label: string;
  className?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 ${className}`}
      >
        <i className={`fas ${icon} text-sm`} aria-hidden />
      </span>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </span>
    </div>
  );
}

function stepModalTitle(step: CheckoutStep): React.ReactNode {
  if (step === "select") {
    return (
      <span className="inline-flex items-center gap-2 text-slate-900">
        <i className="fas fa-wallet text-emerald-600" aria-hidden />
        Chọn phương thức thanh toán
      </span>
    );
  }
  if (step === "cod-done") {
    return (
      <span className="inline-flex items-center gap-2 text-slate-900">
        <i className="fas fa-money-bill-wave text-emerald-600" aria-hidden />
        Đặt hàng COD thành công
      </span>
    );
  }
  if (step === "momo-done") {
    return (
      <span className="inline-flex items-center gap-2 text-slate-900">
        <i className="fas fa-circle-check text-pink-600" aria-hidden />
        Thanh toán Momo thành công
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-slate-900">
      <i className="fas fa-qrcode text-pink-600" aria-hidden />
      Thanh toán
    </span>
  );
}

function PaymentSuccessView({
  method,
  checkoutResult,
  onClose,
}: {
  method: "COD" | "MOMO";
  checkoutResult: ICheckoutResultData | null;
  onClose: () => void;
}) {
  const isCod = method === "COD";
  const amountToPay =
    checkoutResult?.amounts?.amount_to_pay ?? checkoutResult?.payment?.amount;

  return (
    <div className="relative flex flex-col items-center gap-5 py-6 text-center">
      <CheckoutCelebration />

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full shadow-lg ${
          isCod
            ? "bg-emerald-100 text-emerald-700 shadow-emerald-100"
            : "bg-pink-100 text-pink-700 shadow-pink-100"
        }`}
      >
        <i
          className={`fas ${isCod ? "fa-check" : "fa-check-double"} text-3xl`}
          aria-hidden
        />
        <span
          className={`absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md ${
            isCod ? "text-emerald-600" : "text-pink-600"
          }`}
        >
          <i
            className={`fas ${isCod ? "fa-hand-holding-usd" : "fa-mobile-alt"} text-sm`}
            aria-hidden
          />
        </span>
      </motion.div>

      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 space-y-2"
      >
        <p className="flex items-center justify-center gap-2 text-base font-semibold text-slate-900">
          <i
            className={`fas fa-circle-check ${isCod ? "text-emerald-600" : "text-pink-600"}`}
            aria-hidden
          />
          {isCod ? "Đặt hàng COD thành công" : "Thanh toán Momo thành công"}
        </p>
        <p className="mx-auto max-w-sm text-sm text-slate-600">
          {isCod ? (
            <>
              <i className="fas fa-truck mr-1.5 text-sky-500" aria-hidden />
              Đơn đã được ghi nhận. Khi nhận hàng, bạn thanh toán{" "}
              <span className="font-bold text-emerald-700">
                {typeof amountToPay === "number"
                  ? `${amountToPay.toLocaleString("vi-VN")} ₫`
                  : "số tiền bên dưới"}
              </span>
              .
            </>
          ) : (
            <>
              <i className="fas fa-wallet mr-1.5 text-pink-500" aria-hidden />
              Giao dịch Momo đã hoàn tất. Số tiền đã trả:{" "}
              <span className="font-bold text-pink-700">
                {typeof amountToPay === "number"
                  ? `${amountToPay.toLocaleString("vi-VN")} ₫`
                  : "—"}
              </span>
              .
            </>
          )}
        </p>
      </motion.div>

      {checkoutResult ? (
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="relative z-10 w-full"
        >
          <CheckoutPaymentSummary result={checkoutResult} method={method} />
        </motion.div>
      ) : null}

      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onClose}
        aria-label="Đóng"
        className="relative z-10 mt-1 flex items-center gap-2 rounded-full bg-slate-900 px-8 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
      >
        <i className="fas fa-door-open" aria-hidden />
        Đóng
      </motion.button>
    </div>
  );
}

const CartCheckoutModal: React.FC<Props> = ({
  open,
  step,
  orderId,
  checkoutResult = null,
  checkoutLoading = false,
  deliveryTarget,
  onDeliveryTargetChange,
  vouchers,
  selectedVoucherId,
  onVoucherChange,
  onClose,
  onConfirmPaymentMethod,
}) => {
  const [method, setMethod] = useState<"COD" | "MOMO" | null>(null);

  const blockClose =
    step === "creating" || (step === "momo-qr" && checkoutLoading);
  const isSuccessStep = step === "cod-done" || step === "momo-done";

  const handleConfirm = () => {
    if (!method) return;
    onConfirmPaymentMethod(method);
  };

  return (
    <Modal
      title={stepModalTitle(step)}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      centered
      maskClosable={!blockClose}
      closable={!blockClose}
      width={isSuccessStep ? 520 : 480}
      className="checkout-modal [&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:rounded-[20px]"
      styles={{
        body: { padding: isSuccessStep ? "12px 20px 20px" : "20px 24px 24px" },
      }}
      afterOpenChange={(visible) => {
        if (!visible) setMethod(null);
      }}
    >
      {step === "select" && (
        <div className="space-y-5">
          <p className="flex items-center justify-center gap-2 text-center text-sm text-slate-600">
            <i className="fas fa-info-circle text-slate-400" aria-hidden />
            Chọn một phương thức để tiếp tục.
          </p>

          <ModalSectionHeading
            icon="fa-credit-card"
            label="Phương thức thanh toán"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              aria-label="Thanh toán COD khi nhận hàng"
              aria-pressed={method === "COD"}
              onClick={() => setMethod("COD")}
              className={`group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all duration-200 ${
                method === "COD"
                  ? "border-emerald-500 bg-gradient-to-b from-emerald-50 to-white shadow-lg shadow-emerald-100/80 ring-2 ring-emerald-200/60"
                  : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md"
              }`}
            >
              {method === "COD" && (
                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <i className="fas fa-check text-[10px]" aria-hidden />
                </span>
              )}
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
                  method === "COD"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-emerald-700 group-hover:bg-emerald-100"
                }`}
              >
                <i className="fas fa-hand-holding-usd text-2xl" aria-hidden />
              </span>
              <span className="text-base font-semibold text-slate-900">
                COD
              </span>
              <span className="text-center text-xs text-slate-500">
                Thanh toán khi nhận hàng
              </span>
            </button>

            <button
              type="button"
              aria-label="Thanh toán Momo quét mã QR"
              aria-pressed={method === "MOMO"}
              onClick={() => setMethod("MOMO")}
              className={`group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all duration-200 ${
                method === "MOMO"
                  ? "border-pink-500 bg-gradient-to-b from-pink-50 to-white shadow-lg shadow-pink-100/80 ring-2 ring-pink-200/60"
                  : "border-slate-200 bg-white hover:border-pink-300 hover:shadow-md"
              }`}
            >
              {method === "MOMO" && (
                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-pink-600 text-white">
                  <i className="fas fa-check text-[10px]" aria-hidden />
                </span>
              )}
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
                  method === "MOMO"
                    ? "bg-[#a50064] text-white"
                    : "bg-slate-100 text-pink-700 group-hover:bg-pink-100"
                }`}
              >
                <i className="fas fa-mobile-alt text-2xl" aria-hidden />
              </span>
              <span className="text-base font-semibold text-slate-900">
                Momo
              </span>
              <span className="text-center text-xs text-slate-500">
                Quét mã QR để thanh toán
              </span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
            <ModalSectionHeading
              icon="fa-truck"
              label="Khu vực giao hàng"
              className="text-sky-600"
            />
            <div className="flex flex-wrap justify-center gap-3">
              {DELIVERY_ZONES.map((zone) => {
                const active = deliveryTarget === zone;
                return (
                  <button
                    key={zone}
                    type="button"
                    aria-label={`Khu vực giao hàng ${zone}`}
                    aria-pressed={active}
                    onClick={() => onDeliveryTargetChange(zone)}
                    className={`flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-xl border-2 transition-all ${
                      active
                        ? "border-sky-600 bg-sky-600 text-white shadow-md shadow-sky-200"
                        : "border-slate-200 bg-white text-sky-700 hover:border-sky-300 hover:bg-sky-50"
                    }`}
                  >
                    <i
                      className={`fas fa-map-marker-alt text-sm ${active ? "text-white" : "text-sky-500"}`}
                      aria-hidden
                    />
                    <span className="text-[10px] font-bold leading-none">
                      {zone}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-amber-50/40 to-white p-4 shadow-sm">
            <ModalSectionHeading
              icon="fa-ticket-alt"
              label="Voucher (tuỳ chọn)"
              className="text-amber-600"
            />
            <div className="relative">
              <span
                className="pointer-events-none absolute left-3.5 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-amber-100 text-amber-700"
                aria-hidden
              >
                <i className="fas fa-percent text-sm" />
              </span>
              <select
                value={selectedVoucherId ?? ""}
                onChange={(e) => onVoucherChange(e.target.value || null)}
                aria-label="Chọn voucher"
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-14 pr-10 text-sm text-slate-800 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              >
                <option value="">Không dùng voucher</option>
                {vouchers.map((voucher) => (
                  <option key={voucher.id} value={voucher.id}>
                    {`${voucher.name} · −${voucher.discount.toLocaleString("vi-VN")}đ`}
                  </option>
                ))}
              </select>
              <i
                className="fas fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                aria-hidden
              />
            </div>
          </div>

          <button
            type="button"
            disabled={!method}
            onClick={handleConfirm}
            aria-label="Xác nhận thanh toán"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200/50 transition hover:from-emerald-700 hover:to-emerald-800 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
          >
            <i className="fas fa-check-circle text-base" aria-hidden />
            <span>Xác nhận thanh toán</span>
          </button>
        </div>
      )}

      {step === "creating" && (
        <div className="flex flex-col items-center gap-5 py-14">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
            <i
              className="fas fa-spinner fa-spin text-3xl text-emerald-600"
              aria-hidden
            />
            <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md">
              <i className="fas fa-box text-sm text-emerald-700" aria-hidden />
            </span>
          </div>
          <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <i className="fas fa-hourglass-half text-emerald-600" aria-hidden />
            Đang tạo đơn hàng...
          </p>
        </div>
      )}

      {step === "momo-qr" && orderId && (
        <div className="flex flex-col items-center gap-5 py-2">
          <p className="flex flex-wrap items-center justify-center gap-1.5 text-center text-xs text-slate-500">
            <i className="fas fa-qrcode text-pink-600" aria-hidden />
            <span>Momo — mã đơn (QR):</span>
            <span className="font-mono font-medium text-slate-800">
              {orderId}
            </span>
          </p>
          <div className="rounded-3xl border-2 border-pink-100 bg-white p-5 shadow-inner shadow-pink-50">
            <QRCodeSVG value={orderId} size={220} level="M" />
          </div>
          {checkoutLoading ? (
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
              <i className="fas fa-spinner fa-spin" aria-hidden />
              Đang xác nhận thanh toán Momo...
            </div>
          ) : (
            <p className="flex max-w-xs items-center justify-center gap-2 text-center text-xs text-slate-500">
              <i className="fas fa-spinner fa-spin text-pink-500" aria-hidden />
              Đang chuyển sang màn hình xác nhận thanh toán...
            </p>
          )}
        </div>
      )}

      {step === "cod-done" && (
        <PaymentSuccessView
          method="COD"
          checkoutResult={checkoutResult}
          onClose={onClose}
        />
      )}

      {step === "momo-done" && (
        <PaymentSuccessView
          method="MOMO"
          checkoutResult={checkoutResult}
          onClose={onClose}
        />
      )}
    </Modal>
  );
};

export default CartCheckoutModal;
