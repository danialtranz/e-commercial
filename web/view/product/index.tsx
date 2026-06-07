"use client";

import React, {
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import ProductSidebar from "@/components/product-catalog/ProductSidebar";
import ProductBanner from "@/components/product-catalog/ProductBanner";
import SectionTitle from "@/components/product-catalog/SectionTitle";
import { ProductList } from "./ProductList";
import { ShopChatWidget } from "./ShopChatWidget";
import ProductDetailView from "./ProductDetailView";

export { ProductCard } from "./ProductCard";
export { ProductList } from "./ProductList";
export { ShopChatWidget } from "./ShopChatWidget";
export { default as ProductDetailView } from "./ProductDetailView";

function readShopIdFromStorage(): string {
  if (typeof window === "undefined") return "";
  const id = localStorage.getItem("shopId");
  return id?.trim() || "";
}

function subscribeShopIdStorage(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function getShopIdSnapshot(): string {
  return readShopIdFromStorage();
}

type ProductCatalogViewProps = {
  /** Từ `/product/[id]` — khi có giá trị thì hiển thị chi tiết (ProductCard điều hướng tới đây). */
  productId?: string;
};

const ProductCatalogView: React.FC<ProductCatalogViewProps> = ({
  productId: productIdProp = "",
}) => {
  const productId = productIdProp.trim();
  const shopId = useSyncExternalStore(
    subscribeShopIdStorage,
    getShopIdSnapshot,
    () => ""
  );

  const [chatOpen, setChatOpen] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState<
    string | null
  >(null);
  const productsSectionRef = useRef<HTMLElement>(null);

  const handleSelectCategory = useCallback((name: string | null) => {
    setSelectedCategoryName(name);
    requestAnimationFrame(() => {
      productsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  if (productId) {
    return (
      <>
        <ProductDetailView />
        {shopId ? (
          <ShopChatWidget
            shopId={shopId}
            isOpen={chatOpen}
            onOpenChange={setChatOpen}
          />
        ) : null}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-emerald-50/30 to-white pb-24">
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="mb-8 flex gap-8">
          <ProductSidebar
            selectedCategoryName={selectedCategoryName}
            onSelectCategory={handleSelectCategory}
          />
          <ProductBanner />
        </div>

        {!shopId ? (
          <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/80 px-6 py-12 text-center text-slate-700">
            <p className="font-medium text-slate-800">Chưa chọn cửa hàng</p>
            <p className="mt-2 text-sm text-slate-600">
              Hãy đăng nhập hoặc chọn cửa hàng để hiển thị sản phẩm (shop được
              lưu trong trình duyệt).
            </p>
          </div>
        ) : (
          <section
            ref={productsSectionRef}
            id="product-list"
            className="mb-20 scroll-mt-24"
          >
            <SectionTitle title="Sản phẩm nổi bật" />
            <ProductList
              key={selectedCategoryName ?? "__all__"}
              shopId={shopId}
              selectedCategoryName={selectedCategoryName}
              onClearCategory={() => setSelectedCategoryName(null)}
            />
          </section>
        )}
      </div>

      {shopId ? (
        <ShopChatWidget
          shopId={shopId}
          isOpen={chatOpen}
          onOpenChange={setChatOpen}
        />
      ) : null}
    </div>
  );
};

export default ProductCatalogView;
