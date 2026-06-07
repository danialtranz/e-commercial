"use client";

import React, { useState } from "react";
import type { IUserCartOrderItem } from "@/services/user/orderService";
import { formatPrice } from "@/lib/utils";
import {
  CalendarClock,
  CalendarPlus,
  FileText,
  FolderOpen,
  Hash,
  ImageIcon,
  Minus,
  Package,
  Plus,
  Receipt,
  Tag,
  Trash2,
  Type,
  Zap,
} from "lucide-react";
import {
  useRemoveProductFromCart,
  useUpdateCartProductQuantity,
} from "@/hooks/user/useUserHook";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MetaChip, MetaLabel } from "./cartMeta";
import {
  computeDiscountedPrice,
  FlashSaleHotPanel,
  formatPrice as formatFlashPrice,
  isFlashSaleLive,
  useFlashSaleCountdown,
  type FlashSaleCampaign,
} from "@/view/product/FlashSaleHot";

const formatCurrency = (v: number | null | undefined) => {
  if (typeof v !== "number") return "—";
  return `${v.toLocaleString("vi-VN")} ₫`;
};

const toImageSrc = (raw: string | null | undefined) => {
  if (!raw || !raw.trim()) return "";
  const value = raw.trim();
  if (value.startsWith("data:image/")) return value;
  return `data:image/png;base64,${value}`;
};

interface Props {
  item: IUserCartOrderItem;
  selected: boolean;
  onSelectChange: (checked: boolean) => void;
}

