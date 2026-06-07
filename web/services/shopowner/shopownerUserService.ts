import api from "@/apis/endpoint";
import type { ApiEnvelope, PaginationInfo } from "@/interface/shop";
import request from "@/utils/nextRequest";

function isOk(code: number) {
  return code === 0 || code === 200 || code === 201;
}

export type ShopownerUserAccountStatus = "active" | "inactive";

export interface ShopownerUserOrderStats {
  total: number;
  cart: number;
  processing: number;
  paid: number;
  order: number;
  cancel: number;
  failed: number;
}

export interface ShopownerUserRow {
  id: string;
  email?: string | null;
  username?: string | null;
  name?: string | null;
  phoneNumber?: string | null;
  avatar?: string | null;
  provider?: string | null;
  role?: string | null;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
  order_stats: ShopownerUserOrderStats;
  [key: string]: unknown;
}

export interface ShopownerUsersListData {
  items: ShopownerUserRow[];
  pagination: PaginationInfo;
}

export interface UpdateShopownerUserStatusParams {
  email: string;
  status: ShopownerUserAccountStatus;
}

export interface UpdateShopownerUserStatusResult {
  ok: boolean;
  data: ShopownerUserRow | null;
  msg?: string;
}

/**
 * POST /v1/shopowner/banned-user
 */
export async function updateShopownerUserStatus(
  params: UpdateShopownerUserStatusParams
): Promise<UpdateShopownerUserStatusResult> {
  const res = await request.post<ApiEnvelope<ShopownerUserRow>>(
    api.shopownerBannedUser,
    {
      email: params.email.trim(),
      status: params.status,
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

  const row = body.data;
  return {
    ok: true,
    data: row
      ? {
          ...row,
          order_stats: row.order_stats ?? {
            total: 0,
            cart: 0,
            processing: 0,
            paid: 0,
            order: 0,
            cancel: 0,
            failed: 0,
          },
        }
      : null,
  };
}

export interface ListShopownerUsersParams {
  page?: number;
  page_size?: number;
}

export interface ListShopownerUsersResult {
  ok: boolean;
  data: ShopownerUsersListData | null;
  msg?: string;
}

/**
 * GET /v1/shopowner/users?page=&page_size=
 */
export async function listShopownerUsers(
  params?: ListShopownerUsersParams
): Promise<ListShopownerUsersResult> {
  const res = await request.get<ApiEnvelope<ShopownerUsersListData>>(
    api.shopownerUsers,
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

  const data = body.data;
  const items = (data?.items ?? []).map((u) => ({
    ...u,
    order_stats: u.order_stats ?? {
      total: 0,
      cart: 0,
      processing: 0,
      paid: 0,
      order: 0,
      cancel: 0,
      failed: 0,
    },
  }));

  return {
    ok: true,
    data: data
      ? {
          items,
          pagination: data.pagination,
        }
      : null,
  };
}
