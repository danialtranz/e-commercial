import api from "@/apis/endpoint";
import request from "@/utils/nextRequest";
import type {
  ApiEnvelope,
  PaginationInfo,
  UserProduct,
} from "@/interface/shop";
import { computeDiscountedPrice } from "@/view/product/FlashSaleHot";

function isOk(code: number) {
  return code === 0 || code === 200;
}

export interface IAddProductToCartPayload {
  productId: string;
  quantity: number;
}

export interface IUserCartOrder {
  id: string;
  userId: string;
  totalPrice: number;
  address: string | null;
  note: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUserOrder {
  id: string;
  userId: string;
  totalPrice: number;
  address: string | null;
  note: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUserOrderWithItems {
  order: IUserOrder;
  items: IUserCartOrderItem[];
}

export interface IUserOrdersData {
  items: IUserOrderWithItems[];
  pagination: PaginationInfo | null;
}

export interface IUserOrderStatus {
  orderId?: string;
  orderStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentAmount?: number;
  shippingStatus?: string | null;
  status?: string;
  [key: string]: unknown;
}

/** Flash sale gắn với dòng giỏ hàng (cùng schema BE `flash_sale`). */
export interface ICartFlashSale {
  id: string;
  productTargetId: string | null;
  campaignStartAt: string | null;
  expiredIn: string | null;
  totalQuantity: number | null;
  remainQuantity: number | null;
  discount: number | null;
  status: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IUserCartOrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  product: UserProduct;
  flash_sale: ICartFlashSale | null;
}

/** Đơn giá dòng giỏ (áp flash sale nếu campaign còn hiệu lực). */
export function cartItemUnitPrice(item: IUserCartOrderItem): number {
  const unit =
    typeof item.price === "number"
      ? item.price
      : typeof item.product?.price === "number"
        ? item.product.price
        : 0;
  const fs = item.flash_sale;
  if (!fs || fs.status !== "active") return unit;
  if (fs.expiredIn) {
    const end = new Date(fs.expiredIn).getTime();
    if (!Number.isNaN(end) && Date.now() > end) return unit;
  }
  const sale = computeDiscountedPrice(unit, fs.discount);
  return sale ?? unit;
}

export function cartItemLineTotal(item: IUserCartOrderItem): number {
  const qty = typeof item.quantity === "number" ? item.quantity : 0;
  return qty * cartItemUnitPrice(item);
}

export async function addProductToCart(payload: IAddProductToCartPayload) {
  return request.post<ApiEnvelope<Record<string, unknown>>>(
    api.userOrder,
    payload
  );
}

export async function fetchCartProducts(orderId: string): Promise<{
  items: UserProduct[];
  pagination: PaginationInfo | null;
}> {
  const res = await request.get<
    ApiEnvelope<{
      items: UserProduct[];
      pagination: PaginationInfo;
    }>
  >(api.userOrders, {
    params: { orderId },
  });

  const body = res.data;
  if (!body || !isOk(body.code)) return { items: [], pagination: null };

  const data = body.data as
    | {
        items?: UserProduct[];
        pagination?: PaginationInfo;
      }
    | undefined;

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    pagination: data?.pagination ?? null,
  };
}

export async function fetchUserCartOrderProducts(): Promise<{
  order: IUserCartOrder | null;
  items: IUserCartOrderItem[];
  pagination: PaginationInfo | null;
}> {
  const res = await request.get<
    ApiEnvelope<
      | IUserCartOrderItem[]
      | {
          order: IUserCartOrder;
          items: IUserCartOrderItem[];
          pagination: PaginationInfo;
        }
    >
  >(api.userCartOrder);

  const body = res.data;
  if (!body || !isOk(body.code)) {
    return { order: null, items: [], pagination: null };
  }

  const data = body.data as
    | IUserCartOrderItem[]
    | {
        order?: IUserCartOrder;
        items?: IUserCartOrderItem[];
        pagination?: PaginationInfo;
      }
    | undefined;

  if (Array.isArray(data)) {
    return { order: null, items: data, pagination: null };
  }

  return {
    order: data?.order ?? null,
    items: Array.isArray(data?.items) ? data.items : [],
    pagination: data?.pagination ?? null,
  };
}

export async function fetchUserOrders(): Promise<IUserOrdersData> {
  const res = await request.get<
    ApiEnvelope<{
      items?: IUserOrderWithItems[];
      pagination?: PaginationInfo;
    }>
  >(api.userOrders);

  const body = res.data;
  if (!body || !isOk(body.code)) {
    return { items: [], pagination: null };
  }

  const data = body.data as
    | {
        items?: IUserOrderWithItems[];
        pagination?: PaginationInfo;
      }
    | undefined;

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    pagination: data?.pagination ?? null,
  };
}

export async function fetchUserOrderStatus(
  orderId: string
): Promise<IUserOrderStatus | null> {
  const res = await request.get<ApiEnvelope<IUserOrderStatus>>(
    `${api.userOrders}/status`,
    {
      params: { orderId },
    }
  );

  const body = res.data;
  if (!body || !isOk(body.code) || !body.data) return null;
  return body.data;
}

export interface ICancelUserOrderPayload {
  orderId: string;
  reason: string;
}

export interface ICancelUserOrderResult {
  orderId: string;
  status: string;
  reason: string;
}

/**
 * POST /v1/user/cancel-order — body: { orderId, reason }
 */
export async function cancelUserOrder(payload: ICancelUserOrderPayload) {
  return request.post<ApiEnvelope<ICancelUserOrderResult | null>>(
    api.userCancelOrder,
    {
      orderId: payload.orderId.trim(),
      reason: payload.reason.trim(),
    }
  );
}

export type CartQuantityAction = "increase" | "decrease";

export interface IUpdateCartProductQuantityPayload {
  action: CartQuantityAction;
  productId: string;
}

export interface IUpdateCartProductQuantityResult {
  order: IUserCartOrder | null;
  order_item: IUserCartOrderItem | null;
  previousQuantity: number;
  quantity: number;
  action: CartQuantityAction;
}

/**
 * POST /v1/user/update-quantity-prod — body: { action, productId }
 */
export async function updateCartProductQuantity(
  payload: IUpdateCartProductQuantityPayload
) {
  return request.post<ApiEnvelope<IUpdateCartProductQuantityResult | null>>(
    api.userUpdateQuantityProd,
    {
      action: payload.action,
      productId: payload.productId.trim(),
    }
  );
}

export interface IRemoveProductFromCartPayload {
  productId: string;
}

export interface IRemoveProductFromCartResult {
  order: IUserCartOrder | null;
  removedProductId: string;
}

/**
 * DELETE /v1/user/cart-order — body: { productId }
 */
export async function removeProductFromCart(
  payload: IRemoveProductFromCartPayload
) {
  return request.delete<ApiEnvelope<IRemoveProductFromCartResult | null>>(
    api.userCartOrder,
    {
      data: { productId: payload.productId.trim() },
    }
  );
}
