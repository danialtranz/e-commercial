import api from "@/apis/endpoint";
import type { ApiEnvelope, PaginationInfo } from "@/interface/shop";
import request from "@/utils/nextRequest";

function isOk(code: number) {
  return code === 0 || code === 200 || code === 201;
}

export interface ShopownerProductCommentRow {
  id: string;
  productId?: string;
  userId?: string;
  comment?: string | null;
  file?: string | null;
  fileType?: string | null;
  isBought?: boolean;
  star?: number | null;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id?: string;
    name?: string | null;
    avatar?: string | null;
    email?: string | null;
  };
  [key: string]: unknown;
}

export interface ShopownerProductCommentsListData {
  items: ShopownerProductCommentRow[];
  pagination: PaginationInfo;
}

export interface CreateShopownerProductCommentParams {
  product_id: string;
  comment?: string;
  file?: File | null;
  /** Đánh giá sao 1–5 */
  star?: number;
}

export interface CreateShopownerProductCommentResult {
  ok: boolean;
  data: ShopownerProductCommentRow | null;
  msg?: string;
}

/**
 * POST /v1/shopowner/comment — multipart: product_id, comment?, file?, star? (1–5)
 */
export async function createShopownerProductComment(
  params: CreateShopownerProductCommentParams,
): Promise<CreateShopownerProductCommentResult> {
  const formData = new FormData();
  formData.append("product_id", params.product_id.trim());
  if (params.comment != null && params.comment !== "") {
    formData.append("comment", params.comment);
  }
  if (params.star != null && params.star >= 1 && params.star <= 5) {
    formData.append("star", String(params.star));
  }
  if (params.file) {
    formData.append("file", params.file);
  }

  const res = await request.post<ApiEnvelope<ShopownerProductCommentRow>>(
    api.shopownerComment,
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

export interface ListShopownerProductCommentsParams {
  product_id: string;
  page?: number;
  page_size?: number;
}

export interface ListShopownerProductCommentsResult {
  ok: boolean;
  data: ShopownerProductCommentsListData | null;
  msg?: string;
}

/**
 * GET /v1/shopowner/comments?product_id=&page=&page_size=
 */
export async function listShopownerProductComments(
  params: ListShopownerProductCommentsParams,
): Promise<ListShopownerProductCommentsResult> {
  const res = await request.get<ApiEnvelope<ShopownerProductCommentsListData>>(
    api.shopownerComments,
    {
      params: {
        product_id: params.product_id.trim(),
        page: params.page ?? 1,
        page_size: params.page_size ?? 10,
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
