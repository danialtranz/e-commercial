import "../../config/config";
import OpenAI from "openai";
import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { Op, Transaction } from "sequelize";
import sequelize from "../../config/postgres";
import {
  FlashSaleCampaignModel,
  ShopInfoModel,
  ProductModel,
  OrderItemModel,
  OrderModel,
  PaymentModel,
  ShipperAssignmentModel,
  ShipperInforModel,
  UserCreditModel,
  UserVoucherModel,
  VoucherModel,
  ConversationModel,
  MessageModel,
  PolicyModel,
} from "../../models/modal";
import { publishOrderCreated } from "../../kafka/producer";

export interface ListUserShopsQuery {
  page?: number;
  page_size?: number;
}

export interface ListUserVouchersQuery {
  page?: number;
  page_size?: number;
}

export async function listUserShops(query: ListUserShopsQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize =
    query.page_size && query.page_size > 0 ? query.page_size : 10;
  const offset = (page - 1) * pageSize;

  const { rows, count } = await ShopInfoModel.findAndCountAll({
    order: [["createdAt", "DESC"]],
    offset,
    limit: pageSize,
  });

  return {
    items: rows,
    pagination: {
      page,
      page_size: pageSize,
      total: count,
    },
  };
}

export async function listUserActiveVouchersByUserId(
  userId: string,
  query: ListUserVouchersQuery,
) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize =
    query.page_size && query.page_size > 0 ? query.page_size : 10;
  const offset = (page - 1) * pageSize;

  const { rows, count } = await UserVoucherModel.findAndCountAll({
    where: {
      userId,
      status: "active",
    },
    include: [
      {
        model: VoucherModel,
        as: "voucher",
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
    offset,
    limit: pageSize,
  });

  return {
    items: rows.map((row) => row.get({ plain: true })),
    pagination: {
      page,
      page_size: pageSize,
      total: count,
    },
  };
}

export async function getUserCreditDetailByUserId(userId: string) {
  const creditRow = await UserCreditModel.findOne({
    where: { userId },
    order: [["updatedAt", "DESC"]],
  });

  if (!creditRow) {
    return {
      code: 404,
      msg: "User credit record not found",
      data: null,
    };
  }

  return {
    code: 200,
    msg: "Get user credit successfully",
    data: creditRow.get({ plain: true }),
  };
}

export async function getUserProductById(productId: string) {
  const product = await ProductModel.findOne({
    where: { id: productId },
    include: [{ association: "category", required: false }],
  });

  if (!product) return null;

  const flashSaleCampaign = await FlashSaleCampaignModel.findOne({
    where: { productTargetId: product.id },
    order: [["updatedAt", "DESC"]],
  });

  return {
    ...product.get({ plain: true }),
    flash_sale_campaign: flashSaleCampaign
      ? flashSaleCampaign.get({ plain: true })
      : null,
  };
}

export interface ListUserShopProductsQuery {
  page?: number;
  page_size?: number;
}

export async function listUserProductsByShop(
  shopId: string,
  query: ListUserShopProductsQuery,
) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize =
    query.page_size && query.page_size > 0 ? query.page_size : 10;
  const offset = (page - 1) * pageSize;

  const { rows, count } = await ProductModel.findAndCountAll({
    where: { shopId },
    include: [{ association: "category", required: false }],
    order: [["createdAt", "DESC"]],
    offset,
    limit: pageSize,
  });

  const productIds = rows
    .map((row) => row.id)
    .filter((id): id is string => typeof id === "string" && id.trim() !== "");

  const flashSaleCampaigns =
    productIds.length > 0
      ? await FlashSaleCampaignModel.findAll({
          where: { productTargetId: { [Op.in]: productIds } },
          order: [["updatedAt", "DESC"]],
        })
      : [];

  const flashSaleByProductId = new Map<string, unknown>();
  for (const campaign of flashSaleCampaigns) {
    const pid = campaign.productTargetId;
    if (!pid || flashSaleByProductId.has(pid)) continue;
    flashSaleByProductId.set(pid, campaign.get({ plain: true }));
  }

  const items = rows.map((row) => {
    const plain = row.get({ plain: true });
    return {
      ...plain,
      flash_sale_campaign: flashSaleByProductId.get(row.id) ?? null,
    };
  });

  /** SP có flash sale lên trước; thứ tự `createdAt` trong từng nhóm giữ nguyên. */
  items.sort((a, b) => {
    const aHasFlash = a.flash_sale_campaign != null ? 0 : 1;
    const bHasFlash = b.flash_sale_campaign != null ? 0 : 1;
    return aHasFlash - bHasFlash;
  });

  return {
    items,
    pagination: {
      page,
      page_size: pageSize,
      total: count,
    },
  };
}

const CART_STATUS = "cart";
const CHECKOUT_ORDER_STATUS = "order";

/** Đơn hiển thị sau khi tạo đơn / checkout (không gồm giỏ `cart`). */
const USER_VISIBLE_ORDER_STATUSES: string[] = [
  CHECKOUT_ORDER_STATUS,
  "paid",
  "processing",
  "shipping",
];

/** Khu vực giao hàng khi checkout (5 vùng). */
const CHECKOUT_DELIVERY_ZONES = ["I1", "I2", "I3", "I4", "I5"] as const;
export type CheckoutDeliveryZone = (typeof CHECKOUT_DELIVERY_ZONES)[number];

export function isCheckoutDeliveryZone(z: string): z is CheckoutDeliveryZone {
  return (CHECKOUT_DELIVERY_ZONES as readonly string[]).includes(z);
}

export interface CheckoutOrderItemInput {
  productId: string;
  quantity: number;
}

function mergeItemQuantities(items: CheckoutOrderItemInput[]) {
  const merged = new Map<string, number>();
  for (const row of items) {
    const pid = row.productId.trim();
    const q = Number(row.quantity);
    merged.set(pid, (merged.get(pid) ?? 0) + q);
  }
  return merged;
}

