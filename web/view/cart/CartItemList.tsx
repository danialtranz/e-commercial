"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import type { IUserCartOrderItem } from "@/services/user/orderService";
import { cartItemLineTotal } from "@/services/user/orderService";
import {
  useCheckout,
  useCreateOrder,
  useListMyVoucher,
} from "@/hooks/user/useUserHook";
import CartCheckoutModal, { type CheckoutStep } from "./CartCheckoutModal";
import CartItemCard from "./CartItemCard";
import { toast } from "sonner";
import type { ICheckoutResultData } from "@/services/user/paymentService";
import {
  Loader2,
  Package,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Wallet,
} from "lucide-react";

function parseCheckoutResult(res: {
  code?: number;
  msg?: string;
  data?: unknown;
}): { ok: boolean; data: ICheckoutResultData | null; msg: string } {
  const isOk = res.code === 0 || res.code === 200;
  const msg =
    typeof res.msg === "string" && res.msg.trim() ? res.msg.trim() : "";
  if (!isOk) return { ok: false, data: null, msg };
  const data = res.data;
  if (!data || typeof data !== "object") {
    return {
      ok: false,
      data: null,
      msg: msg || "Không nhận được dữ liệu thanh toán.",
    };
  }
  return { ok: true, data: data as ICheckoutResultData, msg };
}

interface Props {
  items: IUserCartOrderItem[];
  onOrderComplete?: () => void;
}