const CartItemCard: React.FC<Props> = ({ item, selected, onSelectChange }) => {
  const { updateQuantity } = useUpdateCartProductQuantity();
  const { removeFromCart } = useRemoveProductFromCart();
  const [quantityBusy, setQuantityBusy] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [removeBusy, setRemoveBusy] = useState(false);
  const p = item.product;
  const productId = item.productId?.trim() ?? "";
  const flashSale = item.flash_sale as FlashSaleCampaign | null;
  const { expired } = useFlashSaleCountdown(flashSale?.expiredIn);
  const liveFlashSale = isFlashSaleLive(flashSale, expired);

  const unitPrice =
    typeof item.price === "number"
      ? item.price
      : typeof p?.price === "number"
        ? p.price
        : null;

  const saleUnitPrice =
    liveFlashSale && unitPrice != null
      ? computeDiscountedPrice(unitPrice, flashSale?.discount)
      : null;

  const priceLabel =
    liveFlashSale && saleUnitPrice != null && unitPrice != null ? (
      <span className="inline-flex flex-wrap items-center gap-2">
        <span className="text-gray-400 line-through decoration-red-500 decoration-2">
          {formatCurrency(unitPrice)}
        </span>
        <span className="font-bold text-red-600">
          {formatCurrency(saleUnitPrice)}
        </span>
        {flashSale?.discount != null ? (
          <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
            -{flashSale.discount}%
          </span>
        ) : null}
      </span>
    ) : (
      formatCurrency(item.price)
    );

  const handleQuantityChange = async (action: "increase" | "decrease") => {
    if (!productId || quantityBusy) return;
    setQuantityBusy(true);
    try {
      await updateQuantity({ action, productId });
    } finally {
      setQuantityBusy(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!productId || removeBusy) return;
    setRemoveBusy(true);
    try {
      const res = await removeFromCart({ productId });
      if (res?.code === 0 || res?.code === 200) {
        setConfirmRemoveOpen(false);
      }
    } finally {
      setRemoveBusy(false);
    }
  };

  const quantity = typeof item.quantity === "number" ? item.quantity : 0;
  const imageSrc = toImageSrc(p?.image);
  const effectiveUnit = saleUnitPrice ?? unitPrice;
  const lineTotal =
    typeof item.quantity === "number" && typeof effectiveUnit === "number"
      ? item.quantity * effectiveUnit
      : null;

  const productInfo = [
    { icon: FolderOpen, label: "Danh mục", value: p?.name || "—" },
    { icon: Type, label: "Tên", value: p?.name || "—" },
    { icon: FileText, label: "Mô tả", value: p?.description || "—" },
    {
      icon: Tag,
      label: "Giá",
      value:
        liveFlashSale && saleUnitPrice != null
          ? formatCurrency(saleUnitPrice)
          : formatCurrency(p?.price),
    },
    { icon: CalendarPlus, label: "Tạo lúc", value: p?.createdAt || "—" },
    { icon: CalendarClock, label: "Cập nhật", value: p?.updatedAt || "—" },
  ];

  return (
    <article
      className={`flex flex-col gap-5 rounded-2xl border bg-white p-5 shadow-sm transition-all md:p-6 ${
        selected
          ? "border-organic/40 ring-2 ring-organic/15"
          : "border-gray-100 hover:border-organic/20 hover:shadow-md"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => {
                e.stopPropagation();
                onSelectChange(e.target.checked);
              }}
              className="mt-2 size-4 shrink-0 rounded border-gray-300 text-organic focus:ring-organic"
            />
            <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-organic/5 sm:size-24">
              {imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc}
                  alt={p?.name || "product-image"}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-organic">
                  <Package size={32} aria-hidden />
                </div>
              )}
            </div>
          </label>

          <div className="min-w-0 flex-1">
            <h4 className="line-clamp-2 text-base font-bold text-gray-900 sm:text-lg">
              {p?.name || "Sản phẩm"}
            </h4>
            <p className="mt-0.5 text-xs text-gray-500">
              Mã dòng:{" "}
              <span className="font-mono text-gray-600">{item.id}</span>
            </p>

            {liveFlashSale && flashSale ? (
              <div className="mt-3">
                <FlashSaleHotPanel flashSale={flashSale} />
              </div>
            ) : null}

            {liveFlashSale &&
            saleUnitPrice != null &&
            unitPrice != null &&
            typeof item.quantity === "number" ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600">
                <Zap className="size-3.5 shrink-0" aria-hidden />
                Tiết kiệm{" "}
                {formatFlashPrice(
                  (unitPrice - saleUnitPrice) * item.quantity
                )}{" "}
                cho dòng này
              </p>
            ) : null}

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <MetaChip
                icon={Hash}
                label="Số lượng"
                className="sm:col-span-2 xl:col-span-1"
              >
                <span
                  className="inline-flex w-fit items-center overflow-hidden rounded-lg border-2 border-organic/30 bg-white shadow-sm"
                  role="group"
                  aria-label="Điều chỉnh số lượng"
                >
                  <button
                    type="button"
                    disabled={!productId || quantityBusy}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleQuantityChange("decrease");
                    }}
                    className="flex h-9 w-9 items-center justify-center bg-organic text-white transition-colors hover:bg-organic/90 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Giảm số lượng"
                  >
                    <Minus size={18} strokeWidth={2.5} aria-hidden />
                  </button>
                  <span className="min-w-10 px-3 text-center text-base font-bold tabular-nums text-gray-900">
                    {quantityBusy ? "…" : quantity}
                  </span>
                  <button
                    type="button"
                    disabled={!productId || quantityBusy}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleQuantityChange("increase");
                    }}
                    className="flex h-9 w-9 items-center justify-center bg-organic text-white transition-colors hover:bg-organic/90 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Tăng số lượng"
                  >
                    <Plus size={18} strokeWidth={2.5} aria-hidden />
                  </button>
                </span>
              </MetaChip>

              <MetaChip icon={Tag} label="Giá">
                {priceLabel}
              </MetaChip>

              <MetaChip icon={CalendarPlus} label="Tạo lúc">
                <span className="break-all text-xs sm:text-sm">
                  {item.createdAt || "—"}
                </span>
              </MetaChip>

              <MetaChip icon={CalendarClock} label="Cập nhật">
                <span className="break-all text-xs sm:text-sm">
                  {item.updatedAt || "—"}
                </span>
              </MetaChip>

              {lineTotal != null ? (
                <MetaChip
                  icon={Receipt}
                  label="Thành tiền"
                  className="border-organic/20 bg-organic/5 sm:col-span-2 xl:col-span-3"
                >
                  <span className="text-base font-bold text-organic">
                    {formatPrice(lineTotal)}
                  </span>
                </MetaChip>
              ) : null}
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={!productId || removeBusy}
          onClick={(e) => {
            e.stopPropagation();
            setConfirmRemoveOpen(true);
          }}
          className="flex size-11 shrink-0 items-center justify-center self-start rounded-full border-2 border-red-200 bg-red-50 text-red-600 shadow-sm transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 lg:self-center"
          aria-label="Xóa sản phẩm khỏi giỏ hàng"
        >
          <Trash2 size={22} strokeWidth={2} aria-hidden />
        </button>
      </div>

      <ConfirmDialog
        open={confirmRemoveOpen}
        onOpenChange={setConfirmRemoveOpen}
        title="Xóa sản phẩm khỏi giỏ?"
        description={
          p?.name
            ? `Bạn có chắc muốn xóa "${p.name}" khỏi giỏ hàng không?`
            : "Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng không?"
        }
        cancelText="Không"
        confirmText="Có"
        loading={removeBusy}
        onConfirm={handleConfirmRemove}
      />

      {liveFlashSale && flashSale ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/60 px-3 py-2.5 text-xs text-amber-900">
          <MetaLabel icon={Zap} label="Flash sale" className="text-amber-800" />
          <span className="text-amber-400" aria-hidden>
            ·
          </span>
          <span>
            Còn {flashSale.remainQuantity ?? 0} suất · hết hạn{" "}
            {flashSale.expiredIn
              ? new Date(flashSale.expiredIn).toLocaleString("vi-VN")
              : "—"}
          </span>
        </div>
      ) : null}

      <div className="border-t border-gray-100 pt-4">
        <p className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-gray-800">
          <Package className="size-4 text-organic" aria-hidden />
          Chi tiết sản phẩm
        </p>

        <div className="mb-3 rounded-xl border border-gray-100 bg-gray-50/90 px-3 py-2.5">
          <MetaLabel icon={ImageIcon} label="Ảnh" />
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt={p?.name || "product-image"}
              className="mt-2 h-24 w-24 rounded-lg border border-gray-200 object-cover"
            />
          ) : (
            <p className="mt-2 text-xs font-medium text-gray-800">—</p>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {productInfo.map((info) => (
            <MetaChip key={info.label} icon={info.icon} label={info.label}>
              <span className="break-all text-xs">{info.value}</span>
            </MetaChip>
          ))}
        </div>
      </div>
    </article>
  );
};

export default CartItemCard;
