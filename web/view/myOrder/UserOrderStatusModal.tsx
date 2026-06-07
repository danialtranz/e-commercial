"use client";

import { useState } from "react";
import type { UserDeliveryStatusRow } from "@/services/user/deliveryAndVoucherService";
import { useCancelUserOrder } from "@/hooks/user/useUserHook";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Banknote,
  CircleCheck,
  ClipboardList,
  CreditCard,
  Package,
  Sparkles,
  Truck,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

function formatPrice(v: unknown) {
  if (typeof v !== "number") return "—";
  return `${v.toLocaleString("vi-VN")} ₫`;
}

type DeliveryOutcome = "in_progress" | "delivered" | "failed" | "cancelled";
type StepVisualState =
  | "pending"
  | "active"
  | "completed"
  | "failed"
  | "cancelled";

function resolveDeliveryOutcome(
  orderStatus: string,
  deliveryStatus: string
): DeliveryOutcome {
  const os = orderStatus.toLowerCase();
  const ds = deliveryStatus.toLowerCase();
  if (os === "cancel" || os === "cancelled" || os === "canceled") {
    return "cancelled";
  }
  if (ds === "failed" || os === "failed") return "failed";
  if (ds === "delivered_at" || ds === "delivered") return "delivered";
  return "in_progress";
}

function getCurrentStep(deliveryStatus?: string | null): number {
  const normalized = (deliveryStatus || "").toLowerCase();
  if (normalized === "delivered_at" || normalized === "failed") return 3;
  if (normalized === "picked") return 2;
  if (normalized === "assigned") return 1;
  return 1;
}

function deliveryStatusLabel(status?: string | null): string {
  const normalized = (status || "").toLowerCase();
  if (normalized === "assigned") return "Đã phân công";
  if (normalized === "picked") return "Đang vận chuyển";
  if (normalized === "delivered_at") return "Giao thành công";
  if (normalized === "failed") return "Giao thất bại";
  if (!normalized) return "Chưa cập nhật";
  return status || "Chưa cập nhật";
}

function orderStatusLabel(status: string): string {
  const n = status.toLowerCase();
  if (n === "processing") return "Đang xử lý";
  if (n === "cancel") return "Đã hủy";
  if (n === "failed") return "Giao thất bại";
  if (n === "paid") return "Đã thanh toán";
  if (n === "order") return "Chờ thanh toán";
  return status || "—";
}

function getStepVisualState(
  step: number,
  currentStep: number,
  outcome: DeliveryOutcome
): StepVisualState {
  if (step < currentStep) return "completed";
  if (step > currentStep) return "pending";
  if (step === 3 && outcome === "failed") return "failed";
  if (step === 3 && outcome === "cancelled") return "cancelled";
  if (step === 3 && outcome === "delivered") return "completed";
  return "active";
}

function stepCircleClass(state: StepVisualState): string {
  switch (state) {
    case "completed":
      return "border-organic bg-organic text-white shadow-[0_8px_24px_-6px_rgba(34,139,34,0.45)]";
    case "active":
      return "border-organic bg-white text-organic shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] ring-2 ring-organic/15 sm:ring-4";
    case "failed":
      return "border-rose-400 bg-rose-500 text-white shadow-[0_8px_24px_-6px_rgba(225,29,72,0.4)]";
    case "cancelled":
      return "border-slate-300 bg-slate-500 text-white shadow-md";
    default:
      return "border-slate-200 bg-slate-50 text-slate-400";
  }
}

function stepLineClass(state: StepVisualState): string {
  if (state === "completed") return "bg-organic";
  if (state === "failed") return "bg-rose-300";
  if (state === "cancelled") return "bg-slate-300";
  return "bg-slate-200";
}

function paymentStatusClass(status?: string | null) {
  const normalized = (status || "").toLowerCase();
  if (normalized === "success" || normalized === "paid") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200/80";
  }
  if (normalized === "waiting" || normalized === "pending") {
    return "bg-amber-50 text-amber-800 ring-amber-200/80";
  }
  return "bg-slate-50 text-slate-700 ring-slate-200/80";
}

interface UserOrderStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: UserDeliveryStatusRow;
}