async function buildCheckoutResponse(
  orderId: string,
  transaction?: Transaction,
) {
  const order = await OrderModel.findByPk(orderId, { transaction });
  if (!order) {
    return null;
  }

  const orderItems = await OrderItemModel.findAll({
    where: { orderId },
    order: [["createdAt", "DESC"]],
    transaction,
  });

  const productIds = orderItems
    .map((item) => item.productId)
    .filter((id): id is string => typeof id === "string" && id.trim() !== "");

  const products =
    productIds.length > 0
      ? await ProductModel.findAll({
          where: { id: { [Op.in]: productIds } },
          transaction,
        })
      : [];

  const productMap = new Map(products.map((p) => [p.id, p]));

  const items = orderItems.map((item) => {
    const plain = item.toJSON();
    const pid = item.productId;
    return {
      ...plain,
      product:
        pid && productMap.has(pid)
          ? {
              id: productMap.get(pid)!.id,
              name: productMap.get(pid)!.name,
              description: productMap.get(pid)!.description,
              price: productMap.get(pid)!.price,
              image: productMap.get(pid)!.image,
            }
          : null,
    };
  });

  return { order: order.toJSON(), items };
}

/** Body `items[]`: create `orders` row with status `order` and matching `order_items` (payment prep). */
export async function createCheckoutOrderFromItems(
  userId: string,
  items: CheckoutOrderItemInput[],
) {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      code: 400,
      msg: "items must be a non-empty array",
      data: null,
    };
  }

  for (const row of items) {
    if (
      typeof row?.productId !== "string" ||
      row.productId.trim() === "" ||
      row.productId === "null"
    ) {
      return {
        code: 400,
        msg: "Each item requires a valid productId",
        data: null,
      };
    }
    const q = Number(row.quantity);
    if (!Number.isInteger(q) || q <= 0) {
      return {
        code: 400,
        msg: "Each item requires a positive integer quantity",
        data: null,
      };
    }
  }

  const merged = mergeItemQuantities(items);
  const uniqueIds = [...merged.keys()];

  return sequelize.transaction(async (transaction) => {
    const products = await ProductModel.findAll({
      where: { id: { [Op.in]: uniqueIds } },
      transaction,
    });
    const foundIds = new Set(products.map((p) => p.id));
    const missing = uniqueIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      return {
        code: 404,
        msg: `Product(s) not found: ${missing.join(", ")}`,
        data: null,
      };
    }

    for (const p of products) {
      const qty = merged.get(p.id)!;
      const stock = p.stock;
      if (stock != null && stock < qty) {
        return {
          code: 400,
          msg: `Insufficient stock for product  (${p.name ?? ""}). Available: ${stock}, requested: ${qty}`,
          data: null,
        };
      }
    }

    const totalPrice = products.reduce((sum, p) => {
      const qty = merged.get(p.id)!;
      const price = p.price ?? 0;
      return sum + price * qty;
    }, 0);

    const orderId = uuidv4();
    await OrderModel.create(
      {
        id: orderId,
        userId,
        totalPrice,
        address: null,
        note: null,
        status: CHECKOUT_ORDER_STATUS,
      },
      { transaction },
    );

    for (const p of products) {
      const qty = merged.get(p.id)!;
      await OrderItemModel.create(
        {
          id: uuidv4(),
          orderId,
          productId: p.id,
          quantity: qty,
          price: p.price ?? 0,
          status: "active",
        },
        { transaction },
      );
    }

    const data = await buildCheckoutResponse(orderId, transaction);
    if (!data) {
      throw new Error("Failed to load order after create");
    }

    return {
      code: 200,
      msg: "Checkout order created successfully",
      data,
    };
  });
}

