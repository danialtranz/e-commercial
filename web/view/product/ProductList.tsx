"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  useGetUserProducts,
  useSortPublicProducts,
  type ProductSortStrategy,
} from "@/hooks/user/useUserHook";
import {
  useCreateShopownerProduct,
  useGetPublicCategories,
  useSearchPublicProducts,
} from "@/hooks/shopowner/useShopOwnerHook";
import { ProductCard } from "./ProductCard";

const USER_PAGE_SIZE_FALLBACK = 6;
const MIN_PAGE_SIZE = 6;
const MAX_PAGE_SIZE = 15;
/** Khi lọc theo danh mục — tải nhiều SP một lần rồi phân trang phía client */
const CATEGORY_FILTER_FETCH_SIZE = 100;

const PRODUCT_SORT_OPTIONS: {
  value: ProductSortStrategy;
  label: string;
}[] = [
  { value: "price-descend", label: "Giá cao → thấp" },
  { value: "price-ascend", label: "Giá thấp → cao" },
  { value: "best-seller", label: "Bán chạy" },
];

function normalizeCategoryName(name: string | null | undefined): string {
  return (name ?? "").trim().toLowerCase();
}

function productMatchesCategory(
  product: { category?: { name?: string | null } | null },
  categoryName: string
): boolean {
  return (
    normalizeCategoryName(product.category?.name) ===
    normalizeCategoryName(categoryName)
  );
}

function shopPageSizeStorageKey(shopId: string): string {
  return `productListPageSize:${shopId}`;
}

function clampPageSize(value: number): number {
  return Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, value));
}

function readStoredPageSize(shopId: string): number {
  if (typeof window === "undefined") return USER_PAGE_SIZE_FALLBACK;
  return USER_PAGE_SIZE_FALLBACK;
}

function persistPageSize(shopId: string, size: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    shopPageSizeStorageKey(shopId),
    String(clampPageSize(size))
  );
}

function readStoredShopId(): string | null {
  if (typeof window === "undefined") return null;
  const id =
    localStorage.getItem("shopId")?.trim() ||
    localStorage.getItem("shop_id")?.trim() ||
    localStorage.getItem("currentShopId")?.trim() ||
    "";
  return id || null;
}

/**
 * Lưới catalog: số cột cố định theo page size (không theo số SP thực tế),
 * để 1–2 kết quả search không bị phóng to full width.
 * Tối đa 2 hàng khi đủ sản phẩm: cols = ceil(pageSize / 2).
 */
function buildCatalogGridProps(pageSize: number): {
  className: string;
  style?: React.CSSProperties;
} {
  const cols = Math.max(1, Math.ceil(pageSize / 2));
  return {
    className:
      "grid w-full gap-4 sm:gap-6 [&>*]:min-w-0 [&>*]:w-full [&>*]:max-w-[280px] [&>*]:justify-self-start",
    style: {
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    },
  };
}

export type ProductListProps = {
  shopId: string;
  selectedCategoryName?: string | null;
  onClearCategory?: () => void;
};

