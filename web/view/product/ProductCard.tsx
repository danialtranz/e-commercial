"use client";

import React, { useRef, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { Crown, ShoppingCart, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserProduct } from "@/interface/shop";
import { useRouter } from "next/router";
import { useAddProductToCart } from "@/hooks/user/useUserHook";
import {
  useGetUserProductDetail,
  useUploadShopownerProductImage,
} from "@/hooks/user/useUserHook";
import { useDeleteShopownerProduct } from "@/hooks/shopowner/useShopOwnerHook";
import { FlashSaleHotBadge, FlashSaleHotPanel } from "./FlashSaleHot";
import { ManagerStockModal } from "./ManagerStockModal";

function readShopIdFromStorage(): string | null {
  const id = localStorage.getItem("shopId");
  return id?.trim() || "";
}

function subscribeShopIdStorage(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function getShopIdSnapshot(): string | null {
  return readShopIdFromStorage();
}

function formatPrice(v: number | null | undefined) {
  if (v == null) return "—";
  return `${v.toLocaleString("vi-VN")} ₫`;
}

function getBestsellerLabel(product: UserProduct): string | null {
  const label = product.bestseller_label;
  if (typeof label === "string" && label.trim()) return label.trim();
  const sold = product.sold_quantity;
  if (typeof sold === "number" && sold > 0) {
    return `Bán chạy · đã bán ${sold}`;
  }
  return null;
}

function BestsellerBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex max-w-full items-center justify-center gap-1 rounded-full bg-linear-to-r from-orange-500 to-amber-500 px-2.5 py-1 text-[10px] font-bold leading-tight text-white shadow-sm">
      <TrendingUp size={12} className="shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );
}

export const ProductCard: React.FC<{
  product: UserProduct;
  /** Chủ shop (đúng shop đang xem): hiện nút xóa */
  canDeleteProduct?: boolean;
  /** Shopowner đúng shop: hiện nút quản lý tồn kho */
  canManageStock?: boolean;
  /** Chọn sản phẩm (vd. flash sale): click = chọn, không bật chi tiết */
  pickerMode?: boolean;
  selected?: boolean;
  onPickProduct?: (product: UserProduct) => void;
  /** true: mở trang `/product/[id]` thay vì mở khối chi tiết ngay trên card */
  navigateToDetailPage?: boolean;
  /** Giao diện compact kiểu Organicmart (danh sách /product) */
  catalogLayout?: boolean;
  /** SP đứng đầu khi sort bán chạy (trang 1) */
  isTopBestseller?: boolean;
}> = ({
  product,
  canDeleteProduct = false,
  canManageStock = false,
  pickerMode = false,
  selected = false,
  onPickProduct,
  navigateToDetailPage = false,
  catalogLayout = false,
  isTopBestseller = false,
}) => {
  const router = useRouter();
  const [showDetail, setShowDetail] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [role] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("role") : null
  );
  const [imageOverride, setImageOverride] = useState<{
    productId: string;
    url: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shopId = useSyncExternalStore(
    subscribeShopIdStorage,
    getShopIdSnapshot,
    () => null
  );

  const { product: productDetail, loading: loadingDetail } =
    useGetUserProductDetail(
      showDetail ? { product_id: product.id } : undefined
    );
  const { addToCart, loading: addingToCart } = useAddProductToCart();
  const { uploadProductImage, loading: uploadingImage } =
    useUploadShopownerProductImage();
  const { deleteProduct, loading: deletingProduct } =
    useDeleteShopownerProduct();

  const detail = productDetail || product;
  const flashSale = detail.flash_sale_campaign;
  const hasFlashSale = Boolean(flashSale && flashSale.status === "active");
  const bestsellerLabel =
    getBestsellerLabel(product) || getBestsellerLabel(detail);
  const displayImage =
    imageOverride?.productId === product.id ? imageOverride.url : detail.image;
  const showDelete =
    canDeleteProduct && Boolean(shopId) && product.shopId === shopId;
  const showStockEdit =
    !pickerMode &&
    role === "shopowner" &&
    canManageStock &&
    Boolean(shopId) &&
    product.shopId === shopId;
  const canUploadProductImage =
    !pickerMode &&
    role === "shopowner" &&
    Boolean(shopId) &&
    product.shopId === shopId;

  const handleCardActivate = (event?: React.MouseEvent<HTMLDivElement>) => {
    const target = event?.target;
    if (target instanceof HTMLElement) {
      const blocked = target.closest('[data-prevent-card-open="true"]');
      if (blocked) return;
    }

    if (pickerMode) {
      onPickProduct?.(product);
      return;
    }
    if (navigateToDetailPage) {
      void router.push(`/product/${encodeURIComponent(product.id)}`);
      return;
    }
    setShowDetail((prev) => !prev);
  };

  const stockModal =
    showStockEdit && shopId ? (
      <ManagerStockModal
        key={`${detail.id}-${stockModalOpen ? "open" : "closed"}`}
        open={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        shopId={shopId}
        productId={detail.id}
        productName={detail.name}
      />
    ) : null;

  if (catalogLayout && !pickerMode) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onClick={(e) => handleCardActivate(e)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCardActivate();
            }
          }}
          role="button"
          tabIndex={0}
          className={cn(
            "group relative flex cursor-pointer flex-col items-center overflow-hidden rounded border bg-white p-4 pt-8 text-center transition-all duration-300",
            isTopBestseller
              ? "z-10 scale-[1.03] border-2 border-orange-400 bg-linear-to-b from-orange-50 via-white to-white shadow-xl ring-2 ring-orange-300/70 hover:shadow-2xl"
              : "border-gray-200 hover:shadow-xl"
          )}
        >
          {isTopBestseller ? (
            <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-center gap-1.5 bg-linear-to-r from-orange-500 via-amber-500 to-orange-500 py-1.5 text-[11px] font-bold tracking-wide text-white shadow-sm">
              <Crown className="size-3.5 shrink-0 fill-white" aria-hidden />
              Bán chạy nhất
            </div>
          ) : null}

          {detail.category?.name && (
            <div
              className={cn(
                "absolute left-2 z-10 rounded bg-organic/10 px-2 py-0.5 text-[10px] font-bold text-organic uppercase",
                isTopBestseller ? "top-9" : "top-2"
              )}
            >
              {detail.category.name}
            </div>
          )}

          {(showStockEdit || showDelete) && (
            <div
              className={cn(
                "absolute right-2 z-20 flex gap-1",
                isTopBestseller ? "top-9" : "top-2"
              )}
              data-prevent-card-open="true"
            >
              {showStockEdit && (
                <button
                  type="button"
                  title="Sửa tồn kho"
                  aria-label="Sửa tồn kho"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white shadow-md hover:bg-amber-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStockModalOpen(true);
                  }}
                >
                  <i className="fas fa-pen text-[10px]" aria-hidden />
                </button>
              )}
              {showDelete && (
                <button
                  type="button"
                  title="Xóa sản phẩm"
                  aria-label="Xóa sản phẩm"
                  disabled={deletingProduct}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 disabled:opacity-60"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      !window.confirm(
                        "Xóa sản phẩm này? Hành động không thể hoàn tác."
                      )
                    ) {
                      return;
                    }
                    void deleteProduct({
                      shopId: shopId!,
                      productId: detail.id,
                    });
                  }}
                >
                  {deletingProduct ? (
                    <i
                      className="fas fa-spinner fa-spin text-[10px]"
                      aria-hidden
                    />
                  ) : (
                    <i className="fas fa-times text-xs" aria-hidden />
                  )}
                </button>
              )}
            </div>
          )}

          {typeof detail.stock === "number" && detail.stock <= 0 && (
            <span
              className={cn(
                "absolute right-2 z-10 rounded bg-slate-800/80 px-1.5 py-0.5 text-[9px] font-semibold text-white",
                isTopBestseller ? "top-9" : "top-2"
              )}
            >
              Hết hàng
            </span>
          )}

          <div className="relative mb-4 aspect-square w-full overflow-hidden">
            {displayImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayImage}
                alt={detail.name || ""}
                className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl text-slate-300">
                <i className="fas fa-image" />
              </div>
            )}
            {canUploadProductImage && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  data-prevent-card-open="true"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file || !shopId) return;
                    void (async () => {
                      const result = await uploadProductImage({
                        shopId,
                        productId: detail.id,
                        file,
                      });
                      if (result.ok && result.product?.image) {
                        setImageOverride({
                          productId: detail.id,
                          url: result.product.image,
                        });
                      }
                    })();
                  }}
                />
                <button
                  type="button"
                  disabled={uploadingImage}
                  data-prevent-card-open="true"
                  title="Đổi ảnh sản phẩm"
                  aria-label="Tải ảnh sản phẩm lên"
                  className="absolute right-1 bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/75 text-white opacity-0 transition group-hover:opacity-100 hover:bg-slate-900 disabled:opacity-60"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  {uploadingImage ? (
                    <i
                      className="fas fa-spinner fa-spin text-[10px]"
                      aria-hidden
                    />
                  ) : (
                    <i className="fas fa-camera text-[10px]" aria-hidden />
                  )}
                </button>
              </>
            )}
          </div>

          <h3 className="mb-2 flex min-h-[44px] items-center justify-center text-[15px] font-medium text-gray-800 transition-colors group-hover:text-organic">
            {detail.name}
          </h3>

          {bestsellerLabel ? (
            <div className="mb-2 flex w-full justify-center px-1">
              {isTopBestseller ? (
                <span className="inline-flex max-w-full items-center justify-center gap-1.5 rounded-full bg-linear-to-r from-orange-600 to-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-md">
                  <TrendingUp size={14} className="shrink-0" aria-hidden />
                  <span className="truncate">{bestsellerLabel}</span>
                </span>
              ) : (
                <BestsellerBadge label={bestsellerLabel} />
              )}
            </div>
          ) : null}

          <p className="text-lg font-bold text-organic">
            {formatPrice(detail.price)}
          </p>

          {hasFlashSale && flashSale && (
            <div className="mt-2 w-full">
              <FlashSaleHotBadge flashSale={flashSale} compact />
            </div>
          )}

          <div className="mt-4 w-full translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              type="button"
              data-prevent-card-open="true"
              disabled={(detail.stock ?? 0) <= 0 || addingToCart}
              onClick={(e) => {
                e.stopPropagation();
                void addToCart({ productId: detail.id, quantity: 1 });
              }}
              className="flex w-full items-center justify-center gap-2 rounded bg-organic px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-organic-dark disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {addingToCart ? (
                <i className="fas fa-spinner fa-spin" aria-hidden />
              ) : (
                <ShoppingCart size={14} />
              )}
              THÊM VÀO GIỎ
            </button>
          </div>

          <div className="h-8 transition-all group-hover:hidden" />
        </motion.div>
        {stockModal}
      </>
    );
  }

  return (
    <>
      <div
        onClick={(e) => handleCardActivate(e)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardActivate();
          }
        }}
        role="button"
        tabIndex={0}
        className={`flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:border-emerald-300/80 hover:shadow-lg hover:shadow-emerald-500/10 ${
          pickerMode && selected
            ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-50"
            : ""
        }`}
      >
        <div className="relative aspect-4/3 w-full bg-linear-to-br from-slate-100 to-emerald-50">
          {displayImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayImage}
              alt={detail.name || ""}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl text-slate-300">
              <i className="fas fa-image" />
            </div>
          )}
          {(showStockEdit || showDelete) && (
            <div className="absolute right-2 top-2 z-10 flex flex-col gap-2">
              {showStockEdit && (
                <button
                  type="button"
                  title="Sửa tồn kho"
                  aria-label="Sửa tồn kho"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/95 text-white shadow-md backdrop-blur-sm transition hover:bg-amber-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStockModalOpen(true);
                  }}
                >
                  <i className="fas fa-pen text-xs" aria-hidden />
                </button>
              )}
              {showDelete && (
                <button
                  type="button"
                  title="Xóa sản phẩm"
                  aria-label="Xóa sản phẩm"
                  disabled={deletingProduct}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600/90 text-white shadow-md backdrop-blur-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      !window.confirm(
                        "Xóa sản phẩm này? Hành động không thể hoàn tác."
                      )
                    ) {
                      return;
                    }
                    void deleteProduct({
                      shopId: shopId!,
                      productId: detail.id,
                    });
                  }}
                >
                  {deletingProduct ? (
                    <i className="fas fa-spinner fa-spin text-xs" aria-hidden />
                  ) : (
                    <i className="fas fa-times text-sm" aria-hidden />
                  )}
                </button>
              )}
            </div>
          )}
          {pickerMode && selected && (
            <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
              Đã chọn
            </span>
          )}
          {!pickerMode &&
            typeof detail.stock === "number" &&
            detail.stock <= 0 && (
              <span className="absolute left-2 top-10 z-10 rounded-full bg-slate-800/90 px-3 py-1 text-xs font-bold text-white shadow-md">
                Hết hàng
              </span>
            )}
          {canUploadProductImage && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                data-prevent-card-open="true"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file || !shopId) return;
                  void (async () => {
                    const result = await uploadProductImage({
                      shopId,
                      productId: detail.id,
                      file,
                    });
                    if (result.ok && result.product?.image) {
                      setImageOverride({
                        productId: detail.id,
                        url: result.product.image,
                      });
                    }
                  })();
                }}
              />
            </>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
              {detail.name}
            </h3>
          </div>

          <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">
            {detail.description || "—"}
          </p>

          {bestsellerLabel ? (
            <div className="mt-2">
              <BestsellerBadge label={bestsellerLabel} />
            </div>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-base font-bold text-emerald-600">
              {formatPrice(detail.price)}
            </span>
            <div className="flex items-center gap-2">
              {!pickerMode && (
                <button
                  type="button"
                  aria-label="Thêm vào giỏ hàng"
                  disabled={(detail.stock ?? 0) <= 0 || addingToCart}
                  onClick={(e) => {
                    e.stopPropagation();
                    void addToCart({ productId: detail.id, quantity: 1 });
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {addingToCart ? (
                    <i className="fas fa-spinner fa-spin text-xs" aria-hidden />
                  ) : (
                    "+"
                  )}
                </button>
              )}
            </div>
          </div>

          {hasFlashSale && flashSale && (
            <div className="mt-3 w-full">
              <FlashSaleHotPanel flashSale={flashSale} />
            </div>
          )}

          {detail.category?.name && (
            <div className="mt-2 text-[10px] text-slate-400">
              Danh mục: {detail.category.name}
            </div>
          )}

          {!pickerMode && (
            <div className="mt-3 text-[10px] font-medium text-emerald-600">
              {showDetail ? "Ẩn chi tiết" : "Nhấn để xem chi tiết"}
            </div>
          )}

          {!pickerMode && showDetail && (
            <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 p-2 text-[11px] text-slate-600">
              {loadingDetail ? (
                <div>
                  <i className="fas fa-spinner fa-spin mr-1" />
                  Đang tải chi tiết sản phẩm...
                </div>
              ) : (
                <>
                  <div>Product Name : {detail.name}</div>
                  <div>Product description: {detail.description}</div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {stockModal}
    </>
  );
};