/** Checkout from current cart: new `order` row + `order_items` copied from cart lines. */
export async function createCheckoutOrderFromCart(userId: string) {
  return sequelize.transaction(async (transaction) => {
    const cartOrder = await OrderModel.findOne({
      where: { userId, status: CART_STATUS },
      order: [["createdAt", "DESC"]],
      transaction,
    });

    if (!cartOrder) {
      return {
        code: 404,
        msg: "Cart order not found",
        data: null,
      };
    }

    const cartItems = await OrderItemModel.findAll({
      where: { orderId: cartOrder.id },
      transaction,
    });

    if (cartItems.length === 0) {
      return {
        code: 400,
        msg: "Cart is empty",
        data: null,
      };
    }

    const productIds = cartItems
      .map((i) => i.productId)
      .filter((id): id is string => typeof id === "string" && id.trim() !== "");

    const products = await ProductModel.findAll({
      where: { id: { [Op.in]: productIds } },
      transaction,
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const line of cartItems) {
      const pid = line.productId;
      if (!pid) continue;
      const p = productMap.get(pid);
      if (!p) {
        return {
          code: 404,
          msg: `Product not found for cart line: ${pid}`,
          data: null,
        };
      }
      const qty = line.quantity ?? 0;
      const stock = p.stock;
      if (stock != null && stock < qty) {
        return {
          code: 400,
          msg: `Insufficient stock for product  (${p.name ?? ""}). Available: ${stock}, in cart: ${qty}`,
          data: null,
        };
      }
    }

    let totalPrice = 0;
    for (const line of cartItems) {
      const pid = line.productId;
      if (!pid) continue;
      const p = productMap.get(pid)!;
      const qty = line.quantity ?? 0;
      const price = p.price ?? line.price ?? 0;
      totalPrice += price * qty;
    }

    const orderId = uuidv4();
    await OrderModel.create(
      {
        id: orderId,
        userId,
        totalPrice,
        address: null,
        note: null,
        status: CHECKOUT_ORDER_STATUS,
      },
      { transaction },
    );

    for (const line of cartItems) {
      const pid = line.productId;
      if (!pid) continue;
      const p = productMap.get(pid)!;
      const qty = line.quantity ?? 0;
      const price = p.price ?? line.price ?? 0;
      await OrderItemModel.create(
        {
          id: uuidv4(),
          orderId,
          productId: pid,
          quantity: qty,
          price,
          status: "active",
        },
        { transaction },
      );
    }

    const data = await buildCheckoutResponse(orderId, transaction);
    if (!data) {
      throw new Error("Failed to load order after create");
    }

    return {
      code: 200,
      msg: "Checkout order created from cart successfully",
      data,
    };
  });
}

/**
 * POST /user/checkout
 * - method: COD → payment_method cod, status waiting; MOMO → momo, success (DONE).
 * - delivery_target: I1…I5; chọn shipper đầu tiên (shipper_infor) trong zone.
 * - voucher_id: null bỏ qua; có id thì áp discount từ bảng vouchers (chỉ active), rồi mark used.
 * - Flash sale: đọc `order_items`, khớp `flash_sale_campaigns`; trừ giá theo remain vs quantity.
 */
export interface UserCheckoutPaymentPayload {
  orderId: string;
  method: string;
  delivery_target: string;
  voucher_id?: string | null;
}

/** @deprecated Dùng UserCheckoutPaymentPayload — giữ tên hàm để không đổi import */
export type CheckoutPaymentPayload = UserCheckoutPaymentPayload;

/** Đơn giá sau % giảm flash sale (cùng công thức FE `computeDiscountedPrice`). */
function flashSaleDiscountedUnitPrice(
  unitPrice: number,
  discountPercent: number | null | undefined,
): number {
  const price = Math.max(0, unitPrice);
  const d = discountPercent ?? 0;
  if (d <= 0 || d >= 100) return price;
  return Math.round((price * (100 - d)) / 100);
}

function isFlashSaleCampaignExpired(
  expiredIn: Date | null | undefined,
  now = new Date(),
): boolean {
  if (!expiredIn) return false;
  return now.getTime() > expiredIn.getTime();
}

type CheckoutFlashSaleLineResult = {
  productId: string;
  quantity: number;
  originalLineTotal: number;
  lineTotalAfterFlash: number;
  flashSaleDiscount: number;
  flashUnits: number;
  regularUnits: number;
  campaignId: string;
};

/**
 * Áp flash sale theo `order_items`: gộp theo productId, cập nhật `remain_quantity` / `status`.
 * remain < qty → một phần giá sale; remain === qty → toàn bộ sale + inactive;
 * remain > qty → toàn bộ qty sale, trừ remain.
 */
async function computeCheckoutFlashSaleOrderSubtotal(
  orderItems: InstanceType<typeof OrderItemModel>[],
  transaction: Transaction,
): Promise<{
  orderSubtotal: number;
  originalSubtotal: number;
  flashSaleDiscount: number;
  applied: CheckoutFlashSaleLineResult[];
}> {
  const byProduct = new Map<
    string,
    { quantity: number; originalLineTotal: number }
  >();
  let orderSubtotal = 0;
  let originalSubtotal = 0;
  const applied: CheckoutFlashSaleLineResult[] = [];

  for (const item of orderItems) {
    const qty = Math.max(0, item.quantity ?? 0);
    const price = Math.max(0, item.price ?? 0);
    const lineTotal = price * qty;
    originalSubtotal += lineTotal;

    const pid = item.productId?.trim();
    if (!pid) {
      orderSubtotal += lineTotal;
      continue;
    }

    const agg = byProduct.get(pid) ?? { quantity: 0, originalLineTotal: 0 };
    agg.quantity += qty;
    agg.originalLineTotal += lineTotal;
    byProduct.set(pid, agg);
  }

  for (const [productId, agg] of byProduct) {
    const qty = agg.quantity;
    const originalLineTotal = agg.originalLineTotal;

    if (qty <= 0) {
      orderSubtotal += originalLineTotal;
      continue;
    }

    const campaign = await FlashSaleCampaignModel.findOne({
      where: { productTargetId: productId },
      order: [["updatedAt", "DESC"]],
      transaction,
      lock: true,
    });

    if (!campaign) {
      orderSubtotal += originalLineTotal;
      continue;
    }

    if ((campaign.status ?? "").toLowerCase() !== "active") {
      orderSubtotal += originalLineTotal;
      continue;
    }

    if (isFlashSaleCampaignExpired(campaign.expiredIn)) {
      await campaign.update({ status: "inactive" }, { transaction });
      orderSubtotal += originalLineTotal;
      continue;
    }

    const remain = Math.max(0, campaign.remainQuantity ?? 0);
    const unitPrice = originalLineTotal / qty;
    const discountPct = campaign.discount ?? 0;
    const saleUnit = flashSaleDiscountedUnitPrice(unitPrice, discountPct);

    let lineTotalAfterFlash = originalLineTotal;
    let flashUnits = 0;
    let regularUnits = qty;
    let newRemain = remain;
    let newStatus: string | undefined;

    if (remain < qty) {
      flashUnits = remain;
      regularUnits = qty - remain;
      lineTotalAfterFlash =
        flashUnits * saleUnit + regularUnits * unitPrice;
      newRemain = 0;
    } else if (remain === qty) {
      flashUnits = qty;
      regularUnits = 0;
      lineTotalAfterFlash = qty * saleUnit;
      newRemain = 0;
      newStatus = "inactive";
    } else {
      flashUnits = qty;
      regularUnits = 0;
      lineTotalAfterFlash = qty * saleUnit;
      newRemain = remain - qty;
    }

    lineTotalAfterFlash = Math.round(lineTotalAfterFlash);
    const lineFlashDiscount = Math.max(
      0,
      Math.round(originalLineTotal) - lineTotalAfterFlash,
    );

    const updatePayload: {
      remainQuantity: number;
      status?: string;
    } = { remainQuantity: newRemain };
    if (newStatus) updatePayload.status = newStatus;
    await campaign.update(updatePayload, { transaction });

    orderSubtotal += lineTotalAfterFlash;
    if (lineFlashDiscount > 0) {
      applied.push({
        productId,
        quantity: qty,
        originalLineTotal: Math.round(originalLineTotal),
        lineTotalAfterFlash,
        flashSaleDiscount: lineFlashDiscount,
        flashUnits,
        regularUnits,
        campaignId: campaign.id,
      });
    }
  }

  return {
    orderSubtotal: Math.round(orderSubtotal),
    originalSubtotal: Math.round(originalSubtotal),
    flashSaleDiscount: Math.max(
      0,
      Math.round(originalSubtotal) - Math.round(orderSubtotal),
    ),
    applied,
  };
}

/** Ghi nhận thanh toán, gán shipper, áp voucher; đơn phải đang status `order`. */
export async function checkoutCreatePayment(
  userId: string,
  payload: UserCheckoutPaymentPayload,
) {
  const orderId = payload.orderId?.trim();
  const methodRaw = payload.method?.trim();
  const deliveryTargetRaw = payload.delivery_target?.trim();
  const voucherIdRaw = payload.voucher_id;

  if (!orderId || orderId === "null") {
    return { code: 400, msg: "orderId is required", data: null };
  }
  if (!methodRaw) {
    return { code: 400, msg: "method is required (COD or MOMO)", data: null };
  }
  if (!deliveryTargetRaw) {
    return { code: 400, msg: "delivery_target is required", data: null };
  }

  const methodUpper = methodRaw.toUpperCase();
  if (methodUpper !== "COD" && methodUpper !== "MOMO") {
    return { code: 400, msg: "method must be COD or MOMO", data: null };
  }

  if (!isCheckoutDeliveryZone(deliveryTargetRaw)) {
    return {
      code: 400,
      msg: "delivery_target must be one of: I1, I2, I3, I4, I5",
      data: null,
    };
  }

  let voucherId: string | null = null;
  if (voucherIdRaw != null && voucherIdRaw !== "") {
    if (typeof voucherIdRaw !== "string" || !voucherIdRaw.trim()) {
      return {
        code: 400,
        msg: "voucher_id must be a non-empty string when provided",
        data: null,
      };
    }
    voucherId = voucherIdRaw.trim();
  }

  const paymentMethodDb = methodUpper === "COD" ? "cod" : "momo";
  const paymentStatusDb = methodUpper === "COD" ? "waiting" : "success";
  const orderStatusAfter = methodUpper === "COD" ? "processing" : "paid";

  const result = await sequelize.transaction(async (transaction) => {
    const order = await OrderModel.findOne({
      where: { id: orderId, userId },
      transaction,
      lock: true,
    });

    if (!order) {
      return {
        code: 404,
        msg: "Order not found",
        data: null,
      };
    }

    if (order.status !== CHECKOUT_ORDER_STATUS) {
      return {
        code: 400,
        msg: "Order cannot be checked out (status must be order)",
        data: null,
      };
    }

    const existingPay = await PaymentModel.findOne({
      where: { orderId },
      transaction,
      lock: true,
    });
    if (existingPay) {
      return {
        code: 400,
        msg: "Payment already exists for this order",
        data: null,
      };
    }

    const existingAssign = await ShipperAssignmentModel.findOne({
      where: { orderId },
      transaction,
    });
    if (existingAssign) {
      return {
        code: 400,
        msg: "Shipper assignment already exists for this order",
        data: null,
      };
    }

    const orderItems = await OrderItemModel.findAll({
      where: { orderId },
      transaction,
      lock: true,
    });

    const flashSaleTotals = await computeCheckoutFlashSaleOrderSubtotal(
      orderItems,
      transaction,
    );

    const baseTotal = order.totalPrice ?? 0;
    const subtotalAfterFlashSale = flashSaleTotals.orderSubtotal;
    const flashSaleDiscount = flashSaleTotals.flashSaleDiscount;
    let discountApplied = 0;
    let voucherRow: InstanceType<typeof VoucherModel> | null = null;
    let userVoucherRow: InstanceType<typeof UserVoucherModel> | null = null;

    if (voucherId) {
      voucherRow = await VoucherModel.findByPk(voucherId, {
        transaction,
        lock: true,
      });
      if (!voucherRow) {
        return { code: 404, msg: "Voucher not found", data: null };
      }

      userVoucherRow = await UserVoucherModel.findOne({
        where: {
          userId,
          voucherId,
          status: "active",
        },
        transaction,
        lock: true,
      });
      if (!userVoucherRow) {
        return {
          code: 403,
          msg: "You do not have an active user voucher for this code",
          data: null,
        };
      }

      discountApplied = Math.max(0, voucherRow.discount ?? 0);
    }

    const finalAmount = Math.max(
      0,
      subtotalAfterFlashSale - discountApplied,
    );

    const shipperInfor = await ShipperInforModel.findOne({
      where: {
        shipperZone: deliveryTargetRaw,
        status: "active",
        shipperId: { [Op.ne]: null },
      },
      order: [["createdAt", "ASC"]],
      transaction,
    });

    if (!shipperInfor?.shipperId) {
      return {
        code: 404,
        msg: `No active shipper available for delivery zone ${deliveryTargetRaw}`,
        data: null,
      };
    }

    const payment = await PaymentModel.create(
      {
        id: uuidv4(),
        orderId: order.id,
        method: paymentMethodDb,
        amount: finalAmount,
        status: paymentStatusDb,
      },
      { transaction },
    );

    if (userVoucherRow) {
      await userVoucherRow.update({ status: "used" }, { transaction });
    }

    const now = new Date();
    const assignment = await ShipperAssignmentModel.create(
      {
        id: uuidv4(),
        orderId: order.id,
        deliveryAddress: deliveryTargetRaw,
        deliveryStatus: "assigned",
        userId: shipperInfor.shipperId,
        codAmount: methodUpper === "COD" ? finalAmount : null,
        assignedAt: now,
        pickedUpAt: null,
        deliveredAt: null,
      },
      { transaction },
    );

    await order.update(
      { status: orderStatusAfter, totalPrice: subtotalAfterFlashSale },
      { transaction },
    );

    return {
      code: 200,
      msg: "Checkout completed successfully",
      data: {
        order: order.get({ plain: true }),
        payment: payment.get({ plain: true }),
        payment_summary: {
          payment_method: methodUpper,
          payment_status: methodUpper === "COD" ? "waiting" : "DONE",
        },
        amounts: {
          order_total_price: baseTotal,
          subtotal_after_flash_sale: subtotalAfterFlashSale,
          flash_sale_discount: flashSaleDiscount,
          voucher_discount: discountApplied,
          discount: flashSaleDiscount + discountApplied,
          amount_to_pay: finalAmount,
        },
        flash_sale: {
          applied: flashSaleTotals.applied,
        },
        voucher:
          voucherRow && userVoucherRow
            ? {
                id: voucherRow.id,
                user_voucher_id: userVoucherRow.id,
                status: "used" as const,
              }
            : null,
        shipper_assignment: assignment.get({ plain: true }),
      },
    };
  });

  if (result.code === 200 && result.data) {
    publishOrderCreated({
      orderId,
      userId,
      totalPrice: result.data.amounts.amount_to_pay,
      paymentMethod: paymentMethodDb,
      status: orderStatusAfter,
    }).catch((err) => console.error("Kafka publish failed:", err));
  }

  return result;
}

/**
 * Đổi điểm lấy quyền dùng voucher: chi phí điểm = ceil(discount / 2) từ bảng vouchers.
 */
export async function claimVoucherWithUserCredit(
  userId: string,
  voucherIdRaw: string,
) {
  const voucherId = voucherIdRaw?.trim();
  if (!voucherId || voucherId === "null") {
    return { code: 400, msg: "voucherId is required", data: null };
  }

  return sequelize.transaction(async (transaction) => {
    const voucher = await VoucherModel.findByPk(voucherId, {
      transaction,
      lock: true,
    });
    if (!voucher) {
      return { code: 404, msg: "Voucher not found", data: null };
    }
    if ((voucher.status ?? "").toLowerCase() !== "active") {
      return {
        code: 400,
        msg: "Voucher is not available for claim",
        data: null,
      };
    }

    const discount = voucher.discount ?? 0;
    const costCredits = Math.ceil(discount / 2);

    const creditRow = await UserCreditModel.findOne({
      where: { userId },
      order: [["updatedAt", "DESC"]],
      transaction,
      lock: true,
    });
    if (!creditRow) {
      return {
        code: 404,
        msg: "User credit record not found",
        data: null,
      };
    }

    const totalCredit = creditRow.totalCredit ?? 0;
    const usedCredit = creditRow.usedCredit ?? 0;

    if (totalCredit < costCredits) {
      return {
        code: 400,
        msg: "Insufficient credit points",
        data: {
          required_credit: costCredits,
          current_total_credit: totalCredit,
        },
      };
    }

    const existingClaim = await UserVoucherModel.findOne({
      where: {
        userId,
        voucherId,
        status: "active",
      },
      transaction,
    });
    if (existingClaim) {
      return {
        code: 400,
        msg: "You already have an active claim for this voucher",
        data: null,
      };
    }

    await creditRow.update(
      {
        totalCredit: totalCredit - costCredits,
        usedCredit: usedCredit + costCredits,
      },
      { transaction },
    );

    await creditRow.reload({ transaction });

    const userVoucher = await UserVoucherModel.create(
      {
        id: uuidv4(),
        userId,
        voucherId,
        status: "active",
      },
      { transaction },
    );

    return {
      code: 200,
      msg: "Voucher claimed successfully",
      data: {
        user_voucher: userVoucher.get({ plain: true }),
        credit: creditRow.get({ plain: true }),
        cost_credits: costCredits,
        voucher: {
          id: voucher.id,
          name: voucher.name,
          discount: voucher.discount,
        },
      },
    };
  });
}

export interface AddProductToCartPayload {
  userId: string;
  productId: string;
  quantity: number;
}

export async function addProductToDefaultUserCart(
  payload: AddProductToCartPayload,
) {
  return sequelize.transaction(async (transaction) => {
    const product = await ProductModel.findByPk(payload.productId, {
      transaction,
    });
    if (!product) {
      return { code: 404, msg: "Product not found", data: null };
    }

    let order = await OrderModel.findOne({
      where: { userId: payload.userId, status: CART_STATUS },
      transaction,
    });

    if (!order) {
      order = await OrderModel.create(
        {
          id: uuidv4(),
          userId: payload.userId,
          totalPrice: 0,
          address: null,
          note: null,
          status: CART_STATUS,
        },
        { transaction },
      );
    }

    let orderItem = await OrderItemModel.findOne({
      where: { orderId: order.id, productId: payload.productId },
      transaction,
    });

    const currentQuantity = orderItem?.quantity ?? 0;
    const nextQuantity = currentQuantity + payload.quantity;
    const productPrice = product.price ?? 0;

    if (!orderItem) {
      orderItem = await OrderItemModel.create(
        {
          id: uuidv4(),
          orderId: order.id,
          productId: payload.productId,
          quantity: payload.quantity,
          price: productPrice,
          status: "active",
        },
        { transaction },
      );
    } else {
      await OrderItemModel.update(
        { quantity: nextQuantity, price: productPrice },
        { where: { id: orderItem.id }, transaction },
      );
      orderItem = await OrderItemModel.findByPk(orderItem.id, { transaction });
    }

    const allItems = await OrderItemModel.findAll({
      where: { orderId: order.id },
      transaction,
    });
    const totalPrice = allItems.reduce((sum, item) => {
      const itemPrice = item.price ?? 0;
      const itemQuantity = item.quantity ?? 0;
      return sum + itemPrice * itemQuantity;
    }, 0);

    await OrderModel.update(
      { totalPrice },
      { where: { id: order.id }, transaction },
    );

    const latestOrder = await OrderModel.findByPk(order.id, { transaction });

    return {
      code: 200,
      msg: "Add product to cart successfully",
      data: {
        order: latestOrder,
        order_item: orderItem,
      },
    };
  });
}

export async function getUserOrderItemsWithProduct(
  userId: string,
  orderId: string,
) {
  const order = await OrderModel.findOne({
    where: { id: orderId, userId },
  });

  if (!order) {
    return {
      code: 404,
      msg: "Order not found",
      data: null,
    };
  }

  return buildOrderItemsResponse(order);
}

export async function getUserCartOrderItemsWithProduct(userId: string) {
  const cartOrder = await OrderModel.findOne({
    where: { userId, status: CART_STATUS },
    order: [["createdAt", "DESC"]],
  });

  if (!cartOrder) {
    return {
      code: 404,
      msg: "Cart order not found",
      data: null,
    };
  }

  return buildOrderItemsResponse(cartOrder);
}

async function buildOrderItemsResponse(order: any) {
  const orderId = order.id;
  const orderItems = await OrderItemModel.findAll({
    where: { orderId },
    order: [["createdAt", "DESC"]],
  });

  const productIds = orderItems
    .map((item) => item.productId)
    .filter((id): id is string => typeof id === "string" && id.trim() !== "");

  const products =
    productIds.length > 0
      ? await ProductModel.findAll({
          where: { id: { [Op.in]: productIds } },
        })
      : [];

  const flashSaleCampaigns =
    productIds.length > 0
      ? await FlashSaleCampaignModel.findAll({
          where: { productTargetId: { [Op.in]: productIds } },
          order: [["updatedAt", "DESC"]],
        })
      : [];

  const productMap = new Map(products.map((product) => [product.id, product]));
  const flashSaleByProductId = new Map<
    string,
    ReturnType<InstanceType<typeof FlashSaleCampaignModel>["get"]>
  >();
  for (const campaign of flashSaleCampaigns) {
    const pid = campaign.productTargetId;
    if (!pid || flashSaleByProductId.has(pid)) continue;
    flashSaleByProductId.set(pid, campaign.get({ plain: true }));
  }

  const items = orderItems.map((item) => {
    const plainItem = item.toJSON();
    const pid = item.productId;
    const productRow = pid ? productMap.get(pid) : undefined;
    return {
      ...plainItem,
      product: productRow ? productRow.get({ plain: true }) : null,
      flash_sale: pid ? (flashSaleByProductId.get(pid) ?? null) : null,
    };
  });

  return {
    code: 200,
    msg: "Get order items successfully",
    data: {
      order,
      items,
    },
  };
}

export type CartQuantityAction = "increase" | "decrease";

export interface UpdateCartProductQuantityPayload {
  userId: string;
  productId: string;
  action: CartQuantityAction;
}

/** Tăng/giảm quantity 1 đơn vị cho sản phẩm trong giỏ (order status `cart`). */
export async function updateCartProductQuantity(
  payload: UpdateCartProductQuantityPayload,
) {
  return sequelize.transaction(async (transaction) => {
    const cartOrder = await OrderModel.findOne({
      where: { userId: payload.userId, status: CART_STATUS },
      order: [["createdAt", "DESC"]],
      transaction,
    });

    if (!cartOrder) {
      return {
        code: 404,
        msg: "Cart order not found",
        data: null,
      };
    }

    const orderItem = await OrderItemModel.findOne({
      where: { orderId: cartOrder.id, productId: payload.productId },
      transaction,
    });

    if (!orderItem) {
      return {
        code: 404,
        msg: "Product not in cart",
        data: null,
      };
    }

    const currentQuantity = orderItem.quantity ?? 0;

    if (payload.action === "decrease") {
      if (currentQuantity <= 1) {
        return {
          code: 400,
          msg: "Không thể giảm số lượng nữa, số lượng tối thiểu là 1",
          data: { quantity: currentQuantity, productId: payload.productId },
        };
      }
    }

    const nextQuantity =
      payload.action === "increase" ? currentQuantity + 1 : currentQuantity - 1;

    await OrderItemModel.update(
      { quantity: nextQuantity },
      { where: { id: orderItem.id }, transaction },
    );

    const allItems = await OrderItemModel.findAll({
      where: { orderId: cartOrder.id },
      transaction,
    });
    const totalPrice = allItems.reduce((sum, item) => {
      const itemPrice = item.price ?? 0;
      const itemQuantity = item.quantity ?? 0;
      return sum + itemPrice * itemQuantity;
    }, 0);

    await OrderModel.update(
      { totalPrice },
      { where: { id: cartOrder.id }, transaction },
    );

    const latestOrderItem = await OrderItemModel.findByPk(orderItem.id, {
      transaction,
    });
    const latestOrder = await OrderModel.findByPk(cartOrder.id, {
      transaction,
    });

    return {
      code: 200,
      msg: "Update cart quantity successfully",
      data: {
        order: latestOrder,
        order_item: latestOrderItem,
        previousQuantity: currentQuantity,
        quantity: nextQuantity,
        action: payload.action,
      },
    };
  });
}

export async function removeProductFromUserCart(
  userId: string,
  productId: string,
) {
  return sequelize.transaction(async (transaction) => {
    const cartOrder = await OrderModel.findOne({
      where: { userId, status: CART_STATUS },
      order: [["createdAt", "DESC"]],
      transaction,
    });

    if (!cartOrder) {
      return {
        code: 404,
        msg: "Cart order not found",
        data: null,
      };
    }

    const orderItem = await OrderItemModel.findOne({
      where: { orderId: cartOrder.id, productId },
      transaction,
    });

    if (!orderItem) {
      return {
        code: 404,
        msg: "Product not in cart",
        data: null,
      };
    }

    await OrderItemModel.destroy({
      where: { id: orderItem.id },
      transaction,
    });

    const remainingItems = await OrderItemModel.findAll({
      where: { orderId: cartOrder.id },
      transaction,
    });
    const totalPrice = remainingItems.reduce((sum, item) => {
      const itemPrice = item.price ?? 0;
      const itemQuantity = item.quantity ?? 0;
      return sum + itemPrice * itemQuantity;
    }, 0);

    await OrderModel.update(
      { totalPrice },
      { where: { id: cartOrder.id }, transaction },
    );

    const latestOrder = await OrderModel.findByPk(cartOrder.id, {
      transaction,
    });

    return {
      code: 200,
      msg: "Removed product from cart successfully",
      data: {
        order: latestOrder,
        removedProductId: productId,
      },
    };
  });
}

export async function getUserCheckoutOrdersWithItems(
  userId: string,
  page: number,
  pageSize: number,
) {
  const currentPage = Number.isInteger(page) && page > 0 ? page : 1;
  const currentPageSize =
    Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 10;
  const offset = (currentPage - 1) * currentPageSize;

  const { rows: orders, count: total } = await OrderModel.findAndCountAll({
    where: { userId, status: { [Op.in]: USER_VISIBLE_ORDER_STATUSES } },
    order: [["createdAt", "DESC"]],
    offset,
    limit: currentPageSize,
  });

  if (orders.length === 0) {
    return {
      code: 200,
      msg: "Get user orders successfully",
      data: {
        items: [],
        pagination: {
          page: currentPage,
          page_size: currentPageSize,
          total,
        },
      },
    };
  }

  const orderIds = orders.map((order) => order.id);
  const orderItems = await OrderItemModel.findAll({
    where: { orderId: { [Op.in]: orderIds } },
    order: [["createdAt", "DESC"]],
  });

  const productIds = orderItems
    .map((item) => item.productId)
    .filter((id): id is string => typeof id === "string" && id.trim() !== "");
  const products =
    productIds.length > 0
      ? await ProductModel.findAll({ where: { id: { [Op.in]: productIds } } })
      : [];
  const productMap = new Map(products.map((product) => [product.id, product]));

  const orderItemMap = new Map<string, any[]>();
  for (const item of orderItems) {
    const oid = item.orderId;
    if (!oid) continue;
    const decorated = {
      ...item.toJSON(),
      product: item.productId ? (productMap.get(item.productId) ?? null) : null,
    };
    const bucket = orderItemMap.get(oid) ?? [];
    bucket.push(decorated);
    orderItemMap.set(oid, bucket);
  }

  const items = orders.map((order) => ({
    order,
    items: orderItemMap.get(order.id) ?? [],
  }));

  return {
    code: 200,
    msg: "Get user orders successfully",
    data: {
      items,
      pagination: {
        page: currentPage,
        page_size: currentPageSize,
        total,
      },
    },
  };
}

export async function getUserOrderPaymentStatus(
  userId: string,
  orderId: string,
) {
  const order = await OrderModel.findOne({
    where: { id: orderId, userId },
  });

  if (!order) {
    return {
      code: 404,
      msg: "Order not found",
      data: null,
    };
  }

  const latestPayment = await PaymentModel.findOne({
    where: { orderId: order.id },
    order: [["createdAt", "DESC"]],
  });

  const latestAssignment = await ShipperAssignmentModel.findOne({
    where: { orderId: order.id },
    order: [["updatedAt", "DESC"]],
  });

  return {
    code: 200,
    msg: "Get order status successfully",
    data: {
      orderId: order.id,
      orderStatus: order.status,
      paymentStatus: latestPayment?.status ?? null,
      paymentMethod: latestPayment?.method ?? null,
      paymentAmount: latestPayment?.amount ?? null,
      shippingStatus: latestAssignment?.deliveryStatus ?? null,
      delivery: latestAssignment
        ? {
            deliveryStatus: latestAssignment.deliveryStatus,
            assignedAt: latestAssignment.assignedAt,
            pickedUpAt: latestAssignment.pickedUpAt,
            deliveredAt: latestAssignment.deliveredAt,
            codAmount: latestAssignment.codAmount,
          }
        : null,
    },
  };
}

function pickLatestByOrderId<
  T extends { orderId: string | null; createdAt?: Date },
>(rows: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of rows) {
    const oid = row.orderId;
    if (!oid) continue;
    const prev = map.get(oid);
    if (!prev) {
      map.set(oid, row);
      continue;
    }
    const a = row.createdAt?.getTime() ?? 0;
    const b = prev.createdAt?.getTime() ?? 0;
    if (a > b) map.set(oid, row);
  }
  return map;
}

