import { randomUUID } from "crypto";
import { Op, Transaction, col, literal, where } from "sequelize";
import sequelize from "../../config/postgres";
import {
  Advertisement,
  AdvertisementModel,
  CategoryModel,
  FlashSaleCampaign,
  FlashSaleCampaignModel,
  OrderItemModel,
  OrderModel,
  PaymentModel,
  PolicyModel,
  Product,
  ProductComment,
  ProductCommentModel,
  ProductModel,
  ShopInfoModel,
  StockDetail,
  StockDetailModel,
  UserModel,
  VoucherModel,
} from "../../models/modal";

export interface NestedCategoryInput {
  category_name?: string;
  category_description?: string;
  name?: string;
  description?: string;
}

export interface CreateShopProductInput {
  name?: string | null;
  description?: string | null;
  price?: number | null;
  stock?: number | null;
  image?: string | null;
  status?: string | null;
  categoryId?: string | null;
  category?: NestedCategoryInput | null;
}

export interface ListShopProductsQuery {
  page?: number;
  page_size?: number;
}

async function resolveCategoryId(
  shopId: string,
  input: CreateShopProductInput,
): Promise<{ ok: true; categoryId: string } | { ok: false; reason: string }> {
  const nested = input.category;
  const nestedName =
    nested &&
    (nested.category_name ?? nested.name) != null &&
    String(nested.category_name ?? nested.name).trim() !== ""
      ? String(nested.category_name ?? nested.name).trim()
      : null;

  if (nestedName) {
    const nestedDesc =
      nested!.category_description ?? nested!.description ?? null;
    const cat = await CategoryModel.create({
      id: randomUUID(),
      shopId,
      name: nestedName,
      description: nestedDesc != null ? String(nestedDesc) : null,
      status: "active",
    } as any);
    return { ok: true, categoryId: cat.id };
  }

  const rawId = input.categoryId;
  if (rawId != null && String(rawId).trim() !== "") {
    const id = String(rawId).trim();
    const existing = await CategoryModel.findByPk(id);
    if (!existing) {
      return { ok: false, reason: "CATEGORY_NOT_FOUND" };
    }
    return { ok: true, categoryId: id };
  }

  return { ok: false, reason: "CATEGORY_REQUIRED" };
}

export async function createShopProduct(
  shopId: string,
  input: CreateShopProductInput,
): Promise<{ ok: true; product: Product } | { ok: false; reason: string }> {
  const resolved = await resolveCategoryId(shopId, input);
  if (resolved.ok === false) {
    return { ok: false, reason: resolved.reason };
  }
  const categoryId = resolved.categoryId;

  const product = await ProductModel.create({
    id: randomUUID(),
    shopId,
    categoryId,
    name: input.name ?? null,
    description: input.description ?? null,
    price: input.price ?? null,
    stock: input.stock ?? null,
    image: input.image ?? null,
    status: input.status ?? "active",
  } as any);

  return { ok: true, product };
}

export async function getShopProductById(shopId: string, productId: string) {
  return ProductModel.findOne({
    where: { id: productId, shopId },
    include: [{ association: "category", required: false }],
  });
}

export async function listShopProducts(
  shopId: string,
  query: ListShopProductsQuery,
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

  return {
    items: rows,
    pagination: {
      page,
      page_size: pageSize,
      total: count,
    },
  };
}

export async function deleteShopProduct(shopId: string, productId: string) {
  const deleted = await ProductModel.destroy({
    where: { id: productId, shopId },
  });
  return deleted > 0;
}

export async function updateShopProductImage(
  shopId: string,
  productId: string,
  imageDataUri: string,
): Promise<Product | null> {
  const [affected] = await ProductModel.update(
    { image: imageDataUri },
    { where: { id: productId, shopId } },
  );
  if (affected === 0) return null;
  const updated = await getShopProductById(shopId, productId);
  return updated;
}

/** Lý do điều chỉnh tồn: hư hỏng (trừ) hoặc nhập thêm (cộng). */
const STOCK_ADJUST_REASONS = ["rotten", "import"] as const;

export type StockAdjustReason = (typeof STOCK_ADJUST_REASONS)[number];

export async function adjustShopProductStock(
  shopId: string,
  productId: string,
  payload: { quantity: unknown; reason: unknown },
): Promise<
  | { ok: true; stockDetail: StockDetail }
  | {
      ok: false;
      reason:
        | "NOT_FOUND"
        | "INVALID_QUANTITY"
        | "INVALID_REASON"
        | "INSUFFICIENT_STOCK";
    }
