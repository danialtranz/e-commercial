import api from "@/apis/endpoint";
import type { ApiEnvelope, PaginationInfo } from "@/interface/shop";
import request from "@/utils/nextRequest";

function isOk(code: number) {
  return code === 0 || code === 200 || code === 201;
}

export interface ShopownerAdvertisementRow {
  id: string;
  image: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ShopownerAdvertisementsListData {
  items: ShopownerAdvertisementRow[];
  pagination: PaginationInfo;
}

export interface UploadShopownerAdvertisementParams {
  file: File;
}

export interface UploadShopownerAdvertisementResult {
  ok: boolean;
  data: ShopownerAdvertisementRow | null;
  msg?: string;
}

/**
 * POST /v1/shopowner/adv — multipart field `file`
 */
export async function uploadShopownerAdvertisement(
  params: UploadShopownerAdvertisementParams,
): Promise<UploadShopownerAdvertisementResult> {
  const formData = new FormData();
  formData.append("file", params.file);

  const res = await request.post<ApiEnvelope<ShopownerAdvertisementRow>>(
    api.shopownerAdv,
    formData,
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

export interface ListShopownerAdvertisementsParams {
  page?: number;
  page_size?: number;
}

export interface ListShopownerAdvertisementsResult {
  ok: boolean;
  data: ShopownerAdvertisementsListData | null;
  msg?: string;
}

/**
 * GET /v1/shopowner/advs?page=&page_size=
 */
export async function listShopownerAdvertisements(
  params?: ListShopownerAdvertisementsParams,
): Promise<ListShopownerAdvertisementsResult> {
  const res = await request.get<ApiEnvelope<ShopownerAdvertisementsListData>>(
    api.shopownerAdvs,
    {
      params: {
        page: params?.page ?? 1,
        page_size: params?.page_size ?? 10,
      },
    },
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

export type ShopownerAdvertisementStatus = "active" | "inactive";

export interface UpdateShopownerAdvertisementStatusParams {
  advId: string;
  status: ShopownerAdvertisementStatus;
}

export interface UpdateShopownerAdvertisementStatusResult {
  ok: boolean;
  data: ShopownerAdvertisementRow | null;
  msg?: string;
}

/**
 * POST /v1/shopowner/adv/sta-camp?adv_id=
 */
export async function updateShopownerAdvertisementStatus(
  params: UpdateShopownerAdvertisementStatusParams,
): Promise<UpdateShopownerAdvertisementStatusResult> {
  const res = await request.post<ApiEnvelope<ShopownerAdvertisementRow>>(
    api.shopownerAdvStaCamp,
    { status: params.status },
    {
      params: { adv_id: params.advId },
    },
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

export const publicActiveAdvertisementQueryKey = [
  "public-active-advertisement",
] as const;

/**
 * GET /v1/public/active-advertisement — không JWT (banner toàn site).
 */
export async function fetchPublicActiveAdvertisement(): Promise<ShopownerAdvertisementRow | null> {
  const res = await request.get<ApiEnvelope<ShopownerAdvertisementRow | null>>(
    api.publicActiveAdvertisement,
    { skipToken: true } as { skipToken?: boolean },
  );

  const body = res.data;
  if (!body || !isOk(body.code)) {
    return null;
  }

  return body.data ?? null;
}