function pickLatestAssignmentByOrderId<
  T extends { orderId: string | null; updatedAt?: Date },
>(rows: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of rows) {
    const oid = row.orderId;
    if (!oid) continue;
    const prev = map.get(oid);
    if (!prev) {
      map.set(oid, row);
      continue;
    }
    const a = row.updatedAt?.getTime() ?? 0;
    const b = prev.updatedAt?.getTime() ?? 0;
    if (a > b) map.set(oid, row);
  }
  return map;
}

/**
 * Đơn đặt (status `order`): kèm thanh toán mới nhất theo orderId và giao hàng từ shipper_assignments.
 */
export async function listUserOrdersDeliveryStatus(
  userId: string,
  page: number,
  pageSize: number,
) {
  const currentPage = Number.isInteger(page) && page > 0 ? page : 1;
  const currentPageSize =
    Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 10;
  const offset = (currentPage - 1) * currentPageSize;

  const { rows: orders, count: total } = await OrderModel.findAndCountAll({
    where: { userId, status: { [Op.in]: USER_VISIBLE_ORDER_STATUSES } },
    order: [["createdAt", "DESC"]],
    offset,
    limit: currentPageSize,
  });

  if (orders.length === 0) {
    return {
      code: 200,
      msg: "Get delivery status successfully",
      data: {
        items: [],
        pagination: {
          page: currentPage,
          page_size: currentPageSize,
          total,
        },
      },
    };
  }

  const orderIds = orders.map((o) => o.id);

  const payments = await PaymentModel.findAll({
    where: { orderId: { [Op.in]: orderIds } },
    order: [["createdAt", "DESC"]],
  });
  const paymentByOrderId = pickLatestByOrderId(payments);

  const assignments = await ShipperAssignmentModel.findAll({
    where: { orderId: { [Op.in]: orderIds } },
    order: [["updatedAt", "DESC"]],
  });
  const assignmentByOrderId = pickLatestAssignmentByOrderId(assignments);

  const items = orders.map((order) => {
    const pay = paymentByOrderId.get(order.id);
    const ship = assignmentByOrderId.get(order.id);
    return {
      order: order.toJSON(),
      payment: pay
        ? {
            status: pay.status,
            method: pay.method,
            amount: pay.amount,
          }
        : null,
      delivery: ship
        ? {
            deliveryStatus: ship.deliveryStatus,
            deliveryAddress: ship.deliveryAddress,
            assignedAt: ship.assignedAt,
            pickedUpAt: ship.pickedUpAt,
            deliveredAt: ship.deliveredAt,
            codAmount: ship.codAmount,
            shipperUserId: ship.userId,
          }
        : null,
    };
  });

  return {
    code: 200,
    msg: "Get delivery status successfully",
    data: {
      items,
      pagination: {
        page: currentPage,
        page_size: currentPageSize,
        total,
      },
    },
  };
}

