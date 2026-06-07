import api from "@/apis/endpoint";
import type { ApiEnvelope, PaginationInfo } from "@/interface/shop";
import request from "@/utils/nextRequest";

function isOk(code: number) {
  return code === 0 || code === 200;
}

export interface UserDeliveryPaymentSummary {
  status?: string | null;
  method?: string | null;
  amount?: number | null;
  [key: string]: unknown;
}

export interface UserDeliveryAssignmentSummary {
  deliveryStatus?: string | null;
  deliveryAddress?: string | null;
  assignedAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  codAmount?: number | null;
  shipperUserId?: string | null;
  [key: string]: unknown;
}

export interface UserDeliveryStatusRow {
  order: Record<string, unknown>;
  payment: UserDeliveryPaymentSummary | null;
  delivery: UserDeliveryAssignmentSummary | null;
}

export interface UserDeliveryStatusListData {
  items: UserDeliveryStatusRow[];
  pagination: PaginationInfo | null;
}

export interface FetchUserDeliveryStatusParams {
  page?: number;
  page_size?: number;
}

/**
 * GET /v1/user/delivery-status?page=&page_size=
 */
export async function fetchUserDeliveryStatus(
  params?: FetchUserDeliveryStatusParams
): Promise<UserDeliveryStatusListData> {
  const res = await request.get<
    ApiEnvelope<{
      items?: UserDeliveryStatusRow[];
      pagination?: PaginationInfo;
    }>
  >(api.userDeliveryStatus, {
    params: {
      page: params?.page ?? 1,
      page_size: params?.page_size ?? 10,
    },
  });

  const body = res.data;
  if (!body || !isOk(body.code)) {
    return { items: [], pagination: null };
  }

  const data = body.data as
    | {
        items?: UserDeliveryStatusRow[];
        pagination?: PaginationInfo;
      }
    | undefined;

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    pagination: data?.pagination ?? null,
  };
}

export interface IClaimUserVoucherPayload {
  voucherId: string;
}

export interface UserCreditDetail {
  id?: string;
  userId?: string | null;
  totalCredit?: number | null;
  usedCredit?: number | null;
  currentMultiply?: number | null;
  currentRank?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface UserVoucherItem {
  id: string;
  userId: string | null;
  voucherId: string | null;
  status: string | null;
  voucher?: {
    id?: string;
    name?: string | null;
    discount?: number | null;
    status?: string | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

export interface UserVoucherListData {
  items: UserVoucherItem[];
  pagination: PaginationInfo | null;
}

export interface FetchUserVoucherParams {
  page?: number;
  page_size?: number;
}

/**
 * POST /v1/user/vouchers?page=&page_size=
 */
export async function fetchUserVouchers(
  params?: FetchUserVoucherParams
): Promise<UserVoucherListData> {
  const res = await request.get<
    ApiEnvelope<{
      items?: UserVoucherItem[];
      pagination?: PaginationInfo;
    }>
  >(api.userVouchers, {
    params: {
      page: params?.page ?? 1,
      page_size: params?.page_size ?? 10,
    },
  });

  const body = res.data;

  const data = body.data as
    | {
        items?: UserVoucherItem[];
        pagination?: PaginationInfo;
      }
    | undefined;

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    pagination: data?.pagination ?? null,
  };
}

export interface ClaimUserVoucherResponseData {
  user_voucher?: Record<string, unknown>;
  credit?: Record<string, unknown>;
  cost_credits?: number;
  voucher?: {
    id?: string;
    name?: string | null;
    discount?: number | null;
  };
  required_credit?: number;
  current_total_credit?: number;
  [key: string]: unknown;
}

/**
 * POST /v1/user/claim-voucher — body `{ voucherId }`.
 */
export async function claimUserVoucher(payload: IClaimUserVoucherPayload) {
  return request.post<ApiEnvelope<ClaimUserVoucherResponseData | null>>(
    api.userClaimVoucher,
    { voucherId: payload.voucherId.trim() }
  );
}

/**
 * GET /v1/user/my-credit
 */
export async function fetchUserCredit(): Promise<UserCreditDetail | null> {
  const res = await request.get<ApiEnvelope<UserCreditDetail | null>>(
    api.userMyCredit
  );
  const body = res.data;
  if (!body || !isOk(body.code)) {
    return null;
  }
  return (body.data as UserCreditDetail | null) ?? null;
}
