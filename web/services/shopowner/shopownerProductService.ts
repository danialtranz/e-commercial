import api from "@/apis/endpoint";
import type {
  ApiEnvelope,
  PaginationInfo,
  UserProduct,
} from "@/interface/shop";
import request from "@/utils/nextRequest";
import type { AxiosRequestConfig } from "axios";

type RequestConfig = AxiosRequestConfig & { skipToken?: boolean };

function isOk(code: number) {
  return code === 0 || code === 200 || code === 201;
}

export interface CreateShopownerProductParams {
  shopId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  /** Tạo danh mục mới kèm sản phẩm */
  categoryName: string;
  categoryDescription?: string;
  image?: string | null;
}

export interface CreateShopownerProductResult {
  ok: boolean;
  product: UserProduct | null;
  msg?: string;
}

/**
 * POST /v1/shopowner/products
 */
export async function createShopownerProduct(
  params: CreateShopownerProductParams
): Promise<CreateShopownerProductResult> {
  const body = {
    name: params.name.trim(),
    description: params.description?.trim() ?? "",
    price: params.price,
    stock: params.stock,
    image: params.image ?? null,
    status: "active",
    category: {
      category_name: params.categoryName.trim(),
      category_description: params.categoryDescription?.trim() ?? "",
    },
  };

  const res = await request.post<ApiEnvelope<UserProduct>>(
    api.shopownerProducts,
    body,
    {
      headers: {
        "x-shop-id": params.shopId,
      },
    }
  );

  const data = res.data;
  if (!data || !isOk(data.code)) {
    return {
      ok: false,
      product: null,
      msg: data?.msg,
    };
  }

  return {
    ok: true,
    product: data.data ?? null,
  };
}

export interface DeleteShopownerProductParams {
  shopId: string;
  productId: string;
}

export interface DeleteShopownerProductResult {
  ok: boolean;
  msg?: string;
}

/**
 * DELETE /v1/shopowner/products?id=
 */
export async function deleteShopownerProduct(
  params: DeleteShopownerProductParams
): Promise<DeleteShopownerProductResult> {
  const res = await request.delete<ApiEnvelope<{ id: string }>>(
    api.shopownerProducts,
    {
      params: { id: params.productId },
      headers: {
        "x-shop-id": params.shopId,
      },
    }
  );

  const data = res.data;
  if (!data || !isOk(data.code)) {
    return {
      ok: false,
      msg: data?.msg,
    };
  }

  return { ok: true };
}

// --- Manager quantity (stock adjust + history) ---

export interface ShopownerStockDetailItem {
  id: string;
  productId: string;
  quantity: number;
  reason: string | null;
  remain: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShopownerStockRemainData {
  items: ShopownerStockDetailItem[];
  current_remain: number;
  pagination: PaginationInfo;
}

export interface UpdateShopownerStockParams {
  shopId: string;
  productId: string;
  quantity: number;
  reason: "rotten" | "import";
}

export interface UpdateShopownerStockResult {
  ok: boolean;
  detail: ShopownerStockDetailItem | null;
  msg?: string;
}

/**
 * POST /v1/shopowner/manager-quantity?id=
 */
export async function updateShopownerStock(
  params: UpdateShopownerStockParams
): Promise<UpdateShopownerStockResult> {
  const res = await request.post<ApiEnvelope<ShopownerStockDetailItem>>(
    api.shopownerManagerQuantity,
    {
      quantity: params.quantity,
      reason: params.reason,
    },
    {
      params: { id: params.productId },
      headers: {
        "x-shop-id": params.shopId,
      },
    }
  );

  const data = res.data;
  if (!data || !isOk(data.code)) {
    return {
      ok: false,
      detail: null,
      msg: data?.msg,
    };
  }

  return {
    ok: true,
    detail: data.data ?? null,
  };
}

export interface GetShopownerStockRemainParams {
  shopId: string;
  productId: string;
  page?: number;
  page_size?: number;
}

export interface GetShopownerStockRemainResult {
  ok: boolean;
  data: ShopownerStockRemainData | null;
  msg?: string;
}

/**
 * GET /v1/shopowner/manager-quantity?id=&page=&page_size=
 */
export async function getShopownerStockRemain(
  params: GetShopownerStockRemainParams
): Promise<GetShopownerStockRemainResult> {
  const res = await request.get<ApiEnvelope<ShopownerStockRemainData>>(
    api.shopownerManagerQuantity,
    {
      params: {
        id: params.productId,
        page: params.page ?? 1,
        page_size: params.page_size ?? 10,
      },
      headers: {
        "x-shop-id": params.shopId,
      },
    }
  );

  const data = res.data;
  if (!data || !isOk(data.code)) {
    return {
      ok: false,
      data: null,
      msg: data?.msg,
    };
  }

  return {
    ok: true,
    data: data.data ?? null,
  };
}

// --- Public catalog (không JWT) ---

export interface PublicCategory {
  id: string;
  shopId: string | null;
  name: string | null;
  description: string | null;
  status: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchPublicProductsParams {
  keyWord: string;
  page?: number;
  page_size?: number;
}

export interface PublicProductSearchData {
  items: UserProduct[];
  pagination: PaginationInfo;
}

export const publicCategoriesQueryKey = ["public-categories"] as const;

/**
 * GET /v1/public/categories — danh mục `active`, gộp theo tên.
 */
export async function fetchPublicActiveCategories(): Promise<PublicCategory[]> {
  const res = await request.get<ApiEnvelope<PublicCategory[]>>(
    api.publicCategories,
    { skipToken: true } as RequestConfig
  );

  const body = res.data;
  if (!body || !isOk(body.code)) return [];
  return Array.isArray(body.data) ? body.data : [];
}

/**
 * POST /v1/public/product-search — tìm sản phẩm theo tên (header `page`, `page_size`).
 */
export async function searchPublicProductsByKeyword(
  params: SearchPublicProductsParams
): Promise<PublicProductSearchData> {
  const page = params.page && params.page > 0 ? params.page : 1;
  const page_size =
    params.page_size && params.page_size > 0 ? params.page_size : 10;

  const res = await request.post<ApiEnvelope<PublicProductSearchData>>(
    api.publicProductSearch,
    { keyWord: params.keyWord.trim() },
    {
      headers: {
        page: String(page),
        page_size: String(page_size),
      },
      skipToken: true,
    } as RequestConfig
  );

  const data = res.data;
  if (!data || !isOk(data.code) || !data.data) {
    return {
      items: [],
      pagination: { page, page_size, total: 0 },
    };
  }

  const payload = data.data;
  return {
    items: Array.isArray(payload.items) ? payload.items : [],
    pagination: payload.pagination ?? { page, page_size, total: 0 },
  };
}