export async function getPolicyContentByShopId(
  shopId: string,
): Promise<string | null> {
  const row = await PolicyModel.findOne({
    where: { shopId },
    attributes: ["content"],
  });
  if (!row) return null;
  const text = row.content;
  if (text === null || String(text).trim() === "") return null;
  return String(text);
}

function buildSystemPrompt(policyContent: string): string {
  return [
    "Bạn là nhân viên chăm sóc khách hàng (CSKH) của một cửa hàng online.",
    "Chỉ trả lời dựa trên nội dung «Chính sách cửa hàng» bên dưới — không bịa, không suy diễn thêm.",
    "",
    "QUY TẮC BẮT BUỘC:",
    "1. Mỗi lần trả lời CHỈ 1 hoặc 2 câu ngắn, giọng lịch sự (ạ/dạ), như chat CSKH thật.",
    "2. Không spam: không liệt kê dài, không bullet/đánh số nhiều mục, không đoạn văn dài, không lặp ý.",
    "3. Chỉ xử lý câu hỏi liên quan chính sách cửa hàng (giao hàng, đổi trả, thanh toán, bảo hành, khuyến mãi, điều khoản trong policy, v.v.).",
    "4. Câu hỏi NGOÀI LỀ (thời tiết, tin tức, code/lập trình, toán, chuyện cá nhân, sản phẩm không có trong policy, so sánh đối thủ, v.v.): từ chối NGẮN GỌN 1 câu, nhắc chỉ hỗ trợ theo chính sách shop; KHÔNG trả lời nội dung ngoài lề.",
    "5. Nếu policy không đề cập: 1 câu nói chưa có quy định trong chính sách, gợi ý liên hệ shop/CSKH trực tiếp — không đoán.",
    "6. Trả lời bằng tiếng Việt (trừ khi khách hỏi bằng ngôn ngữ khác thì có thể trả cùng ngôn ngữ đó, vẫn giữ 1–2 câu).",
    "",
    "--- Chính sách cửa hàng ---",
    policyContent,
    "--- Hết chính sách cửa hàng ---",
  ].join("\n");
}