export const ProductList: React.FC<ProductListProps> = ({
  shopId,
  selectedCategoryName = null,
  onClearCategory,
}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(USER_PAGE_SIZE_FALLBACK);
  const [viewerPageSize, setViewerPageSize] = useState(USER_PAGE_SIZE_FALLBACK);
  const [isShopOwner, setIsShopOwner] = useState(false);
  const [storedShopId, setStoredShopId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  /** Từ khóa đã gửi API — chỉ cập nhật khi bấm «Tìm kiếm» hoặc Enter */
  const [appliedSearchKeyword, setAppliedSearchKeyword] = useState("");
  /** Sắp xếp public API — null = danh sách mặc định */
  const [appliedSortStrategy, setAppliedSortStrategy] =
    useState<ProductSortStrategy | null>(null);

  const { createProduct, loading: creating } = useCreateShopownerProduct();

  function submitProductSearch() {
    setAppliedSearchKeyword(productSearchQuery.trim());
    setAppliedSortStrategy(null);
    setPage(1);
  }

  function handleSortStrategyChange(value: string) {
    if (
      value === "price-descend" ||
      value === "price-ascend" ||
      value === "best-seller"
    ) {
      setAppliedSortStrategy(value);
      setAppliedSearchKeyword("");
      setProductSearchQuery("");
      setPage(1);
      return;
    }
    setAppliedSortStrategy(null);
    setPage(1);
  }

  useEffect(() => {
    setIsShopOwner(localStorage.getItem("role") === "shopowner");
    setStoredShopId(readStoredShopId());
    const stored = readStoredPageSize(shopId);
    setPageSize(stored);
    setViewerPageSize(stored);
    setPage(1);
  }, [shopId]);

  const canManageThisShop = Boolean(
    isShopOwner && storedShopId && storedShopId === shopId
  );

  const effectivePageSize = isShopOwner ? pageSize : viewerPageSize;

  const searchKeyword = appliedSearchKeyword;
  const isSearchMode = searchKeyword.length > 0;
  const isSortMode = appliedSortStrategy != null;
  const isCategoryFilterMode = Boolean(selectedCategoryName?.trim());

  const listFetchPage = isCategoryFilterMode ? 1 : page;
  const listFetchPageSize = isCategoryFilterMode
    ? CATEGORY_FILTER_FETCH_SIZE
    : effectivePageSize;

  const sortFetchPage = isCategoryFilterMode ? 1 : page;
  const sortFetchPageSize = isCategoryFilterMode
    ? CATEGORY_FILTER_FETCH_SIZE
    : effectivePageSize;

  const {
    products: listProducts,
    pagination: listPagination,
    loading: listLoading,
  } = useGetUserProducts({
    shop_id: shopId,
    page: listFetchPage,
    page_size: listFetchPageSize,
  });

  const {
    products: searchProducts,
    pagination: searchPagination,
    loading: searchLoading,
  } = useSearchPublicProducts(
    isSearchMode
      ? {
          keyWord: searchKeyword,
          page,
          page_size: effectivePageSize,
        }
      : undefined
  );

  const {
    products: sortProducts,
    pagination: sortPagination,
    loading: sortLoading,
  } = useSortPublicProducts(
    isSortMode && appliedSortStrategy
      ? {
          shopId,
          sortStrategy: appliedSortStrategy,
          page: sortFetchPage,
          page_size: sortFetchPageSize,
        }
      : undefined
  );

  const baseProducts = useMemo(() => {
    if (isSearchMode) {
      return searchProducts.filter((p) => p.shopId === shopId);
    }
    if (isSortMode) return sortProducts;
    return listProducts;
  }, [
    isSearchMode,
    isSortMode,
    listProducts,
    searchProducts,
    sortProducts,
    shopId,
  ]);

  const categoryFilteredProducts = useMemo(() => {
    if (!isCategoryFilterMode || !selectedCategoryName) return baseProducts;
    return baseProducts.filter((p) =>
      productMatchesCategory(p, selectedCategoryName)
    );
  }, [baseProducts, isCategoryFilterMode, selectedCategoryName]);

  const displayProducts = useMemo(() => {
    if (!isCategoryFilterMode) return categoryFilteredProducts;
    const start = (page - 1) * effectivePageSize;
    return categoryFilteredProducts.slice(start, start + effectivePageSize);
  }, [categoryFilteredProducts, isCategoryFilterMode, page, effectivePageSize]);

  const pagination = isSearchMode
    ? searchPagination
    : isSortMode
      ? sortPagination
      : listPagination;
  const loading = isSearchMode
    ? searchLoading
    : isSortMode
      ? sortLoading
      : listLoading;

  const totalPages = useMemo(() => {
    if (isCategoryFilterMode) {
      const n = categoryFilteredProducts.length;
      return n > 0 ? Math.ceil(n / effectivePageSize) : 1;
    }
    const total = pagination?.total ?? 0;
    return total > 0 ? Math.ceil(total / effectivePageSize) : 1;
  }, [
    isCategoryFilterMode,
    categoryFilteredProducts.length,
    pagination?.total,
    effectivePageSize,
  ]);

  const catalogGrid = useMemo(
    () => buildCatalogGridProps(effectivePageSize),
    [effectivePageSize]
  );

  const loadingGrid = useMemo(
    () => buildCatalogGridProps(effectivePageSize),
    [effectivePageSize]
  );

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateCreateProductForm({
      name,
      description,
      price,
      stock,
      categoryName,
    });
    if (Object.keys(errors).length > 0) return;

    const priceNum = parsePositivePrice(price)!;
    const stockNum = parsePositiveStock(stock)!;

    const result = await createProduct({
      shopId,
      name: name.trim(),
      description: description.trim(),
      price: priceNum,
      stock: stockNum,
      categoryName: categoryName.trim(),
    });
    if (result.ok) {
      setCreateOpen(false);
      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      setCategoryName("");
      setPage(1);
    }
  }

  if (loading) {
    return (
      <div className="relative pt-12">
        {canManageThisShop && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="absolute right-0 top-0 z-10 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <i className="fas fa-plus mr-1.5" aria-hidden />
            Tạo sản phẩm
          </button>
        )}
        <div className={loadingGrid.className} style={loadingGrid.style}>
          {[...Array(effectivePageSize)].map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded bg-gray-100"
            />
          ))}
        </div>
        {canManageThisShop && createOpen && (
          <CreateProductModal
            creating={creating}
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            price={price}
            setPrice={setPrice}
            stock={stock}
            setStock={setStock}
            categoryName={categoryName}
            setCategoryName={setCategoryName}
            onClose={() => setCreateOpen(false)}
            onSubmit={handleCreateSubmit}
          />
        )}
      </div>
    );
  }

  if (!isSearchMode && !isSortMode && !listProducts.length) {
    return (
      <div className="relative space-y-4 pt-12">
        {canManageThisShop && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="absolute right-0 top-0 z-10 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <i className="fas fa-plus mr-1.5" aria-hidden />
            Tạo sản phẩm
          </button>
        )}
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-slate-500">
          <p>Shop này chưa có sản phẩm.</p>
        </div>
        {canManageThisShop && createOpen && (
          <CreateProductModal
            creating={creating}
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            price={price}
            setPrice={setPrice}
            stock={stock}
            setStock={setStock}
            categoryName={categoryName}
            setCategoryName={setCategoryName}
            onClose={() => setCreateOpen(false)}
            onSubmit={handleCreateSubmit}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {canManageThisShop && (
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="absolute right-0 top-0 z-10 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <i className="fas fa-plus mr-1.5" aria-hidden />
          Tạo sản phẩm
        </button>
      )}

      {isCategoryFilterMode && selectedCategoryName && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
          <span>
            Danh mục:{" "}
            <strong className="font-semibold">{selectedCategoryName}</strong>
          </span>
          {onClearCategory && (
            <button
              type="button"
              onClick={() => {
                onClearCategory();
                setPage(1);
              }}
              className="rounded-lg border border-emerald-300 bg-white px-3 py-7 text-xs font-medium text-emerald-800 transition hover:bg-emerald-50"
            >
              Xóa lọc
            </button>
          )}
        </div>
      )}

      <div className={canManageThisShop ? "pr-0 sm:pr-40" : ""}>
        <label className="sr-only" htmlFor="product-list-search">
          Tìm sản phẩm theo tên
        </label>
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-stretch"
          onSubmit={(e) => {
            e.preventDefault();
            submitProductSearch();
          }}
        >
          <div className="relative min-w-0 flex-1">
            <i
              className="fas fa-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400"
              aria-hidden
            />
            <input
              id="product-list-search"
              type="search"
              autoComplete="off"
              value={productSearchQuery}
              onChange={(e) => setProductSearchQuery(e.target.value)}
              placeholder="Tìm theo tên sản phẩm…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none ring-emerald-500/20 transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2"
            />
          </div>
          <label className="sr-only" htmlFor="product-list-sort">
            Sắp xếp sản phẩm
          </label>
          <select
            id="product-list-sort"
            value={appliedSortStrategy ?? ""}
            onChange={(e) => handleSortStrategyChange(e.target.value)}
            disabled={sortLoading}
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm outline-none transition hover:border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Sắp xếp sản phẩm"
          >
            <option value="">Sắp xếp</option>
            {PRODUCT_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={searchLoading}
          >
            {searchLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-1.5" aria-hidden />
                Đang tìm…
              </>
            ) : (
              "Tìm kiếm"
            )}
          </button>
        </form>
      </div>

      {loading ? (
        <div className={loadingGrid.className} style={loadingGrid.style}>
          {[...Array(effectivePageSize)].map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded bg-gray-100"
            />
          ))}
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center text-sm text-slate-500">
          {isSearchMode
            ? "Không có sản phẩm nào khớp với từ khóa. Thử đổi từ khóa hoặc sang trang khác."
            : isSortMode
              ? "Không có sản phẩm phù hợp với cách sắp xếp đã chọn."
              : isCategoryFilterMode
                ? `Không có sản phẩm trong danh mục «${selectedCategoryName}».`
                : "Không có sản phẩm để hiển thị."}
        </div>
      ) : (
        <div className={catalogGrid.className} style={catalogGrid.style}>
          {displayProducts.map((p, index) => (
            <ProductCard
              key={p.id}
              product={p}
              canDeleteProduct={canManageThisShop}
              canManageStock={canManageThisShop}
              navigateToDetailPage
              catalogLayout
              isTopBestseller={
                isSortMode &&
                appliedSortStrategy === "best-seller" &&
                page === 1 &&
                index === 0
              }
            />
          ))}
        </div>
      )}

      {(isSearchMode ||
        isSortMode ||
        isCategoryFilterMode ||
        listProducts.length > 0) && (
        <div className="mt-16 flex flex-col items-center gap-4">
          {isShopOwner && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <span>Sản phẩm mỗi trang</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const next = clampPageSize(Number(e.target.value));
                  setPageSize(next);
                  persistPageSize(shopId, next);
                  setPage(1);
                }}
                className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 outline-none transition hover:border-organic focus:border-organic focus:ring-1 focus:ring-organic/30"
                aria-label="Số sản phẩm hiển thị mỗi trang"
              >
                {Array.from(
                  { length: MAX_PAGE_SIZE - MIN_PAGE_SIZE + 1 },
                  (_, i) => MIN_PAGE_SIZE + i
                ).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="cursor-not-allowed rounded border border-gray-200 px-4 py-2 text-sm font-medium text-gray-400 disabled:opacity-100"
            >
              Trang trước
            </button>

            {totalPages <= 1 ? (
              <button
                type="button"
                disabled
                className="h-10 w-10 rounded bg-organic font-bold text-white shadow-md"
                aria-current="page"
              >
                1
              </button>
            ) : (
              Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    (p >= page - 1 && p <= page + 1)
                )
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev != null && p - prev > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setPage(p)}
                        aria-current={page === p ? "page" : undefined}
                        className={`h-10 w-10 rounded font-bold transition-all ${
                          page === p
                            ? "bg-organic text-white shadow-md"
                            : "border border-gray-200 bg-white text-gray-600 hover:border-organic hover:text-organic"
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })
            )}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:border-organic hover:text-organic disabled:cursor-not-allowed disabled:text-gray-400"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}

      {/* Banner Middle — Organicmart Home */}
      <div className="mb-20 grid grid-cols-1 gap-6 md:grid-cols-3">
        <PromoBanner
          img="https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&q=80"
          title="Trái cây tươi"
        />
        <PromoBanner
          img="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80"
          title="Rau xanh sạch"
        />
        <PromoBanner
          img="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80"
          title="Đồ khô hữu cơ"
        />
      </div>

      {canManageThisShop && createOpen && (
        <CreateProductModal
          creating={creating}
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          price={price}
          setPrice={setPrice}
          stock={stock}
          setStock={setStock}
          categoryName={categoryName}
          setCategoryName={setCategoryName}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      )}
    </div>
  );
};

function PromoBanner({ img, title }: { img: string; title: string }) {
  return (
    <div className="group relative h-48 cursor-pointer overflow-hidden rounded">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img}
        alt={title}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/10">
        <h3 className="text-2xl font-black tracking-widest text-white uppercase drop-shadow-lg">
          {title}
        </h3>
      </div>
    </div>
  );
}

const NAME_MIN = 5;
const NAME_MAX = 50;
const DESC_MIN = 5;
const DESC_MAX = 300;

type CreateProductFormValues = {
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryName: string;
};

type CreateProductFieldErrors = Partial<
  Record<keyof CreateProductFormValues, string>
>;

function parsePositivePrice(raw: string): number | null {
  const normalized = raw.trim().replace(/,/g, ".");
  if (!normalized) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function parsePositiveStock(raw: string): number | null {
  const normalized = raw.trim().replace(/,/g, ".");
  if (!normalized) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) return null;
  return n;
}

function validateCreateProductForm(
  values: CreateProductFormValues
): CreateProductFieldErrors {
  const errors: CreateProductFieldErrors = {};
  const trimmedName = values.name.trim();
  const trimmedDesc = values.description.trim();
  const trimmedCategory = values.categoryName.trim();

  if (trimmedName.length < NAME_MIN || trimmedName.length > NAME_MAX) {
    errors.name = `Tên sản phẩm phải từ ${NAME_MIN} đến ${NAME_MAX} ký tự.`;
  }

  if (trimmedDesc.length < DESC_MIN || trimmedDesc.length > DESC_MAX) {
    errors.description = `Mô tả phải từ ${DESC_MIN} đến ${DESC_MAX} ký tự.`;
  }

  if (parsePositivePrice(values.price) === null) {
    errors.price = "Giá phải là số lớn hơn 0.";
  }

  if (parsePositiveStock(values.stock) === null) {
    errors.stock = "Số lượng phải là số nguyên lớn hơn 0.";
  }

  if (!trimmedCategory) {
    errors.categoryName = "Vui lòng chọn danh mục.";
  }

  return errors;
}

function fieldErrorClass(hasError: boolean): string {
  return hasError
    ? "mt-1 w-full rounded-lg border border-red-300 px-3 py-2 text-sm text-slate-900 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-200"
    : "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900";
}

type CreateModalProps = {
  creating: boolean;
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  price: string;
  setPrice: (v: string) => void;
  stock: string;
  setStock: (v: string) => void;
  categoryName: string;
  setCategoryName: (v: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

function CreateProductModal({
  creating,
  name,
  setName,
  description,
  setDescription,
  price,
  setPrice,
  stock,
  setStock,
  categoryName,
  setCategoryName,
  onClose,
  onSubmit,
}: CreateModalProps) {
  const { categories, loading: categoriesLoading } = useGetPublicCategories();
  const [fieldErrors, setFieldErrors] = useState<CreateProductFieldErrors>({});

  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { value: string; label: string }[] = [];
    for (const cat of categories) {
      const label = (cat.name ?? "").trim();
      if (!label) continue;
      const key = normalizeCategoryName(label);
      if (seen.has(key)) continue;
      seen.add(key);
      options.push({ value: label, label });
    }
    return options.sort((a, b) => a.label.localeCompare(b.label, "vi"));
  }, [categories]);

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateCreateProductForm({
      name,
      description,
      price,
      stock,
      categoryName,
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    onSubmit(e);
  }

  function clearFieldError(field: keyof CreateProductFormValues) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-product-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2
            id="create-product-title"
            className="text-lg font-semibold text-slate-900"
          >
            Tạo sản phẩm mới
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            <i className="fas fa-times" aria-hidden />
          </button>
        </div>

        <form className="space-y-3" onSubmit={handleFormSubmit} noValidate>
          <label className="block text-xs font-medium text-slate-600">
            Tên sản phẩm * ({NAME_MIN}–{NAME_MAX} ký tự)
            <input
              value={name}
              maxLength={NAME_MAX}
              onChange={(e) => {
                setName(e.target.value);
                clearFieldError("name");
              }}
              className={fieldErrorClass(Boolean(fieldErrors.name))}
              placeholder="Ví dụ: Hoa quả"
              aria-invalid={Boolean(fieldErrors.name)}
            />
            {fieldErrors.name ? (
              <p className="mt-1 text-[11px] text-red-600">
                {fieldErrors.name}
              </p>
            ) : null}
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Mô tả * ({DESC_MIN}–{DESC_MAX} ký tự)
            <textarea
              value={description}
              maxLength={DESC_MAX}
              onChange={(e) => {
                setDescription(e.target.value);
                clearFieldError("description");
              }}
              rows={3}
              className={fieldErrorClass(Boolean(fieldErrors.description))}
              placeholder="Mô tả ngắn về sản phẩm"
              aria-invalid={Boolean(fieldErrors.description)}
            />
            {fieldErrors.description ? (
              <p className="mt-1 text-[11px] text-red-600">
                {fieldErrors.description}
              </p>
            ) : null}
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Giá (₫) *
            <input
              inputMode="decimal"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                clearFieldError("price");
              }}
              className={fieldErrorClass(Boolean(fieldErrors.price))}
              placeholder="25000 hoặc 19999.5"
              aria-invalid={Boolean(fieldErrors.price)}
            />
            {fieldErrors.price ? (
              <p className="mt-1 text-[11px] text-red-600">
                {fieldErrors.price}
              </p>
            ) : null}
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Số lượng *
            <input
              inputMode="numeric"
              value={stock}
              onChange={(e) => {
                setStock(e.target.value);
                clearFieldError("stock");
              }}
              className={fieldErrorClass(Boolean(fieldErrors.stock))}
              placeholder="1"
              aria-invalid={Boolean(fieldErrors.stock)}
            />
            {fieldErrors.stock ? (
              <p className="mt-1 text-[11px] text-red-600">
                {fieldErrors.stock}
              </p>
            ) : null}
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Danh mục *
            <select
              value={categoryName}
              disabled={categoriesLoading || categoryOptions.length === 0}
              onChange={(e) => {
                setCategoryName(e.target.value);
                clearFieldError("categoryName");
              }}
              className={fieldErrorClass(Boolean(fieldErrors.categoryName))}
              aria-invalid={Boolean(fieldErrors.categoryName)}
            >
              <option value="">
                {categoriesLoading
                  ? "Đang tải danh mục…"
                  : categoryOptions.length === 0
                    ? "Chưa có danh mục"
                    : "Chọn danh mục"}
              </option>
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {fieldErrors.categoryName ? (
              <p className="mt-1 text-[11px] text-red-600">
                {fieldErrors.categoryName}
              </p>
            ) : null}
          </label>
          <p className="text-[11px] text-slate-500">
            Chọn danh mục có sẵn trên hệ thống để gán cho sản phẩm mới.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={creating}
              className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-1" aria-hidden />
                  Đang tạo…
                </>
              ) : (
                "Tạo"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
