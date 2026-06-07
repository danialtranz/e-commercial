"use client";

import {
  useAddProductToCart,
  useGetUserProductDetail,
} from "@/hooks/user/useUserHook";
import type { ShopProduct } from "@/interface/shop";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { FlashSaleHotPanel, FlashSalePriceDisplay } from "./FlashSaleHot";
import ProductCommentComp from "./ProductCommentComp";

const ProductDetailView: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const productId = typeof id === "string" ? id : "";

  const { product: productDetail, loading: loadingDetail } =
    useGetUserProductDetail({ product_id: productId });
  const { addToCart, loading: addingToCart } = useAddProductToCart();

  const handleAddToCart = async (p: ShopProduct) => {
    if (!p.stock || p.stock <= 0) {
      return;
    }

    await addToCart({ productId: p.id, quantity: 1 });
  };

  if (!productId) {
    return null;
  }

  if (loadingDetail) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <i className="fas fa-spinner fa-spin mr-2" /> Đang tải…
      </div>
    );
  }

  if (!productDetail) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-slate-600">Không tìm thấy sản phẩm.</p>
        <Link
          href="/shop"
          className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:underline"
        >
          ← Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  const flashSale = productDetail.flash_sale_campaign;
  const hasFlashSale = Boolean(flashSale && flashSale.status === "active");

  return (
    <div className="min-h-screen bg-linear-to-b from-emerald-50/30 to-white pb-16">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <Link
          href="/shop"
          className="text-xs font-medium text-emerald-700 hover:underline"
        >
          ← Cửa hàng
        </Link>

        <div className="mt-6 grid gap-10 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {productDetail.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={productDetail.image}
                alt={productDetail.name || ""}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-slate-100 text-6xl text-slate-300">
                <i className="fas fa-image" />
              </div>
            )}
          </div>

          <div>
            {hasFlashSale && flashSale && (
              <div className="mb-4">
                <FlashSaleHotPanel flashSale={flashSale} />
              </div>
            )}
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              {productDetail.name}
            </h1>
            <FlashSalePriceDisplay
              originalPrice={productDetail.price}
              flashSale={hasFlashSale ? flashSale : null}
            />
            <p className="mt-2 text-sm text-slate-600">
              Tồn kho:{" "}
              <span className="font-medium text-slate-900">
                {productDetail.stock ?? "—"}
              </span>
            </p>
            <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm leading-relaxed text-slate-700">
              {productDetail.description || "Chưa có mô tả chi tiết."}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={(productDetail.stock ?? 0) <= 0 || addingToCart}
                onClick={() => void handleAddToCart(productDetail)}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addingToCart ? (
                  <i className="fas fa-spinner fa-spin" aria-hidden />
                ) : (
                  <i className="fas fa-cart-plus" aria-hidden />
                )}
                Thêm vào giỏ
              </button>
            </div>
          </div>
        </div>

        <ProductCommentComp productId={productId} />
      </div>
    </div>
  );
};

export default ProductDetailView;