async function getNextMessageOrder(conversationId: string): Promise<number> {
  const last = await MessageModel.findOne({
    where: { conversationId },
    order: [["order", "DESC"]],
    attributes: ["order"],
  });
  return last ? last.order + 1 : 1;
}

/** ~1–2 câu tiếng Việt; giới hạn cứng để bot không spam dài. */
const POLICY_BOT_MAX_TOKENS = Number(
  process.env.OPENAI_POLICY_BOT_MAX_TOKENS ?? "60",
);

/**
 * Streams assistant tokens to `res` via res.write; returns the full assistant text for persistence.
 * OpenAI params: model, temperature, max_tokens, top_p, frequency_penalty, presence_penalty (+ stream).
 */
export async function streamPolicyBotAnswer(
  res: Response,
  userQuestion: string,
  policyContent: string,
): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });
  const systemPrompt = buildSystemPrompt(policyContent);

  const stream = await client.chat.completions.create({
    model: process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuestion },
    ],
    stream: true,
    temperature: 0.25,
    max_tokens: Number.isFinite(POLICY_BOT_MAX_TOKENS)
      ? Math.min(256, Math.max(60, POLICY_BOT_MAX_TOKENS))
      : 120,
    top_p: 0.9,
    frequency_penalty: 0.3,
    presence_penalty: 0.1,
  });

  let full = "";
  for await (const chunk of stream) {
    const piece = chunk.choices[0]?.delta?.content ?? "";
    if (piece) {
      full += piece;
      res.write(piece);
    }
  }
  return full;
}

