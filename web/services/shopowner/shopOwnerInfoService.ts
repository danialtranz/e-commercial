import api, { api_host } from "@/apis/endpoint";
import type { ApiEnvelope } from "@/interface/shop";
import request from "@/utils/nextRequest";

function isOk(code: number) {
  return code === 0 || code === 200;
}

export interface ShopOwnerInfoShop {
  id: string;
  userId: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShopOwnerInfoData {
  shopId: string;
  id: string;
  shop: ShopOwnerInfoShop;
}

/**
 * GET /v1/shopowner/info — JWT Bearer (via nextRequest interceptor).
 */
export async function fetchShopOwnerInfo(): Promise<ShopOwnerInfoData | null> {
  const res = await request.get<ApiEnvelope<ShopOwnerInfoData>>(
    `${api_host}/shopowner/info`
  );

  const body = res.data;
  if (!body || !isOk(body.code) || !body.data) return null;
  return body.data;
}

/**
 * GET /v1/public/shopInfo — công khai, không cần JWT.
 */
export async function fetchDefaultShopInfo(): Promise<ShopOwnerInfoData | null> {
  const res = await request.get<ApiEnvelope<ShopOwnerInfoData>>(
    api.publicShopInfo
  );

  const body = res.data;
  if (!body || !isOk(body.code) || !body.data) return null;
  return body.data;
}

/** Sau đăng nhập — lưu shop mặc định (giống Google OAuth callback). */
export async function persistDefaultShopInLocalStorage(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const shopInfo = await fetchDefaultShopInfo();
    if (shopInfo) {
      localStorage.setItem("shopInfo", JSON.stringify(shopInfo));
      localStorage.setItem("shopId", shopInfo.id);
    }
  } catch {
    // Không chặn đăng nhập nếu load shop thất bại
  }
}
