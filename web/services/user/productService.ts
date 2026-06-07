import api from "@/apis/endpoint";
import type {
  ApiEnvelope,
  PaginationInfo,
  UserProduct,
} from "@/interface/shop";
import request, { type RequestConfig } from "@/utils/nextRequest";

function isOk(code: number) {
  return code === 0 || code === 200;
}

export async function fetchUserProducts(params: {
  shop_id: string;
  page?: number;
  page_size?: number;
}): Promise<{ items: UserProduct[]; pagination: PaginationInfo | null }> {
  const res = await request.get<
    ApiEnvelope<{
      items: UserProduct[];
      pagination: PaginationInfo;
    }>
  >(api.userProducts, {
    params: {
      shop_id: params.shop_id,
      page: params.page ?? 1,
      page_size: params.page_size ?? 5,
    },
  });

  const body = res.data;
  if (!body || !isOk(body.code)) return { items: [], pagination: null };

  const data = body.data as
    | {
        items?: UserProduct[];
        pagination?: PaginationInfo;
      }
    | undefined;

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    pagination: data?.pagination ?? null,
  };
}

export type ProductSortStrategy =
  | "price-descend"
  | "price-ascend"
  | "best-seller";

export interface SortPublicProductsParams {
  shopId: string;
  sortStrategy: ProductSortStrategy;
  page?: number;
  page_size?: number;
}

export interface SortPublicProductsData {
  items: UserProduct[];
  pagination: PaginationInfo;
  sortStrategy: ProductSortStrategy;
}

/**
 * POST /v1/public/product-sort — query: shopId, page, page_size; body: { sortStrategy }
 */
export async function sortPublicProducts(
  params: SortPublicProductsParams
): Promise<SortPublicProductsData> {
  const page = params.page && params.page > 0 ? params.page : 1;
  const page_size =
    params.page_size && params.page_size > 0 ? params.page_size : 10;

  const res = await request.post<
    ApiEnvelope<{
      items?: UserProduct[];
      pagination?: PaginationInfo;
      sortStrategy?: ProductSortStrategy;
    }>
  >(api.publicProductSort, { sortStrategy: params.sortStrategy }, {
    params: {
      shopId: params.shopId.trim(),
      page,
      page_size,
    },
    skipToken: true,
  } as RequestConfig);

  const body = res.data;
  if (!body || !isOk(body.code) || !body.data) {
    return {
      items: [],
      pagination: { page, page_size, total: 0 },
      sortStrategy: params.sortStrategy,
    };
  }

  const data = body.data;
  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: data.pagination ?? { page, page_size, total: 0 },
    sortStrategy: data.sortStrategy ?? params.sortStrategy,
  };
}

export async function fetchUserProductDetail(
  product_id: string
): Promise<UserProduct | null> {
  const res = await request.get<ApiEnvelope<UserProduct>>(api.userProducts, {
    params: { product_id },
  });

  const body = res.data;
  if (!body || !isOk(body.code) || !body.data) return null;
  return body.data;
}

export {
  uploadShopownerProductImage,
  type UploadShopownerProductImageParams,
  type UploadShopownerProductImageResult,
} from "@/services/shopowner/productImageService";