export async function appendConversationMessage(params: {
  userId: string;
  shopId: string;
  userQuestion: string;
  botResponse: string;
}): Promise<void> {
  const { userId, shopId, userQuestion, botResponse } = params;

  const [conversation] = await ConversationModel.findOrCreate({
    where: { userId, shopId },
    defaults: {
      id: uuidv4(),
      userId,
      shopId,
      status: "active",
    },
  });

  const nextOrder = await getNextMessageOrder(conversation.id);

  await MessageModel.create({
    id: uuidv4(),
    conversationId: conversation.id,
    userQuestion,
    botResponse,
    order: nextOrder,
    status: "ok",
  });
}

export interface ConversationHistoryMessage {
  id: string;
  userQuestion: string | null;
  botResponse: string | null;
  order: number;
  status: string | null;
}

export async function getUserShopConversationHistory(
  userId: string,
  shopId: string,
): Promise<{
  conversationId: string | null;
  messages: ConversationHistoryMessage[];
}> {
  const conversation = await ConversationModel.findOne({
    where: { userId, shopId },
    attributes: ["id"],
  });

  if (!conversation) {
    return { conversationId: null, messages: [] };
  }

  const rows = await MessageModel.findAll({
    where: { conversationId: conversation.id },
    attributes: ["id", "userQuestion", "botResponse", "order", "status"],
    order: [["order", "ASC"]],
  });

  return {
    conversationId: conversation.id,
    messages: rows.map((m) => ({
      id: m.id,
      userQuestion: m.userQuestion,
      botResponse: m.botResponse,
      order: m.order,
      status: m.status,
    })),
  };
}