const UserOrderStatusModal: React.FC<UserOrderStatusModalProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const [cancelReason, setCancelReason] = useState("");
  const { cancelOrder, loading: cancelLoading } = useCancelUserOrder();

  const order = data.order as {
    id?: string;
    status?: string | null;
  };
  const payment = data.payment;
  const delivery = data.delivery;
  const orderId = order.id ?? "";
  const orderStatus = String(order.status ?? "");
  const deliveryStatus = String(delivery?.deliveryStatus ?? "");
  const outcome = resolveDeliveryOutcome(orderStatus, deliveryStatus);
  const currentStep = getCurrentStep(delivery?.deliveryStatus ?? null);
  const canCancelOrder =
    orderStatus.toLowerCase() === "processing" && !!orderId;

  const stepThreeTitle = outcome === "failed" ? "Giao thất bại" : "Hoàn tất";
  const stepThreeSubtitle =
    outcome === "failed" ? "Không giao được" : "Đã giao hàng";
  const StepThreeIcon: LucideIcon =
    outcome === "failed" ? XCircle : CircleCheck;

  const timelineSteps: {
    step: number;
    title: string;
    subtitle: string;
    icon: LucideIcon;
  }[] = [
    { step: 1, title: "Tạo đơn", subtitle: "Phân công", icon: ClipboardList },
    { step: 2, title: "Vận chuyển", subtitle: "Lấy hàng", icon: Truck },
    {
      step: 3,
      title: stepThreeTitle,
      subtitle: stepThreeSubtitle,
      icon: StepThreeIcon,
    },
  ];

  const handleCancelOrder = async () => {
    const reason = cancelReason.trim();
    if (!orderId || !reason) return;

    const res = await cancelOrder({ orderId, reason });
    if (res.code === 0 || res.code === 200) {
      setCancelReason("");
      onOpenChange(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setCancelReason("");
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[min(92dvh,680px)] w-[calc(100%-1.25rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-[#faf9f7] p-0 shadow-2xl shadow-slate-900/10 top-[max(0.75rem,2dvh)] translate-y-0 sm:top-[50%] sm:max-h-[min(88dvh,720px)] sm:translate-y-[-50%] sm:rounded-3xl"
        onPointerDownOutside={() => handleOpenChange(false)}
      >
        <DialogHeader className="shrink-0 space-y-0 text-left">
          <div className="relative overflow-hidden bg-linear-to-br from-[#1a3d2e] via-organic to-[#2d6a4f] px-4 pb-4 pt-4 pr-12 text-white sm:px-6 sm:pb-5 sm:pt-5 sm:pr-14">
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-0 left-1/3 h-24 w-48 rounded-full bg-white/5 blur-xl"
              aria-hidden
            />
            <div className="relative flex items-start gap-2.5 sm:gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm sm:h-11 sm:w-11 sm:rounded-2xl">
                <Package
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-base font-semibold tracking-tight text-white sm:text-xl">
                  Chi tiết đơn hàng
                </DialogTitle>
                <DialogDescription className="mt-1 hidden text-xs text-white/75 sm:block sm:text-sm">
                  Theo dõi tiến trình giao hàng và thanh toán
                </DialogDescription>
              </div>
            </div>
            {orderId && (
              <div className="relative mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 backdrop-blur-md sm:mt-4 sm:px-3 sm:py-1.5"></div>
            )}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4">
          <div className="space-y-4 sm:space-y-6">
            {/* Timeline */}
            <section aria-label="Tiến trình giao hàng">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:mb-4 sm:text-[11px] sm:tracking-[0.2em]">
                Tiến trình
              </p>
              <div className="flex items-start justify-between gap-1">
                {timelineSteps.map(
                  ({ step, title, subtitle, icon: Icon }, idx) => {
                    const visual = getStepVisualState(
                      step,
                      currentStep,
                      outcome
                    );
                    const lineState =
                      step < 3
                        ? getStepVisualState(step + 1, currentStep, outcome)
                        : "pending";

                    return (
                      <div
                        key={step}
                        className="flex flex-1 flex-col items-center"
                      >
                        <div className="relative flex w-full items-center justify-center">
                          {idx > 0 && (
                            <div
                              className={`absolute right-1/2 h-0.5 w-full -translate-y-1/2 ${stepLineClass(
                                getStepVisualState(step, currentStep, outcome)
                              )}`}
                              aria-hidden
                            />
                          )}
                          {idx < timelineSteps.length - 1 && (
                            <div
                              className={`absolute left-1/2 h-0.5 w-full -translate-y-1/2 ${stepLineClass(lineState)}`}
                              aria-hidden
                            />
                          )}
                          <div
                            className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-11 sm:w-11 md:h-12 md:w-12 ${stepCircleClass(visual)}`}
                          >
                            <Icon
                              className="h-4 w-4 sm:h-[18px] sm:w-[18px] md:h-5 md:w-5"
                              strokeWidth={1.75}
                              aria-hidden
                            />
                          </div>
                        </div>
                        <p
                          className={`mt-2 text-center text-[10px] font-semibold leading-tight sm:mt-3 sm:text-xs ${
                            visual === "pending"
                              ? "text-slate-400"
                              : "text-slate-800"
                          }`}
                        >
                          {title}
                        </p>
                        <p className="mt-0.5 hidden text-center text-[10px] text-slate-500 sm:block">
                          {subtitle}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </section>

            {/* Info cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-900/5 sm:rounded-2xl sm:p-4 md:p-5">
                <div className="mb-3 flex items-center gap-2 text-slate-800 sm:mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-organic/10 text-organic sm:h-9 sm:w-9 sm:rounded-xl">
                    <Truck
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </div>
                  <span className="text-xs font-semibold sm:text-sm">
                    Giao hàng
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-1 sm:space-y-3 sm:gap-y-0">
                  <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      Trạng thái đơn
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-slate-800">
                      {orderStatusLabel(orderStatus)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      Vận chuyển
                    </dt>
                    <dd className="mt-1 text-sm text-slate-700">
                      {deliveryStatusLabel(delivery?.deliveryStatus)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-900/5 sm:rounded-2xl sm:p-4 md:p-5">
                <div className="mb-3 flex items-center gap-2 text-slate-800 sm:mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-organic/10 text-organic sm:h-9 sm:w-9 sm:rounded-xl">
                    <CreditCard
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </div>
                  <span className="text-xs font-semibold sm:text-sm">
                    Thanh toán
                  </span>
                </div>
                <dl className="space-y-2 sm:space-y-3">
                  <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      Phương thức
                    </dt>
                    <dd className="mt-1 text-sm font-medium capitalize text-slate-800">
                      {String(payment?.method || "—")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      Trạng thái
                    </dt>
                    <dd className="mt-1.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${paymentStatusClass(
                          payment?.status
                        )}`}
                      >
                        {String(payment?.status || "—")}
                      </span>
                    </dd>
                  </div>
                  <div className="flex items-end justify-between gap-2 border-t border-slate-100 pt-2 sm:pt-3">
                    <div>
                      <dt className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        Tổng thanh toán
                      </dt>
                      <dd className="mt-0.5 flex items-center gap-1.5 text-base font-bold text-organic sm:mt-1 sm:text-lg">
                        <Banknote
                          className="h-4 w-4 shrink-0 opacity-80"
                          aria-hidden
                        />
                        {formatPrice(payment?.amount)}
                      </dd>
                    </div>
                  </div>
                </dl>
              </div>
            </div>

            {/* Cancel */}
            {canCancelOrder && (
              <section className="overflow-hidden rounded-xl border border-rose-200/60 bg-linear-to-br from-rose-50/80 via-white to-white sm:rounded-2xl">
                <div className="border-b border-rose-100/80 bg-rose-50/50 px-3.5 py-3 sm:px-5 sm:py-4">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 sm:h-9 sm:w-9 sm:rounded-xl">
                      <AlertCircle
                        className="h-4 w-4"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-rose-900">
                        Hủy đơn hàng
                      </h3>
                      <p className="mt-0.5 text-[11px] leading-snug text-rose-700/85 sm:mt-1 sm:text-xs sm:leading-relaxed">
                        Chỉ áp dụng khi đơn đang xử lý và shipper chưa giao.
                        Không thể hoàn tác.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 px-3.5 py-3 sm:space-y-4 sm:px-5 sm:py-4">
                  <div>
                    <label
                      htmlFor="cancel-reason"
                      className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-[11px]"
                    >
                      Lý do hủy
                    </label>
                    <textarea
                      id="cancel-reason"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={2}
                      placeholder="Lý do hủy đơn..."
                      className="mt-1.5 w-full resize-none rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner shadow-slate-900/5 outline-none transition placeholder:text-slate-400 focus:border-organic/50 focus:ring-2 focus:ring-organic/20 sm:mt-2 sm:rounded-xl sm:px-4 sm:py-2.5"
                    />
                  </div>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => handleOpenChange(false)}
                      disabled={cancelLoading}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:rounded-xl sm:px-5 sm:py-2.5"
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      disabled={
                        cancelLoading || !cancelReason.trim() || !orderId
                      }
                      onClick={() => void handleCancelOrder()}
                      className="rounded-lg bg-linear-to-r from-rose-600 to-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:from-rose-700 hover:to-rose-600 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-xl sm:px-5 sm:py-2.5"
                    >
                      {cancelLoading ? "Đang hủy..." : "Xác nhận hủy"}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserOrderStatusModal;
