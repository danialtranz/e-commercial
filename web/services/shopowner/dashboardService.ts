import api from "@/apis/endpoint";
import request from "@/utils/nextRequest";
import type { ApiEnvelope } from "@/interface/shop";

function isOk(code: number) {
  return code === 0 || code === 200;
}

export interface ShopOwnerIncomeItem {
  productId?: string;
  total_quantity?: number;
  total_revenue?: number;
  product?: {
    id?: string;
    name?: string;
    description?: string;
    price?: number;
    image?: string | null;
    status?: string;
  };
}

export interface ShopOwnerIncomeData {
  shopId?: string;
  days_ago?: number | null;
  from?: string | null;
  to?: string | null;
  from_time?: string;
  to_time?: string;
  total_revenue?: number;
  total_income?: number;
  product_sales?: ShopOwnerIncomeItem[];
  items?: ShopOwnerIncomeItem[];
}

/** Khoảng ngày DD-MM-YYYY (ưu tiên hơn daysAgo khi gửi cả hai). */
export interface ShopOwnerIncomeDateRange {
  from: string;
  to: string;
}

export interface GetIncomeRequest {
  shopId: string;
  /** Số ngày gần đây — dùng query `days_ago` khi không có dateRange */
  daysAgo?: number;
  /** POST body — ưu tiên trên daysAgo */
  dateRange?: ShopOwnerIncomeDateRange;
}

export interface FetchShopOwnerIncomeResult {
  ok: boolean;
  data: ShopOwnerIncomeData | null;
  msg?: string;
}

/**
 * POST /v1/shopowner/income
 * - Có `dateRange` → body { from, to }
 * - Không có → query `days_ago` (mặc định 7)
 */
export async function fetchShopOwnerIncome(
  params: GetIncomeRequest
): Promise<FetchShopOwnerIncomeResult> {
  const hasRange =
    params.dateRange?.from?.trim() && params.dateRange?.to?.trim();

  const res = await request.post<ApiEnvelope<ShopOwnerIncomeData>>(
    api.shopownerIncome,
    hasRange
      ? {
          from: params.dateRange!.from.trim(),
          to: params.dateRange!.to.trim(),
        }
      : {},
    {
      params: hasRange ? undefined : { days_ago: params.daysAgo ?? 7 },
      headers: {
        "x-shop-id": params.shopId,
      },
    }
  );

  const body = res.data;
  if (!body || !isOk(body.code) || !body.data) {
    return {
      ok: false,
      data: null,
      msg: body?.msg,
    };
  }

  return {
    ok: true,
    data: body.data,
  };
}
