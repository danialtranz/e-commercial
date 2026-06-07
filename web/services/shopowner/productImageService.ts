import api from "@/apis/endpoint";
import type { ApiEnvelope, UserProduct } from "@/interface/shop";
import request from "@/utils/nextRequest";

function isOk(code: number) {
  return code === 0 || code === 200;
}

export interface UploadShopownerProductImageParams {
  shopId: string;
  productId: string;
  file: File;
}

export interface UploadShopownerProductImageResult {
  ok: boolean;
  product: UserProduct | null;
  msg?: string;
}

/**
 * POST /v1/shopowner/product-image?productId=...
 * multipart field: file
 */
export async function uploadShopownerProductImage(
  params: UploadShopownerProductImageParams
): Promise<UploadShopownerProductImageResult> {
  const formData = new FormData();
  formData.append("file", params.file);

  const res = await request.post<ApiEnvelope<UserProduct>>(
    api.shopownerProductImage,
    formData,
    {
      params: { productId: params.productId },
      headers: {
        "x-shop-id": params.shopId,
      },
    }
  );

  const body = res.data;
  if (!body || !isOk(body.code)) {
    return {
      ok: false,
      product: null,
      msg: body?.msg,
    };
  }

  return {
    ok: true,
    product: body.data ?? null,
  };
}