const CartItemList: React.FC<Props> = ({ items, onOrderComplete }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("select");
  const [qrOrderId, setQrOrderId] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [deliveryTarget, setDeliveryTarget] = useState<"I3" | "I4" | "I5">(
    "I3"
  );
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(
    null
  );
  const [checkoutResult, setCheckoutResult] =
    useState<ICheckoutResultData | null>(null);

  const pendingPayloadRef = useRef<{ productId: string; quantity: number }[]>(
    []
  );
  /** Chỉ refetch giỏ khi user đóng modal (tránh unmount modal khi giỏ trống). */
  const refetchCartAfterCloseRef = useRef(false);

  const { createOrder, loading: createLoading } = useCreateOrder();
  const { checkout } = useCheckout();
  const { vouchers } = useListMyVoucher({ page: 1, page_size: 10 });

  const voucherOptions = useMemo(() => {
    return vouchers
      .map((row) => {
        const voucher = row.voucher;
        const id = typeof voucher?.id === "string" ? voucher.id : row.voucherId;
        const name =
          typeof voucher?.name === "string" && voucher.name.trim()
            ? voucher.name
            : "Voucher";
        const discount =
          typeof voucher?.discount === "number" ? voucher.discount : 0;
        if (!id) return null;
        return { id, name, discount };
      })
      .filter(
        (row): row is { id: string; name: string; discount: number } => !!row
      );
  }, [vouchers]);

  const toggleSelect = useCallback((lineId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(lineId);
      else next.delete(lineId);
      return next;
    });
  }, []);

  const selectedTotal = useMemo(() => {
    return items
      .filter((i) => selectedIds.has(i.id))
      .reduce((sum, i) => sum + cartItemLineTotal(i), 0);
  }, [items, selectedIds]);

  const hasSelection = selectedIds.size > 0;
  const payBusy = modalOpen && (createLoading || checkoutLoading);

  const formatCurrency = (v: number) => `${v.toLocaleString("vi-VN")} ₫`;

  const handleOpenPaymentModal = () => {
    const payload = items
      .filter((i) => selectedIds.has(i.id))
      .map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));
    if (!payload.length) return;

    pendingPayloadRef.current = payload;
    setQrOrderId(null);
    setCheckoutResult(null);
    setDeliveryTarget("I3");
    setSelectedVoucherId(null);
    setCheckoutStep("select");
    setModalOpen(true);
  };

  const handleConfirmPaymentMethod = async (method: "COD" | "MOMO") => {
    const payload = pendingPayloadRef.current;
    if (!payload.length) return;

    setCheckoutStep("creating");

    try {
      const res = (await createOrder({ items: payload })) as {
        code?: number;
        msg?: string;
        data?: { order?: { id?: string } } | null;
      };

      const isOk = res.code === 0 || res.code === 200;
      const serverMsg =
        typeof res.msg === "string" && res.msg.trim() ? res.msg.trim() : "";

      if (!isOk) {
        toast.error(serverMsg || "Không tạo được đơn hàng.");
        setCheckoutStep("select");
        return;
      }

      const orderId = res.data?.order?.id;
      if (!orderId) {
        toast.error(serverMsg || "Không nhận được mã đơn hàng từ máy chủ.");
        setCheckoutStep("select");
        return;
      }

      setQrOrderId(orderId);

      const runCheckout = async (payMethod: "COD" | "MOMO") => {
        const checkoutRes = await checkout({
          orderId,
          method: payMethod,
          payment: {
            payment_method: payMethod,
            status: "DONE",
          },
          delivery_target: deliveryTarget,
          voucher_id: selectedVoucherId,
        });
        const parsed = parseCheckoutResult(
          checkoutRes as { code?: number; msg?: string; data?: unknown }
        );
        if (!parsed.ok) {
          toast.error(parsed.msg || "Thanh toán thất bại.");
          setCheckoutStep("select");
          setCheckoutResult(null);
          return false;
        }
        setCheckoutResult(parsed.data);
        refetchCartAfterCloseRef.current = true;
        setCheckoutStep(payMethod === "COD" ? "cod-done" : "momo-done");
        return true;
      };

      if (method === "MOMO") {
        setCheckoutStep("momo-qr");
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        });
        setCheckoutLoading(true);
        try {
          await runCheckout("MOMO");
        } finally {
          setCheckoutLoading(false);
        }
      } else {
        setCheckoutLoading(true);
        try {
          await runCheckout("COD");
        } finally {
          setCheckoutLoading(false);
        }
      }
    } catch (err: unknown) {
      const axiosMsg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "msg" in err.response.data &&
        typeof (err.response.data as { msg?: string }).msg === "string"
          ? (err.response.data as { msg: string }).msg.trim()
          : "";
      toast.error(axiosMsg || "Không tạo được đơn hàng. Vui lòng thử lại.");
      setCheckoutStep("select");
      setQrOrderId(null);
    }
  };

  const handleCloseModal = () => {
    if (refetchCartAfterCloseRef.current) {
      refetchCartAfterCloseRef.current = false;
      setSelectedIds(new Set());
      onOrderComplete?.();
    }
    setModalOpen(false);
    setCheckoutStep("select");
    setQrOrderId(null);
    setCheckoutResult(null);
    setCheckoutLoading(false);
    setDeliveryTarget("I3");
    setSelectedVoucherId(null);
  };

  if (!items.length && !modalOpen) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white px-8 py-14 text-center shadow-sm">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-organic/10 text-organic">
          <ShoppingCart size={32} strokeWidth={1.75} aria-hidden />
        </div>
        <p className="text-lg font-bold text-gray-800">
          Chưa có sản phẩm trong giỏ
        </p>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          Hãy quay lại shop và thêm sản phẩm vào cart.
        </p>
      </div>
    );
  }

  return (
    <>
      {items.length > 0 ? (
        <section className={hasSelection ? "pb-32" : undefined}>
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-organic/15 bg-linear-to-r from-organic/5 via-white to-white px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-organic/10 text-organic">
                <ShoppingBag size={22} strokeWidth={2} aria-hidden />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Danh sách item trong giỏ
                </h3>
                <p className="text-xs text-gray-500">
                  Chọn sản phẩm cần thanh toán
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-organic/10 px-3 py-1.5 text-xs font-bold text-organic">
              <Package className="size-3.5" aria-hidden />
              {items.length} item
            </span>
          </header>

          <div className="space-y-5">
            {items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                selected={selectedIds.has(item.id)}
                onSelectChange={(checked) => toggleSelect(item.id, checked)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {hasSelection && items.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-50 mx-auto max-w-[520px] sm:left-auto sm:right-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-organic/20 bg-white/95 p-4 shadow-xl backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                <Receipt className="size-3.5 text-organic" aria-hidden />
                Tạm tính ({selectedIds.size} dòng)
              </p>
              <p className="text-xl font-bold text-organic">
                {formatCurrency(selectedTotal)}
              </p>
            </div>
            <button
              type="button"
              disabled={payBusy}
              onClick={handleOpenPaymentModal}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-organic px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-organic-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {payBusy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Wallet className="size-4" aria-hidden />
                  Thanh toán
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <CartCheckoutModal
        open={modalOpen}
        step={checkoutStep}
        orderId={qrOrderId}
        checkoutResult={checkoutResult}
        checkoutLoading={checkoutLoading}
        deliveryTarget={deliveryTarget}
        onDeliveryTargetChange={setDeliveryTarget}
        vouchers={voucherOptions}
        selectedVoucherId={selectedVoucherId}
        onVoucherChange={setSelectedVoucherId}
        onClose={handleCloseModal}
        onConfirmPaymentMethod={(m) => void handleConfirmPaymentMethod(m)}
      />
    </>
  );
};

export default CartItemList;
