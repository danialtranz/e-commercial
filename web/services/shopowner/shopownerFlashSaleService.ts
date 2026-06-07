import api from "@/apis/endpoint";
import type { ApiEnvelope, PaginationInfo } from "@/interface/shop";
import request from "@/utils/nextRequest";

function isOk(code: number) {
  return code === 0 || code === 200 || code === 201;
}

export interface ShopownerFlashSaleCampaignRow {
  id: string;
  productTargetId?: string;
  campaignStartAt?: string;
  expiredIn?: string;
  totalQuantity?: number;
  remainQuantity?: number;
  discount?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ShopownerFlashSaleListData {
  items: ShopownerFlashSaleCampaignRow[];
  pagination: PaginationInfo;
}

export interface CreateShopownerFlashSaleCampaignParams {
  product_target_id: string;
  campaign_start_at: string;
  expired_in: string;
  total_quantity: number;
  discount: number;
}

export interface CreateShopownerFlashSaleCampaignResult {
  ok: boolean;
  data: ShopownerFlashSaleCampaignRow | null;
  msg?: string;
}

/**
 * POST /v1/shopowner/Flscamp
 */
export async function createShopownerFlashSaleCampaign(
  params: CreateShopownerFlashSaleCampaignParams
): Promise<CreateShopownerFlashSaleCampaignResult> {
  const res = await request.post<ApiEnvelope<ShopownerFlashSaleCampaignRow>>(
    api.shopownerFlscamp,
    {
      product_target_id: params.product_target_id.trim(),
      campaign_start_at: params.campaign_start_at.trim(),
      expired_in: params.expired_in.trim(),
      total_quantity: params.total_quantity,
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

export interface ListShopownerFlashSaleCampaignsParams {
  page?: number;
  page_size?: number;
}

export interface ListShopownerFlashSaleCampaignsResult {
  ok: boolean;
  data: ShopownerFlashSaleListData | null;
  msg?: string;
}

/**
 * GET /v1/shopowner/Flscamps?page=&page_size=
 */
export async function listShopownerFlashSaleCampaigns(
  params?: ListShopownerFlashSaleCampaignsParams
): Promise<ListShopownerFlashSaleCampaignsResult> {
  const res = await request.get<ApiEnvelope<ShopownerFlashSaleListData>>(
    api.shopownerFlscamps,
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

export type ShopownerFlashSaleManualStatus = "active" | "inactive";

export interface UpdateShopownerFlashSaleCampaignStatusParams {
  flash_sale_campaign_id: string;
  status: ShopownerFlashSaleManualStatus;
}

export interface UpdateShopownerFlashSaleCampaignStatusResult {
  ok: boolean;
  data: ShopownerFlashSaleCampaignRow | null;
  msg?: string;
}

/**
 * POST /v1/shopowner/Flscamp/updt-status?flash_sale_campaign_id=
 */
export async function updateShopownerFlashSaleCampaignStatus(
  params: UpdateShopownerFlashSaleCampaignStatusParams
): Promise<UpdateShopownerFlashSaleCampaignStatusResult> {
  const res = await request.post<ApiEnvelope<ShopownerFlashSaleCampaignRow>>(
    api.shopownerFlscampUpdtStatus,
    { status: params.status },
    {
      params: { flash_sale_campaign_id: params.flash_sale_campaign_id.trim() },
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

export interface DeleteShopownerFlashSaleCampaignParams {
  flash_sale_campaign_id: string;
}

export interface DeleteShopownerFlashSaleCampaignResult {
  ok: boolean;
  msg?: string;
}

/**
 * DELETE /v1/shopowner/Flscamp?flash_sale_campaign_id=
 */
export async function deleteShopownerFlashSaleCampaign(
  params: DeleteShopownerFlashSaleCampaignParams
): Promise<DeleteShopownerFlashSaleCampaignResult> {
  const res = await request.delete<ApiEnvelope<null>>(api.shopownerFlscamp, {
    params: { flash_sale_campaign_id: params.flash_sale_campaign_id.trim() },
  });

  const body = res.data;
  if (!body || !isOk(body.code)) {
    return {
      ok: false,
      msg: body?.msg,
    };
  }

  return { ok: true };
}
