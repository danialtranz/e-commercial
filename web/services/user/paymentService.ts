import api from "@/apis/endpoint";
import type { ApiEnvelope } from "@/interface/shop";
import request from "@/utils/nextRequest";

export interface ICreateOrderItem {
  productId: string;
  quantity: number;
}

export interface ICreateOrderPayload {
  items: ICreateOrderItem[];
}

export interface ICheckoutPayload {
  orderId: string;
  method: "COD" | "MOMO";
  payment: {
    payment_method: "COD" | "MOMO";
    status: "DONE";
  };
  delivery_target: "I3" | "I4" | "I5";
  voucher_id: string | null;
}

export interface ICheckoutAmounts {
  order_total_price: number;
  subtotal_after_flash_sale: number;
  flash_sale_discount: number;
  voucher_discount: number;
  discount: number;
  amount_to_pay: number;
}

export interface ICheckoutFlashSaleApplied {
  productId: string;
  quantity: number;
  originalLineTotal: number;
  lineTotalAfterFlash: number;
  flashSaleDiscount: number;
  flashUnits: number;
  regularUnits: number;
  campaignId: string;
}

/** Payload `data` từ POST /user/checkout sau khi thanh toán thành công. */
export interface ICheckoutResultData {
  order?: {
    id?: string;
    totalPrice?: number;
    status?: string;
    [key: string]: unknown;
  };
  payment?: {
    id?: string;
    amount?: number;
    method?: string;
    status?: string;
    [key: string]: unknown;
  };
  payment_summary?: {
    payment_method?: string;
    payment_status?: string;
  };
  amounts?: ICheckoutAmounts;
  flash_sale?: {
    applied?: ICheckoutFlashSaleApplied[];
  };
  voucher?: { id?: string; [key: string]: unknown } | null;
  shipper_assignment?: {
    deliveryAddress?: string;
    codAmount?: number | null;
    [key: string]: unknown;
  };
}

export async function createOrderFromItems(payload: ICreateOrderPayload) {
  return request.post<ApiEnvelope<Record<string, unknown>>>(
    api.userCreateOrder,
    payload
  );
}

export async function checkoutOrder(payload: ICheckoutPayload) {
  return request.post<ApiEnvelope<Record<string, unknown>>>(
    api.userCheckout,
    payload
  );
}