> {
  const reasonRaw = payload.reason;
  if (
    typeof reasonRaw !== "string" ||
    !(STOCK_ADJUST_REASONS as readonly string[]).includes(reasonRaw)
  ) {
    return { ok: false, reason: "INVALID_REASON" };
  }

  const quantityRaw = payload.quantity;
  const q =
    typeof quantityRaw === "number" ? quantityRaw : Number(quantityRaw);
  if (!Number.isFinite(q) || !Number.isInteger(q)) {
    return { ok: false, reason: "INVALID_QUANTITY" };
  }

  return sequelize.transaction(async (t) => {
    const product = await ProductModel.findOne({
      where: { id: productId, shopId },
      transaction: t,
      lock: Transaction.LOCK.UPDATE,
    });
    if (!product) {
      return { ok: false as const, reason: "NOT_FOUND" as const };
    }

    const last = await StockDetailModel.findOne({
      where: { productId },
      order: [["createdAt", "DESC"]],
      transaction: t,
    });

    const prevRemain = last?.remain ?? 0;
    const newRemain = prevRemain + q;
    if (newRemain < 0) {
      return { ok: false as const, reason: "INSUFFICIENT_STOCK" as const };
    }

    const stockDetail = await StockDetailModel.create(
      {
        id: randomUUID(),
        productId,
        quantity: q,
        reason: reasonRaw,
        remain: newRemain,
      } as any,
      { transaction: t },
    );

    await product.update({ stock: newRemain }, { transaction: t });

    return { ok: true as const, stockDetail };
  });
}

export interface ListShopProductStockDetailsQuery {
  page?: number;
  page_size?: number;
}

export async function listShopProductStockDetails(
  shopId: string,
  productId: string,
  query: ListShopProductStockDetailsQuery,
): Promise<
  | {
      ok: true;
      data: {
        items: StockDetail[];
        current_remain: number;
        pagination: { page: number; page_size: number; total: number };
      };
    }
  | { ok: false; reason: "NOT_FOUND" }
> {
  const product = await ProductModel.findOne({
    where: { id: productId, shopId },
    attributes: ["id", "stock"],
  });
  if (!product) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize =
    query.page_size && query.page_size > 0 ? query.page_size : 10;
  const offset = (page - 1) * pageSize;

  const { rows, count } = await StockDetailModel.findAndCountAll({
    where: { productId },
    order: [["createdAt", "DESC"]],
    offset,
    limit: pageSize,
  });

  const stockVal = product.stock;
  const current_remain =
    stockVal == null || Number.isNaN(Number(stockVal)) ? 0 : Number(stockVal);

  return {
    ok: true,
    data: {
      items: rows,
      current_remain,
      pagination: {
        page,
        page_size: pageSize,
        total: count,
      },
    },
  };
}

export interface UpsertShopPolicyPayload {
  policyTitle?: string | null;
  policyContent?: string | null;
}

/**
 * Một shop chỉ có tối đa một row policy (`shop_id`).
 * Đã có thì cập nhật title/content; chưa có thì tạo mới.
 */
export async function upsertShopPolicy(
  shopId: string,
  payload: UpsertShopPolicyPayload,
) {
  const title = payload.policyTitle !== undefined ? payload.policyTitle : null;
  const content =
    payload.policyContent !== undefined ? payload.policyContent : null;

  const existing = await PolicyModel.findOne({ where: { shopId } });
  if (existing) {
    await existing.update({
      title,
      content,
    });
    return { policy: existing, created: false as const };
  }

  const id = randomUUID();
  const policy = await PolicyModel.create({
    id,
    shopId,
    title,
    content,
    status: "active",
  });
  return { policy, created: true as const };
}

export async function deleteShopPolicy(shopId: string) {
  const deleted = await PolicyModel.destroy({ where: { shopId } });
  if (deleted === 0) {
    return { ok: false as const, reason: "NOT_FOUND" as const };
  }
  return { ok: true as const };
}

export type ShopIncomeRangeMeta = {
  days_ago?: number | null;
  from?: string | null;
  to?: string | null;
};

