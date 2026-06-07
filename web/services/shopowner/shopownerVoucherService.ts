import api from "@/apis/endpoint";
import type { ApiEnvelope, PaginationInfo } from "@/interface/shop";
import request from "@/utils/nextRequest";

function isOk(code: number) {
  return code === 0 || code === 200 || code === 201;
}

export interface ShopownerVoucherRow {
  id: string;
  name?: string | null;
  discount?: number | null;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ShopownerVouchersListData {
  items: ShopownerVoucherRow[];
  pagination: PaginationInfo;
}

export interface CreateShopownerVoucherParams {
  name: string;
  discount: number;
}

export interface CreateShopownerVoucherResult {
  ok: boolean;
  data: ShopownerVoucherRow | null;
  msg?: string;
}

/**
 * POST /v1/shopowner/voucher
 */
export async function createShopownerVoucher(
  params: CreateShopownerVoucherParams
): Promise<CreateShopownerVoucherResult> {
  const res = await request.post<ApiEnvelope<ShopownerVoucherRow>>(
    api.shopownerVoucher,
    {
      name: params.name.trim(),
      discount: params.discount,
    }
  );

  const body = res.data;
  if (!body || !isOk(body.code)) {
    return {
      ok: false,
      data: null,
      msg: body?.msg,
    };
  }

  return {
    ok: true,
    data: body.data ?? null,
  };
}

export interface ListShopownerVouchersParams {
  page?: number;
  page_size?: number;
}

export interface ListShopownerVouchersResult {
  ok: boolean;
  data: ShopownerVouchersListData | null;
  msg?: string;
}

/**
 * GET /v1/shopowner/vouchers?page=&page_size=
 */
export async function listShopownerVouchers(
  params?: ListShopownerVouchersParams
): Promise<ListShopownerVouchersResult> {
  const res = await request.get<ApiEnvelope<ShopownerVouchersListData>>(
    api.shopownerVouchers,
    {
      params: {
        page: params?.page ?? 1,
        page_size: params?.page_size ?? 10,
      },
    }
  );

  const body = res.data;
  if (!body || !isOk(body.code)) {
    return {
      ok: false,
      data: null,
      msg: body?.msg,
    };
  }

  return {
    ok: true,
    data: body.data ?? null,
  };
}
