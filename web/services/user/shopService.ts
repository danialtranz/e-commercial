import api from "@/apis/endpoint";
import type {
  ApiEnvelope,
  PaginationInfo,
  ShopCategory,
  ShopProduct,
  UserShop,
} from "@/interface/shop";
import request from "@/utils/nextRequest";

function isOk(code: number) {
  return code === 0 || code === 200;
}

/** Catalog công khai — không cần đăng nhập */
export async function fetchPublicProducts(): Promise<ShopProduct[]> {
  const res = await request.get<ApiEnvelope<ShopProduct[]>>(
    api.catalogProducts
  );
  const body = res.data;
  if (!body || !isOk(body.code)) return [];
  return Array.isArray(body.data) ? body.data : [];
}

export async function fetchPublicCategories(): Promise<ShopCategory[]> {
  const res = await request.get<ApiEnvelope<ShopCategory[]>>(
    api.catalogCategories
  );
  const body = res.data;
  if (!body || !isOk(body.code)) return [];
  return Array.isArray(body.data) ? body.data : [];
}

export async function fetchPublicProduct(
  id: string
): Promise<ShopProduct | null> {
  const res = await request.get<ApiEnvelope<ShopProduct>>(
    api.catalogProduct(id)
  );
  const body = res.data;
  if (!body || !isOk(body.code) || !body.data) return null;
  return body.data;
}

/** Admin — cần Bearer token (interceptor tự gắn) */
export async function adminListProducts(): Promise<ShopProduct[]> {
  const res = await request.get<ApiEnvelope<ShopProduct[]>>(api.adminProducts);
  const body = res.data;
  if (!body || !isOk(body.code)) return [];
  return Array.isArray(body.data) ? body.data : [];
}

export async function adminCreateProduct(payload: {
  name: string;
  price: number;
  stock: number;
  categoryId?: string | null;
  description?: string | null;
  image?: string | null;
  status?: string;
}) {
  return request.post<ApiEnvelope<ShopProduct>>(api.adminProducts, payload);
}

export async function adminUpdateProduct(
  id: string,
  payload: Partial<{
    name: string;
    price: number;
    stock: number;
    categoryId: string | null;
    description: string | null;
    image: string | null;
    status: string;
  }>
) {
  return request.patch<ApiEnvelope<ShopProduct>>(
    api.adminProductById(id),
    payload
  );
}

export async function adminDeleteProduct(id: string) {
  return request.delete<ApiEnvelope<{ id: string }>>(api.adminProductById(id));
}

export async function adminListCategories(page = 1, page_size = 100) {
  return request.get<
    ApiEnvelope<{
      items: ShopCategory[];
      pagination: { page: number; page_size: number; total: number };
    }>
  >(api.adminCategorie, { params: { page, page_size } });
}

export async function adminCreateCategory(payload: {
  name?: string;
  description?: string;
  status?: string;
}) {
  return request.post<ApiEnvelope<ShopCategory>>(api.adminCategorie, payload);
}

export async function adminUpdateCategory(
  id: string,
  payload: { name?: string; description?: string; status?: string }
) {
  return request.put<ApiEnvelope<ShopCategory>>(api.adminCategorie, payload, {
    params: { id },
  });
}

export async function adminDeleteCategory(id: string) {
  return request.delete<ApiEnvelope<{ id: string }>>(api.adminCategorie, {
    params: { id },
  });
}

/** Đặt hàng — chỉ gửi productId + quantity; server tính giá & kiểm tồn kho */
export async function createUserOrder(payload: {
  items: { productId: string; quantity: number }[];
  address: string;
  note?: string;
}) {
  return request.post<
    ApiEnvelope<{ order: Record<string, unknown>; items: unknown[] }>
  >(api.userOrders, payload);
}

export async function fetchMyOrders() {
  return request.get<ApiEnvelope<Record<string, unknown>[]>>(api.userOrders);
}

export async function fetchMyOrderById(id: string) {
  return request.get<
    ApiEnvelope<{
      order: Record<string, unknown>;
      items: Record<string, unknown>[];
    }>
  >(api.userOrderById(id));
}

/** Danh sách shop thuộc user — GET /v1/user/shops?page=...&page_size=... */
export async function fetchUserShops(
  page = 1,
  page_size = 5
): Promise<{ items: UserShop[]; pagination: PaginationInfo | null }> {
  const res = await request.get<
    ApiEnvelope<{
      items: UserShop[];
      pagination: PaginationInfo;
    }>
  >(api.userShops, { params: { page, page_size } });

  const body = res.data;
  if (!body || !isOk(body.code)) return { items: [], pagination: null };

  const data = body.data as unknown as Partial<{
    items: UserShop[];
    pagination: PaginationInfo;
  }>;

  return {
    items: Array.isArray(data?.items) ? data!.items : [],
    pagination: data?.pagination ?? null,
  };
}