/** Parse ngày định dạng DD-MM-YYYY (vd. 15-08-2026). */
export function parseIncomeDateDdMmYyyy(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const m = value.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;
  const year = parseInt(m[3], 10);
  const d = new Date(year, month, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

async function getShopIncomeInRange(
  shopId: string,
  since: Date,
  until: Date,
  meta: ShopIncomeRangeMeta,
) {
  const products = await ProductModel.findAll({
    where: { shopId },
    attributes: ["id", "name", "description", "price", "image", "status"],
  });

  if (products.length === 0) {
    return {
      code: 200,
      msg: "Get shop income successfully",
      data: {
        shopId,
        days_ago: meta.days_ago ?? null,
        from: meta.from ?? null,
        to: meta.to ?? null,
        from_time: since.toISOString(),
        to_time: until.toISOString(),
        total_revenue: 0,
        product_sales: [] as Array<{
          productId: string;
          total_quantity: number;
          total_revenue: number;
          product: Product | null;
        }>,
      },
    };
  }

  const productIds = products.map((p) => p.id);
  const productMap = new Map(products.map((p) => [p.id, p]));

  const orderItems = await OrderItemModel.findAll({
    where: {
      productId: { [Op.in]: productIds },
      status: "active",
      [Op.and]: [
        where(col("created_at"), Op.gte, since),
        where(col("created_at"), Op.lte, until),
      ],
    },
  });

  let totalRevenue = 0;
  const soldByProduct = new Map<
    string,
    { total_quantity: number; total_revenue: number }
  >();

  for (const row of orderItems) {
    const pid = row.productId;
    if (!pid) continue;

    const quantity = row.quantity ?? 0;
    const price = row.price ?? 0;
    const lineRevenue = quantity * price;
    totalRevenue += lineRevenue;

    const current = soldByProduct.get(pid) ?? {
      total_quantity: 0,
      total_revenue: 0,
    };
    current.total_quantity += quantity;
    current.total_revenue += lineRevenue;
    soldByProduct.set(pid, current);
  }

  const productSales = [...soldByProduct.entries()]
    .map(([pid, stat]) => ({
      productId: pid,
      total_quantity: stat.total_quantity,
      total_revenue: stat.total_revenue,
      product: productMap.get(pid) ?? null,
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue);

  return {
    code: 200,
    msg: "Get shop income successfully",
    data: {
      shopId,
      days_ago: meta.days_ago ?? null,
      from: meta.from ?? null,
      to: meta.to ?? null,
      from_time: since.toISOString(),
      to_time: until.toISOString(),
      total_revenue: totalRevenue,
      product_sales: productSales,
    },
  };
}

export async function getShopIncomeInPastDays(shopId: string, daysAgo: number) {
  const since = new Date();
  since.setDate(since.getDate() - daysAgo);
  since.setHours(0, 0, 0, 0);
  const until = new Date();
  return getShopIncomeInRange(shopId, since, until, { days_ago: daysAgo });
}

export async function getShopIncomeByDateRange(
  shopId: string,
  fromRaw: string,
  toRaw: string,
): Promise<
  | { ok: true; result: Awaited<ReturnType<typeof getShopIncomeInRange>> }
  | { ok: false; reason: "INVALID_DATE" | "FROM_AFTER_TO" }
> {
  const fromDate = parseIncomeDateDdMmYyyy(fromRaw);
  const toDate = parseIncomeDateDdMmYyyy(toRaw);
  if (!fromDate || !toDate) {
    return { ok: false, reason: "INVALID_DATE" };
  }

  const since = startOfDay(fromDate);
  const until = endOfDay(toDate);
  if (since.getTime() > until.getTime()) {
    return { ok: false, reason: "FROM_AFTER_TO" };
  }

  const result = await getShopIncomeInRange(shopId, since, until, {
    days_ago: null,
    from: fromRaw.trim(),
    to: toRaw.trim(),
  });
  return { ok: true, result };
}

export interface CreateShopCategoryPayload {
  name?: string | null;
  description?: string | null;
  status?: string | null;
}

export interface ListShopCategoriesQuery {
  page?: number;
  page_size?: number;
}

export async function createShopCategory(
  shopId: string,
  payload: CreateShopCategoryPayload,
) {
  const id = randomUUID();
  return CategoryModel.create({
    id,
    shopId,
    name: payload.name ?? null,
    description: payload.description ?? null,
    status: payload.status ?? "active",
  } as any);
}

export async function getShopCategoryById(shopId: string, categoryId: string) {
  return CategoryModel.findOne({
    where: { id: categoryId, shopId },
  });
}

export async function listShopCategories(
  shopId: string,
  query: ListShopCategoriesQuery,
) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize =
    query.page_size && query.page_size > 0 ? query.page_size : 10;
  const offset = (page - 1) * pageSize;

  const { rows, count } = await CategoryModel.findAndCountAll({
    where: { shopId },
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

export async function deleteShopCategory(shopId: string, categoryId: string) {
  const category = await CategoryModel.findOne({
    where: { id: categoryId, shopId },
  });
  if (!category) {
    return { ok: false as const, reason: "NOT_FOUND" as const };
  }

  const inUse = await ProductModel.findOne({
    where: { shopId, categoryId },
  });
  if (inUse) {
    return { ok: false as const, reason: "IN_USE" as const };
  }

  await category.destroy();
  return { ok: true as const };
}

import "../../config/config";
import axios from "axios";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { User } from "../../models/modal";

interface ShopownerGoogleOAuthPayload {
  code: string;
  callback_url?: string;
}

const createJwtToken = (payload: any, role: string | null) => {
  const secret = process.env.JWT_SECRET_SHOPOWNER_LOGIN!;

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRE ?? "7d",
  });
};

export const loginShopownerWithGoogle = async (
  payload: ShopownerGoogleOAuthPayload,
) => {
  const { code, callback_url } = payload;
  if (!code) {
    return {
      code: 400,
      msg: "Missing code",
      data: null,
    };
  }

  const redirectUri =
    callback_url || process.env.GOOGLE_REDIRECT_URI || undefined;
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );

  const { tokens } = await client.getToken({
    code,
    redirect_uri: redirectUri,
  });

  if (!tokens.access_token) {
    return {
      code: 400,
      msg: "Cannot get access_token from Google",
      data: null,
    };
  }

  const userInfoRes = await axios.get(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    },
  );

  const { email, name, picture } = userInfoRes.data || {};
  if (!email) {
    return {
      code: 400,
      msg: "Cannot get email from Google",
      data: null,
    };
  }

  let user = await User.findOne({ where: { email } });
  if (!user) {
    user = await User.create({
      id: randomUUID(),
      email,
      name: name || email,
      avatar: picture || null,
      provider: "google",
      role: "shopowner",
      status: "active",
    });
  }

  const token = createJwtToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    user.role,
  );

  return {
    code: 0,
    msg: "Shopowner login with Google successfully",
    data: {
      token,
      user,
    },
  };
};

// export const getShopownerInfoByUserId = async (userId: string) => {
//   const shop = await shopInfoService.findByOwnerUserId(userId);
//   if (!shop) {
//     return {
//       code: 404,
//       msg: "Shop not found",
//       data: null,
//     };
//   }

//   return {
//     code: 200,
//     msg: "Get shopowner info successfully",
//     data: {
//       shopId: shop.id,
//       shop,
//     },
//   };
// };

export const getDefaultShopInfo = async () => {
  const shopInfo = await ShopInfoModel.findAll({
    where: { status: "active" },
    limit: 1,
  });
  return shopInfo[0].dataValues;
};

/** Chỉ một quảng cáo `active` tại một thời điểm — dùng trong transaction. */
async function deactivateAllActiveAdvertisements(t: Transaction) {
  await AdvertisementModel.update(
    { status: "inactive" },
    { where: { status: "active" }, transaction: t },
  );
}

/**
 * Tạo advertisement: `image` là data URL base64 (ảnh) hoặc đường dẫn public `/videos/...` (video).
 * Các row `active` khác → inactive.
 */
export async function createShopAdvertisementFromUpload(
  imageOrVideoRef: string,
): Promise<Advertisement> {
  return sequelize.transaction(async (t) => {
    await deactivateAllActiveAdvertisements(t);
    const row = await AdvertisementModel.create(
      {
        id: randomUUID(),
        image: imageOrVideoRef,
        status: "active",
      },
      { transaction: t },
    );
    return row;
  });
}

export interface ListAdvertisementsQuery {
  page?: number;
  page_size?: number;
}

export async function listShopAdvertisements(query: ListAdvertisementsQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize =
    query.page_size && query.page_size > 0 ? query.page_size : 10;
  const offset = (page - 1) * pageSize;

  const { rows, count } = await AdvertisementModel.findAndCountAll({
    order: [["createdAt", "DESC"]],
    offset,
    limit: pageSize,
  });

  return {
    items: rows.map((r) => r.get({ plain: true })),
    pagination: {
      page,
      page_size: pageSize,
      total: count,
    },
  };
}

/** Một bản ghi `active` mới nhất — dùng cho banner công khai (không JWT). */
export async function getPublicActiveAdvertisement() {
  const row = await AdvertisementModel.findOne({
    where: { status: "active" },
    order: [["updatedAt", "DESC"]],
  });
  return row ? row.get({ plain: true }) : null;
}

export type AdvertisementCampaignStatus = "active" | "inactive";

export async function updateShopAdvertisementStatus(
  advId: string,
  status: unknown,
): Promise<
  | { ok: true; advertisement: Advertisement }
  | { ok: false; reason: "NOT_FOUND" | "INVALID_STATUS" }
> {
  if (status !== "active" && status !== "inactive") {
    return { ok: false, reason: "INVALID_STATUS" };
  }

  const existing = await AdvertisementModel.findByPk(advId);
  if (!existing) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  await sequelize.transaction(async (t) => {
    if (status === "active") {
      await deactivateAllActiveAdvertisements(t);
    }
    await AdvertisementModel.update(
      { status },
      { where: { id: advId }, transaction: t },
    );
  });

  const updated = await AdvertisementModel.findByPk(advId);
  return { ok: true, advertisement: updated! };
}

// --- Flash sale campaigns (flash_sale_campaigns) ---

export interface CreateShopFlashSaleCampaignBody {
  product_target_id?: unknown;
  campaign_start_at?: unknown;
  expired_in?: unknown;
  total_quantity?: unknown;
  discount?: unknown;
}

function parseFlashSaleDate(value: unknown): Date | null {
  if (value == null) return null;
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

function deriveFlashSaleStatus(
  start: Date,
  end: Date,
  now: Date,
): "active" | "inactive" | "expired" {
  if (now.getTime() > end.getTime()) return "expired";
  if (now.getTime() < start.getTime()) return "inactive";
  return "active";
}

/** Các row `active` đã quá `expired_in` → `expired` (toàn bảng). */
export async function expireStaleActiveFlashSaleCampaigns(): Promise<number> {
  const [affected] = await FlashSaleCampaignModel.update(
    { status: "expired" },
    {
      where: {
        status: "active",
        expiredIn: { [Op.lt]: new Date() },
      },
    },
  );
  return affected;
}

async function assertFlashSaleCampaignOwnedByShop(
  shopId: string,
  campaignId: string,
): Promise<
  | { ok: true; campaign: FlashSaleCampaign }
  | { ok: false; reason: "NOT_FOUND" }
> {
  const campaign = await FlashSaleCampaignModel.findByPk(campaignId);
  if (!campaign?.productTargetId) {
    return { ok: false, reason: "NOT_FOUND" };
  }
  const product = await ProductModel.findByPk(campaign.productTargetId);
  if (!product || product.shopId !== shopId) {
    return { ok: false, reason: "NOT_FOUND" };
  }
  return { ok: true, campaign };
}

export async function createShopFlashSaleCampaign(
  shopId: string,
  body: CreateShopFlashSaleCampaignBody,
): Promise<
  | { ok: true; campaign: FlashSaleCampaign }
  | {
      ok: false;
      reason:
        | "INVALID_PRODUCT"
        | "INVALID_DATES"
        | "INVALID_NUMBERS"
        | "BAD_REQUEST";
    }
> {
  const productId =
    typeof body.product_target_id === "string"
      ? body.product_target_id.trim()
      : "";
  if (!productId) {
    return { ok: false, reason: "BAD_REQUEST" };
  }

  const product = await ProductModel.findByPk(productId);
  if (!product || product.shopId !== shopId) {
    return { ok: false, reason: "INVALID_PRODUCT" };
  }

  const start = parseFlashSaleDate(body.campaign_start_at);
  const end = parseFlashSaleDate(body.expired_in);
  if (!start || !end || end.getTime() <= start.getTime()) {
    return { ok: false, reason: "INVALID_DATES" };
  }

  const totalQty = Number(body.total_quantity);
  const discount = Number(body.discount);
  if (
    !Number.isInteger(totalQty) ||
    totalQty <= 0 ||
    !Number.isInteger(discount) ||
    discount < 0 ||
    discount > 100
  ) {
    return { ok: false, reason: "INVALID_NUMBERS" };
  }

  const now = new Date();
  const status = deriveFlashSaleStatus(start, end, now);

  const row = await FlashSaleCampaignModel.create({
    id: randomUUID(),
    productTargetId: productId,
    campaignStartAt: start,
    expiredIn: end,
    totalQuantity: totalQty,
    remainQuantity: totalQty,
    discount,
    status,
  });

  return { ok: true, campaign: row };
}

export interface ListFlashSaleCampaignsQuery {
  page?: number;
  page_size?: number;
}

export async function listShopFlashSaleCampaigns(
  shopId: string,
  query: ListFlashSaleCampaignsQuery,
) {
  await expireStaleActiveFlashSaleCampaigns();
  /** Không tự inactive→active khi list: sau khi chủ shop chọn inactive (tạm dừng),
   *  refetch danh sách sẽ không ghi đè lại thành active. */

  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize =
    query.page_size && query.page_size > 0 ? query.page_size : 10;
  const offset = (page - 1) * pageSize;

  const shopProducts = await ProductModel.findAll({
    where: { shopId },
    attributes: ["id"],
    raw: true,
  });
  const productIds = shopProducts.map((p) => p.id);
  if (productIds.length === 0) {
    return {
      items: [] as Record<string, unknown>[],
      pagination: {
        page,
        page_size: pageSize,
        total: 0,
      },
    };
  }

  const { rows, count } = await FlashSaleCampaignModel.findAndCountAll({
    where: { productTargetId: { [Op.in]: productIds } },
    order: [["createdAt", "DESC"]],
    offset,
    limit: pageSize,
  });

  return {
    items: rows.map((r) => r.get({ plain: true })),
    pagination: {
      page,
      page_size: pageSize,
      total: count,
    },
  };
}

export type FlashSaleCampaignManualStatus = "active" | "inactive";

export async function updateShopFlashSaleCampaignStatus(
  shopId: string,
  campaignId: string,
  statusInput: unknown,
): Promise<
  | { ok: true; campaign: FlashSaleCampaign }
  | {
      ok: false;
      reason: "NOT_FOUND" | "INVALID_STATUS" | "EXPIRED_LOCKED";
    }
> {
  const normalized =
    typeof statusInput === "string" ? statusInput.trim().toLowerCase() : "";
  if (normalized !== "active" && normalized !== "inactive") {
    return { ok: false, reason: "INVALID_STATUS" };
  }

  const owned = await assertFlashSaleCampaignOwnedByShop(shopId, campaignId);
  if (!owned.ok) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const { campaign } = owned;
  const now = new Date();
  const endMs = campaign.expiredIn
    ? new Date(campaign.expiredIn).getTime()
    : null;
  const pastEnd =
    endMs != null && !Number.isNaN(endMs) && now.getTime() > endMs;

  /** Đã quá `expired_in`: active hoặc inactive đều chuyển thành expired, không cho sửa tay. */
  if (pastEnd) {
    if (campaign.status !== "expired") {
      await campaign.update({ status: "expired" });
      await campaign.reload();
    }
    return { ok: false, reason: "EXPIRED_LOCKED" };
  }

  if (campaign.status === "expired") {
    return { ok: false, reason: "EXPIRED_LOCKED" };
  }

  if (campaign.status === normalized) {
    return { ok: true, campaign };
  }

  await campaign.update({ status: normalized });
  await campaign.reload();
  return { ok: true, campaign };
}

export async function deleteShopFlashSaleCampaign(
  shopId: string,
  campaignId: string,
): Promise<{ ok: true } | { ok: false; reason: "NOT_FOUND" }> {
  const owned = await assertFlashSaleCampaignOwnedByShop(shopId, campaignId);
  if (!owned.ok) {
    return { ok: false, reason: "NOT_FOUND" };
  }
  await owned.campaign.destroy();
  return { ok: true };
}

/**
 * User đã từng có đơn chứa `productId` và có payment `status === "success"` cho đơn đó.
 */
export async function userHasSuccessfulPurchaseForProduct(
  userId: string,
  productId: string,
): Promise<boolean> {
  const items = await OrderItemModel.findAll({
    where: { productId },
    attributes: ["orderId"],
  });
  const orderIds = [
    ...new Set(items.map((i) => i.orderId).filter(Boolean)),
  ] as string[];
  if (orderIds.length === 0) return false;

  const orders = await OrderModel.findAll({
    where: { id: { [Op.in]: orderIds }, userId },
    attributes: ["id"],
  });
  const userOrderIds = orders.map((o) => o.id);
  if (userOrderIds.length === 0) return false;

  const pay = await PaymentModel.findOne({
    where: {
      orderId: { [Op.in]: userOrderIds },
      status: "success",
    },
  });
  return pay != null;
}

export interface CreateProductCommentInput {
  userId: string;
  productId: string;
  isBought: boolean;
  comment: string | null;
  file: string | null;
  fileType: string | null;
  star: number | null;
}

export async function createProductCommentRecord(
  input: CreateProductCommentInput,
): Promise<
  | { ok: true; row: ProductComment }
  | { ok: false; reason: "PRODUCT_NOT_FOUND" }
> {
  const product = await ProductModel.findByPk(input.productId, {
    attributes: ["id"],
  });
  if (!product) {
    return { ok: false, reason: "PRODUCT_NOT_FOUND" };
  }

  const row = await ProductCommentModel.create({
    id: randomUUID(),
    productId: input.productId,
    userId: input.userId,
    isBought: input.isBought,
    comment: input.comment,
    file: input.file,
    fileType: input.fileType,
    star: input.star,
  } as any);

  return { ok: true, row };
}

export interface ListProductCommentsQuery {
  page?: number;
  page_size?: number;
}

export async function listProductComments(
  productId: string,
  query: ListProductCommentsQuery,
): Promise<
  | {
      ok: true;
      data: {
        items: Record<string, unknown>[];
        pagination: { page: number; page_size: number; total: number };
      };
    }
  | { ok: false; reason: "PRODUCT_NOT_FOUND" }
> {
  const product = await ProductModel.findByPk(productId, { attributes: ["id"] });
  if (!product) {
    return { ok: false, reason: "PRODUCT_NOT_FOUND" };
  }

  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize =
    query.page_size && query.page_size > 0 ? query.page_size : 10;
  const offset = (page - 1) * pageSize;

  const { rows, count } = await ProductCommentModel.findAndCountAll({
    where: { productId },
    include: [
      {
        model: UserModel,
        as: "user",
        attributes: ["id", "name", "avatar", "email"],
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
    offset,
    limit: pageSize,
  });

  const items = rows.map((r) => r.get({ plain: true }) as unknown as Record<string, unknown>);

  return {
    ok: true,
    data: {
      items,
      pagination: {
        page,
        page_size: pageSize,
        total: count,
      },
    },
  };
}

export interface CreateShopVoucherInput {
  name: string;
  discount: number;
}

export async function shopownerCreateVoucherRecord(
  input: CreateShopVoucherInput,
): Promise<
  | { ok: true; voucher: InstanceType<typeof VoucherModel> }
  | { ok: false; reason: string }
> {
  const name =
    typeof input.name === "string" ? input.name.trim() : String(input.name ?? "");
  if (!name) {
    return { ok: false, reason: "NAME_REQUIRED" };
  }

  const discount = Number(input.discount);
  if (!Number.isInteger(discount) || discount < 0) {
    return { ok: false, reason: "INVALID_DISCOUNT" };
  }

  const voucher = await VoucherModel.create({
    id: randomUUID(),
    name,
    discount,
    status: "active",
  } as any);

  return { ok: true, voucher };
}

export interface ListVouchersQuery {
  page?: number;
  page_size?: number;
}

/** Danh sách voucher (phân trang), không lọc theo shop — bảng `vouchers` toàn cục. */
export async function listAllVouchers(query: ListVouchersQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize =
    query.page_size && query.page_size > 0 ? query.page_size : 10;
  const offset = (page - 1) * pageSize;

  const { rows, count } = await VoucherModel.findAndCountAll({
    order: [["createdAt", "DESC"]],
    offset,
    limit: pageSize,
  });

  return {
    items: rows.map((r) => r.get({ plain: true })),
    pagination: {
      page,
      page_size: pageSize,
      total: count,
    },
  };
}

const ORDER_COUNT_STATUSES = [
  "cart",
  "processing",
  "paid",
  "order",
  "cancel",
  "failed",
] as const;

type OrderCountStatus = (typeof ORDER_COUNT_STATUSES)[number];

export interface UserOrderStatusCounts {
  total: number;
  cart: number;
  processing: number;
  paid: number;
  order: number;
  cancel: number;
  failed: number;
}

function emptyOrderStatusCounts(): UserOrderStatusCounts {
  return {
    total: 0,
    cart: 0,
    processing: 0,
    paid: 0,
    order: 0,
    cancel: 0,
    failed: 0,
  };
}

function isOrderCountStatus(s: string): s is OrderCountStatus {
  return (ORDER_COUNT_STATUSES as readonly string[]).includes(s);
}

async function buildOrderStatusCountsByUserIds(
  userIds: string[],
): Promise<Map<string, UserOrderStatusCounts>> {
  const map = new Map<string, UserOrderStatusCounts>();
  for (const id of userIds) {
    map.set(id, emptyOrderStatusCounts());
  }
  if (userIds.length === 0) {
    return map;
  }

  const rows = (await OrderModel.findAll({
    attributes: [
      "userId",
      "status",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    where: { userId: { [Op.in]: userIds } },
    group: ["userId", "status"],
    raw: true,
  })) as unknown as Array<{
    userId: string;
    status: string | null;
    count: string;
  }>;

  for (const row of rows) {
    const uid = row.userId;
    if (!uid || !map.has(uid)) continue;
    const stats = map.get(uid)!;
    const n = Number(row.count) || 0;
    stats.total += n;
    const st = (row.status ?? "").trim();
    if (isOrderCountStatus(st)) {
      stats[st] += n;
    }
  }

  return map;
}

export async function updateUserStatusByEmail(
  email: string,
  status: "active" | "inactive",
): Promise<
  | { ok: true; user: Record<string, unknown> }
  | { ok: false; reason: "USER_NOT_FOUND" }
> {
  const normalizedEmail = email.trim();
  const user = await UserModel.findOne({
    where: { email: normalizedEmail },
  });
  if (!user) {
    return { ok: false, reason: "USER_NOT_FOUND" };
  }

  await user.update({ status });
  return {
    ok: true,
    user: user.get({ plain: true }) as unknown as Record<string, unknown>,
  };
}

export interface ListShopownerUsersQuery {
  page?: number;
  page_size?: number;
}

export async function listUsersWithOrderStats(query: ListShopownerUsersQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize =
    query.page_size && query.page_size > 0 ? query.page_size : 10;
  const offset = (page - 1) * pageSize;

  const { rows, count } = await UserModel.findAndCountAll({
    order: [["createdAt", "DESC"]],
    offset,
    limit: pageSize,
  });

  const userIds = rows.map((u) => u.id);
  const orderStatsMap = await buildOrderStatusCountsByUserIds(userIds);

  const items = rows.map((u) => {
    const plain = u.get({ plain: true }) as unknown as Record<string, unknown>;
    const { password: _pw, ...safe } = plain;
    return {
      ...safe,
      order_stats: orderStatsMap.get(u.id) ?? emptyOrderStatusCounts(),
    };
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

export interface SearchPublicProductsQuery {
  page?: number;
  page_size?: number;
}

function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/**
 * Tìm sản phẩm theo tên (public): ưu tiên tên bắt đầu bằng keyword, sau đó tên chứa keyword (không phân biệt hoa thường).
 */
export async function searchPublicProductsByName(
  keyWord: string,
  query: SearchPublicProductsQuery,
) {
  const keyword = keyWord.trim().toLowerCase();
  if (!keyword) {
    return {
      ok: false as const,
      reason: "KEYWORD_REQUIRED" as const,
    };
  }

  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize =
    query.page_size && query.page_size > 0 ? query.page_size : 10;
  const offset = (page - 1) * pageSize;

  const escaped = escapeLikePattern(keyword);
  const containsPattern = `%${escaped}%`;
  const startsWithPattern = `${escaped}%`;

  const { rows, count } = await ProductModel.findAndCountAll({
    where: {
      name: { [Op.iLike]: containsPattern },
    },
    include: [{ association: "category", required: false }],
    order: [
      [
        sequelize.literal(
          `CASE WHEN LOWER("Product"."name") LIKE LOWER(:startsWithPattern) THEN 0 ELSE 1 END`,
        ),
        "ASC",
      ],
      ["name", "ASC"],
    ],
    replacements: { startsWithPattern },
    offset,
    limit: pageSize,
  });

  return {
    ok: true as const,
    items: rows.map((r) => r.get({ plain: true })),
    pagination: {
      page,
      page_size: pageSize,
      total: count,
    },
  };
}

export type ProductSortStrategy =
  | "price-descend"
  | "price-ascend"
  | "best-seller";

export interface SortPublicProductsQuery {
  page?: number;
  page_size?: number;
}

/** Đơn không tính vào lượt bán chạy. */
const ORDER_STATUSES_EXCLUDED_FROM_SALES = ["cart", "cancel"];

function buildSoldQuantitySubquery() {
  const statusList = ORDER_STATUSES_EXCLUDED_FROM_SALES.map((s) => `'${s}'`).join(
    ", ",
  );
  return literal(`(
    SELECT COALESCE(SUM(oi.quantity), 0)
    FROM order_items AS oi
    INNER JOIN orders AS o ON o.id = oi.order_id
    WHERE oi.product_id = "Product"."id"
      AND o.status NOT IN (${statusList})
  )`);
}

async function mapShopProductsWithFlashSale(
  rows: Product[],
  options?: { includeBestsellerFields?: boolean },
) {
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

  return rows.map((row) => {
    const plain = row.get({ plain: true }) as unknown as Record<string, unknown>;
    const base = {
      ...plain,
      flash_sale_campaign: flashSaleByProductId.get(row.id) ?? null,
    };

    if (!options?.includeBestsellerFields) {
      return base;
    }

    const soldRaw = plain.sold_quantity;
    const sold =
      typeof soldRaw === "number"
        ? soldRaw
        : typeof soldRaw === "string"
          ? parseInt(soldRaw, 10) || 0
          : 0;

    return {
      ...base,
      sold_quantity: sold,
      bestseller_label:
        sold > 0 ? `Bán chạy · đã bán ${sold}` : "Chưa có đơn bán",
    };
  });
}

/**
 * Sắp xếp sản phẩm theo shop: giá tăng/giảm hoặc bán chạy (tổng quantity từ order_items, bỏ giỏ/hủy).
 * Mỗi item kèm `category` và `flash_sale_campaign` (giống GET /user/products?shop_id=...).
 */
export async function sortPublicProductsByStrategy(
  shopId: string,
  sortStrategy: ProductSortStrategy,
  query: SortPublicProductsQuery,
) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize =
    query.page_size && query.page_size > 0 ? query.page_size : 10;
  const offset = (page - 1) * pageSize;

  const include = [{ association: "category" as const, required: false }];
  const where = { shopId };
  const pagination = (total: number) => ({
    page,
    page_size: pageSize,
    total,
  });

  if (sortStrategy === "price-descend") {
    const { rows, count } = await ProductModel.findAndCountAll({
      where,
      include,
      order: [
        ["price", "DESC"],
        ["createdAt", "DESC"],
      ],
      offset,
      limit: pageSize,
    });
    return {
      ok: true as const,
      sortStrategy,
      items: await mapShopProductsWithFlashSale(rows),
      pagination: pagination(count),
    };
  }

  if (sortStrategy === "price-ascend") {
    const { rows, count } = await ProductModel.findAndCountAll({
      where,
      include,
      order: [
        ["price", "ASC"],
        ["createdAt", "DESC"],
      ],
      offset,
      limit: pageSize,
    });
    return {
      ok: true as const,
      sortStrategy,
      items: await mapShopProductsWithFlashSale(rows),
      pagination: pagination(count),
    };
  }

  const soldQuantitySql = buildSoldQuantitySubquery();
  const { rows, count } = await ProductModel.findAndCountAll({
    where,
    include,
    attributes: {
      include: [[soldQuantitySql, "sold_quantity"]],
    },
    order: [[soldQuantitySql, "DESC"], ["createdAt", "DESC"]],
    offset,
    limit: pageSize,
  });

  return {
    ok: true as const,
    sortStrategy,
    items: await mapShopProductsWithFlashSale(rows, {
      includeBestsellerFields: true,
    }),
    pagination: pagination(count),
  };
}

/**
 * Danh mục công khai: `status = active`, mỗi `name` (so khớp không phân biệt hoa thường) chỉ giữ 1 row đại diện (mới nhất theo `updatedAt`).
 */
export async function listPublicActiveCategories() {
  const rows = await CategoryModel.findAll({
    where: { status: "active" },
    order: [["updatedAt", "DESC"]],
  });

  const seenNames = new Set<string>();
  const items = [];

  for (const row of rows) {
    const nameKey = (row.name ?? "").trim().toLowerCase();
    if (seenNames.has(nameKey)) continue;
    seenNames.add(nameKey);
    items.push(row.get({ plain: true }));
  }

  return items;
}