const ORDER_STATUS_PROCESSING = "processing";
const ORDER_STATUS_CANCEL = "cancel";
const DELIVERY_STATUS_ASSIGNED = "assigned";

export interface CancelUserOrderInput {
  orderId: string;
  reason: string;
}

/**
 * User hủy đơn vừa đặt: đơn phải thuộc user, status `processing`,
 * shipper_assignments.delivery_status phải là `assigned`.
 * Hủy: xóa assignment, cập nhật orders.status = `cancel`.
 */
export async function cancelUserOrder(
  userId: string,
  input: CancelUserOrderInput,
) {
  const orderId = input.orderId.trim();
  const reason = input.reason.trim();

  return sequelize.transaction(async (transaction) => {
    const order = await OrderModel.findOne({
      where: { id: orderId, userId },
      transaction,
      lock: true,
    });

    if (!order) {
      return {
        code: 404,
        msg: "Không tìm thấy đơn hàng hoặc đơn không thuộc về bạn",
        data: null,
      };
    }

    if (order.status !== ORDER_STATUS_PROCESSING) {
      return {
        code: 400,
        msg: "Chỉ có thể hủy đơn khi trạng thái đơn là processing",
        data: { orderId: order.id, currentStatus: order.status },
      };
    }

    const assignment = await ShipperAssignmentModel.findOne({
      where: { orderId },
      transaction,
      lock: true,
    });

    if (!assignment) {
      return {
        code: 400,
        msg: "Không tìm thấy thông tin giao hàng cho đơn này",
        data: null,
      };
    }

    if (assignment.deliveryStatus !== DELIVERY_STATUS_ASSIGNED) {
      return {
        code: 403,
        msg: "Bạn không thể hủy đơn khi đã giao hàng cho đơn vị vận chuyển",
        data: {
          orderId: order.id,
          deliveryStatus: assignment.deliveryStatus,
        },
      };
    }

    await assignment.destroy({ transaction });
    await order.update({ status: ORDER_STATUS_CANCEL }, { transaction });

    return {
      code: 200,
      msg: "Hủy đơn hàng thành công",
      data: {
        orderId: order.id,
        status: ORDER_STATUS_CANCEL,
        reason,
      },
    };
  });
}
