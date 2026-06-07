import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { Request, Response } from "express";
import { File, IncomingForm } from "formidable";
import {
  IDataResponse,
  IUserAuthRequest,
} from "../../interface/request/request";
import { loginShopownerWithGoogle } from "../../services/shopowner/shopwnerService";
import {
  createShopCategory,
  deleteShopCategory,
  getShopCategoryById,
  listShopCategories,
} from "../../services/shopowner/shopwnerService";
import {
  getShopIncomeByDateRange,
  getShopIncomeInPastDays,
} from "../../services/shopowner/shopwnerService";
import {
  deleteShopPolicy,
  upsertShopPolicy,
} from "../../services/shopowner/shopwnerService";
import {
  adjustShopProductStock,
  createProductCommentRecord,
  createShopAdvertisementFromUpload,
  createShopFlashSaleCampaign,
  createShopProduct,
  deleteShopFlashSaleCampaign,
  deleteShopProduct,
  getShopProductById,
  listProductComments,
  listShopAdvertisements,
  listShopFlashSaleCampaigns,
  listShopProductStockDetails,
  listShopProducts,
  listAllVouchers,
  listUsersWithOrderStats,
  shopownerCreateVoucherRecord,
  updateShopAdvertisementStatus,
  updateUserStatusByEmail,
  updateShopFlashSaleCampaignStatus,
  updateShopProductImage,
  userHasSuccessfulPurchaseForProduct,
} from "../../services/shopowner/shopwnerService";
import * as shopOwnerService from "../../services/shopowner/shopwnerService";
type FormidableFields = Record<string, string | string[] | undefined>;
type FormidableFiles = Record<string, File | File[] | undefined>;

const ADV_PUBLIC_VIDEOS_DIR = path.join(
  __dirname,
  "..",
  "..",
  "public",
  "videos",
);
const ADV_UPLOAD_MAX_BYTES = 200 * 1024 * 1024;

/** Cùng cấp `src/public/videos` — phục vụ GET /video_comment/... */
const COMMENT_VIDEO_DIR = path.join(
  __dirname,
  "..",
  "..",
  "public",
  "video_comment",
);
const COMMENT_UPLOAD_MAX_BYTES = 200 * 1024 * 1024;

function classifyAdvUpload(
  mime: string,
  extNoDot: string,
): "image" | "video" | null {
  const m = (mime || "").toLowerCase();
  const e = extNoDot.toLowerCase();
  if (
    m.startsWith("video/") ||
    ["mp4", "webm", "mov", "mkv", "mpeg", "ogv", "avi"].includes(e)
  ) {
    return "video";
  }
  if (
    m.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(e)
  ) {
    return "image";
  }
  return null;
}

function resolveVideoFileExtension(mime: string, extNoDot: string): string {
  const e = extNoDot.toLowerCase();
  if (["mp4", "webm", "mov", "mkv", "mpeg", "ogv", "avi"].includes(e)) {
    return e;
  }
  const m = (mime || "").toLowerCase();
  if (m.includes("webm")) return "webm";
  if (m.includes("quicktime")) return "mov";
  if (m.includes("mpeg")) return "mpeg";
  return "mp4";
}

function parsePageSize(
  pageRaw: unknown,
  pageSizeRaw: unknown,
): { page: number; page_size: number } {
  let page = 1;
  let page_size = 10;

  if (
    pageRaw != null &&
    pageRaw !== "null" &&
    pageRaw !== "" &&
    typeof pageRaw === "string"
  ) {
    const p = parseInt(pageRaw, 10);
    if (!isNaN(p) && p >= 1) page = p;
  }

  if (
    pageSizeRaw != null &&
    pageSizeRaw !== "null" &&
    pageSizeRaw !== "" &&
    typeof pageSizeRaw === "string"
  ) {
    const ps = parseInt(pageSizeRaw, 10);
    if (!isNaN(ps) && ps > 0) page_size = ps;
  }

  return { page, page_size };
}

function parseDaysAgo(value: unknown): number | null {
  if (value == null) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  const s = String(raw).trim();
  if (s === "") return null;
  const days = Number(s);
  if (!Number.isInteger(days) || days <= 0) return null;
  return days;
}

function resolveDaysAgoFromRequest(req: IUserAuthRequest): number | null {
  const fromQuery =
    req.query.days_ago ?? req.query["days_ago "];
  const fromHeader =
    req.headers["days_ago"] ?? req.headers["days-ago"];
  return parseDaysAgo(fromQuery ?? fromHeader);
}

function hasIncomeDateRangeBody(body: unknown): body is { from: string; to: string } {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.from === "string" &&
    b.from.trim() !== "" &&
    typeof b.to === "string" &&
    b.to.trim() !== ""
  );
}

function firstFormField(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  if (Array.isArray(v)) return v[0];
  return v;
}

/** Bỏ ngoặc kép thừa do client gửi dạng `"..."`. */
function stripOuterQuotes(raw: string | undefined): string | undefined {
  if (raw == null) return undefined;
  let s = raw.trim();
  if (s.length >= 2) {
    const a = s[0];
    const b = s[s.length - 1];
    if ((a === '"' && b === '"') || (a === "'" && b === "'")) {
      s = s.slice(1, -1).trim();
    }
  }
  return s === "" ? undefined : s;
}

// --- Auth ---

export const loginShopownerGoogleController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { code, callback_url } = req.body || {};
    const result = await loginShopownerWithGoogle({
      code,
      callback_url,
    });

    return res.status(200).json({
      msg: result.msg,
      code: result.code,
      data: result.data,
    });
  } catch (error: any) {
    console.error(
      "loginShopownerGoogleController error:",
      error?.message || error,
    );
    return res.status(500).json({
      msg: "Error login with Google",
      code: 500,
      data: null,
    });
  }
};

// export const getShopownerInfoController = async (
//   req: IUserAuthRequest,
//   res: IDataResponse,
// ) => {
//   try {
//     const userId = req.userJwt?.id;
//     if (!userId) {
//       return res.status(401).json({
//         msg: "UNAUTHORIZED",
//         code: 401,
//         data: null,
//       });
//     }

//     const result = await getShopownerInfoByUserId(userId);
//     return res.status(result.code).json({
//       msg: result.msg,
//       code: result.code,
//       data: result.data,
//     });
//   } catch (error: any) {
//     console.error("getShopownerInfoController error:", error?.message || error);
//     return res.status(500).json({
//       msg: "Internal server error",
//       code: 500,
//       data: null,
//     });
//   }
// };

// --- Dashboard ---

/**
 * GET /shopowner/income
 * Ưu tiên body { from, to } (DD-MM-YYYY); không có thì dùng days_ago (query hoặc header).
 */
export const getShopIncome = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "FORBIDDEN_NOT_SHOP_OWNER",
        code: 403,
        data: null,
      });
    }

    if (hasIncomeDateRangeBody(req.body)) {
      const rangeResult = await getShopIncomeByDateRange(
        shopId,
        req.body.from,
        req.body.to,
      );
      if (rangeResult.ok === false) {
        const msgMap: Record<string, string> = {
          INVALID_DATE: 'from/to must be valid dates in format "DD-MM-YYYY"',
          FROM_AFTER_TO: "from must not be after to",
        };
        return res.status(400).json({
          msg: msgMap[rangeResult.reason] ?? "Invalid date range",
          code: 400,
          data: null,
        });
      }
      const { result } = rangeResult;
      return res.status(result.code).json({
        msg: result.msg,
        code: result.code,
        data: result.data,
      });
    }

    const daysAgo = resolveDaysAgoFromRequest(req);
    if (!daysAgo) {
      return res.status(400).json({
        msg: 'Provide body { from, to } (DD-MM-YYYY) or days_ago (query/header) as a positive integer',
        code: 400,
        data: null,
      });
    }

    const result = await getShopIncomeInPastDays(shopId, daysAgo);
    return res.status(result.code).json({
      msg: result.msg,
      code: result.code,
      data: result.data,
    });
  } catch (error) {
    console.error("getShopIncome error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

// --- Category ---

export const shopownerCreateCategory = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const { name, description, status } = req.body || {};
    const created = await createShopCategory(shopId, {
      name,
      description,
      status,
    });

    return res.status(201).json({
      msg: "Tạo danh mục thành công",
      code: 201,
      data: created,
    });
  } catch (error) {
    console.error("shopownerCreateCategory error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

export const shopownerGetCategory = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const id = req.query.id as string | undefined;
    if (!id || id === "null") {
      return res.status(400).json({
        msg: "Thiếu id danh mục",
        code: 400,
        data: null,
      });
    }

    const category = await getShopCategoryById(shopId, id);
    if (!category) {
      return res.status(404).json({
        msg: "Không tìm thấy danh mục",
        code: 404,
        data: null,
      });
    }

    return res.status(200).json({
      msg: "Lấy danh mục thành công",
      code: 200,
      data: category,
    });
  } catch (error) {
    console.error("shopownerGetCategory error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

export const shopownerListCategories = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const { page, page_size } = parsePageSize(
      req.query.page,
      req.query.page_size,
    );

    const result = await listShopCategories(shopId, { page, page_size });
    return res.status(200).json({
      msg: "Lấy danh sách danh mục thành công",
      code: 200,
      data: result,
    });
  } catch (error) {
    console.error("shopownerListCategories error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

export const shopownerDeleteCategory = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const id = req.query.id as string | undefined;
    if (!id || id === "null") {
      return res.status(400).json({
        msg: "Thiếu id danh mục",
        code: 400,
        data: null,
      });
    }

    const result = await deleteShopCategory(shopId, id);
    if (!result.ok) {
      if (result.reason === "NOT_FOUND") {
        return res.status(404).json({
          msg: "Không tìm thấy danh mục",
          code: 404,
          data: null,
        });
      }
      return res.status(409).json({
        msg: "Danh mục đang được sản phẩm của shop sử dụng, không thể xóa",
        code: 409,
        data: null,
      });
    }

    return res.status(200).json({
      msg: "Xóa danh mục thành công",
      code: 200,
      data: { id },
    });
  } catch (error) {
    console.error("shopownerDeleteCategory error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

// --- Policy ---

export const shopownerUpsertPolicy = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const body = req.body ?? {};
    const result = await upsertShopPolicy(shopId, {
      policyTitle: body.policyTitle,
      policyContent: body.policyContent,
    });

    const payload = result.policy.get({ plain: true });
    if (result.created) {
      return res.status(201).json({
        msg: "Tạo chính sách thành công",
        code: 201,
        data: payload,
      });
    }
    return res.status(200).json({
      msg: "Cập nhật chính sách thành công",
      code: 200,
      data: payload,
    });
  } catch (error) {
    console.error("shopownerUpsertPolicy error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

export const shopownerDeleteShopPolicy = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const result = await deleteShopPolicy(shopId);
    if (!result.ok) {
      return res.status(404).json({
        msg: "Không có chính sách để xóa",
        code: 404,
        data: null,
      });
    }

    return res.status(200).json({
      msg: "Đã xóa chính sách",
      code: 200,
      data: null,
    });
  } catch (error) {
    console.error("shopownerDeleteShopPolicy error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

// --- Product ---

export const shopownerCreateProduct = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const result = await createShopProduct(shopId, req.body ?? {});
    if (result.ok === false) {
      if (result.reason === "CATEGORY_NOT_FOUND") {
        return res.status(404).json({
          msg: "Không tìm thấy danh mục (categoryId)",
          code: 404,
          data: null,
        });
      }
      const msg =
        result.reason === "CATEGORY_REQUIRED"
          ? "Thiếu danh mục: gửi categoryId hoặc object category hợp lệ"
          : "Tạo sản phẩm thất bại";
      return res.status(400).json({ msg, code: 400, data: null });
    }

    return res.status(201).json({
      msg: "Tạo sản phẩm thành công",
      code: 201,
      data: result.product,
    });
  } catch (error) {
    console.error("shopownerCreateProduct error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

export const shopownerGetProduct = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const id = req.query.id as string | undefined;
    if (!id || id === "null") {
      return res.status(400).json({
        msg: "Thiếu id sản phẩm",
        code: 400,
        data: null,
      });
    }

    const product = await getShopProductById(shopId, id);
    if (!product) {
      return res.status(404).json({
        msg: "Không tìm thấy sản phẩm",
        code: 404,
        data: null,
      });
    }

    return res.status(200).json({
      msg: "Lấy sản phẩm thành công",
      code: 200,
      data: product,
    });
  } catch (error) {
    console.error("shopownerGetProduct error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

export const shopownerListProducts = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const { page, page_size } = parsePageSize(
      req.query.page,
      req.query.page_size ?? (req.query as { paeg_size?: unknown }).paeg_size,
    );

    const result = await listShopProducts(shopId, { page, page_size });
    return res.status(200).json({
      msg: "Lấy danh sách sản phẩm thành công",
      code: 200,
      data: result,
    });
  } catch (error) {
    console.error("shopownerListProducts error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/** POST /shopowner/manager-quantity?id= — body: quantity (+/-), reason: rotten | import */
export const shopownerAdjustProductQuantity = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const id = req.query.id as string | undefined;
    if (!id || id === "null") {
      return res.status(400).json({
        msg: "Thiếu id sản phẩm",
        code: 400,
        data: null,
      });
    }

    const result = await adjustShopProductStock(shopId, id, req.body ?? {});
    if (result.ok === false) {
      if (result.reason === "NOT_FOUND") {
        return res.status(404).json({
          msg: "Không tìm thấy sản phẩm",
          code: 404,
          data: null,
        });
      }
      if (result.reason === "INVALID_REASON") {
        return res.status(400).json({
          msg: "reason phải là rotten hoặc import",
          code: 400,
          data: null,
        });
      }
      if (result.reason === "INVALID_QUANTITY") {
        return res.status(400).json({
          msg: "quantity phải là số nguyên",
          code: 400,
          data: null,
        });
      }
      return res.status(400).json({
        msg: "Tồn kho không đủ sau khi điều chỉnh",
        code: 400,
        data: null,
      });
    }

    return res.status(200).json({
      msg: "Cập nhật tồn kho thành công",
      code: 200,
      data: result.stockDetail.get({ plain: true }),
    });
  } catch (error) {
    console.error("shopownerAdjustProductQuantity error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/** GET /shopowner/manager-quantity?id=&page=&page_size= — lịch sử stock_detail */
export const shopownerListProductStockDetails = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const id = req.query.id as string | undefined;
    if (!id || id === "null") {
      return res.status(400).json({
        msg: "Thiếu id sản phẩm",
        code: 400,
        data: null,
      });
    }

    const { page, page_size } = parsePageSize(
      req.query.page,
      req.query.page_size,
    );

    const result = await listShopProductStockDetails(shopId, id, {
      page,
      page_size,
    });
    if (!result.ok) {
      return res.status(404).json({
        msg: "Không tìm thấy sản phẩm",
        code: 404,
        data: null,
      });
    }

    return res.status(200).json({
      msg: "Lấy lịch sử tồn kho thành công",
      code: 200,
      data: result.data,
    });
  } catch (error) {
    console.error("shopownerListProductStockDetails error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

export const shopownerUpdateProductImage = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const form = new IncomingForm({
      multiples: false,
      keepExtensions: true,
      maxFileSize: 15 * 1024 * 1024,
    });

    let fields: FormidableFields;
    let files: FormidableFiles;
    try {
      [fields, files] = await form.parse(req);
    } catch (parseErr) {
      console.error("shopownerUpdateProductImage parse:", parseErr);
      return res.status(400).json({
        msg: "Không đọc được form upload (multipart)",
        code: 400,
        data: null,
      });
    }

    const productId =
      firstFormField(fields.productId)?.trim() ||
      (typeof req.query.productId === "string"
        ? req.query.productId.trim()
        : "");

    if (!productId) {
      return res.status(400).json({
        msg: "Thiếu productId (form field hoặc query)",
        code: 400,
        data: null,
      });
    }

    const fileField = files.file;
    const uploaded = Array.isArray(fileField) ? fileField[0] : fileField;
    if (!uploaded?.filepath) {
      return res.status(400).json({
        msg: "Thiếu file ảnh (field name: file)",
        code: 400,
        data: null,
      });
    }

    let imageDataUri: string;
    try {
      const buf = await fs.readFile(uploaded.filepath);
      const mime = uploaded.mimetype || "application/octet-stream";
      imageDataUri = `data:${mime};base64,${buf.toString("base64")}`;
    } finally {
      try {
        await fs.unlink(uploaded.filepath);
      } catch {
        /* temp file may already be removed */
      }
    }

    const product = await updateShopProductImage(
      shopId,
      productId,
      imageDataUri,
    );
    if (!product) {
      return res.status(404).json({
        msg: "Không tìm thấy sản phẩm",
        code: 404,
        data: null,
      });
    }

    return res.status(200).json({
      msg: "Cập nhật ảnh sản phẩm thành công",
      code: 200,
      data: product,
    });
  } catch (error) {
    console.error("shopownerUpdateProductImage error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

export const shopownerDeleteProduct = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const id = req.query.id as string | undefined;
    if (!id || id === "null") {
      return res.status(400).json({
        msg: "Thiếu id sản phẩm",
        code: 400,
        data: null,
      });
    }

    const ok = await deleteShopProduct(shopId, id);
    if (!ok) {
      return res.status(404).json({
        msg: "Không tìm thấy sản phẩm",
        code: 404,
        data: null,
      });
    }

    return res.status(200).json({
      msg: "Xóa sản phẩm thành công",
      code: 200,
      data: { id },
    });
  } catch (error) {
    console.error("shopownerDeleteProduct error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

export const getShopInfo = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  // api nay co logic la query vao bang shop_infos de lay thong tin cua shop
  try {
    const shopInfo = await shopOwnerService.getDefaultShopInfo();
    return res.status(200).json({
      msg: "Lấy thông tin shop mặc định thành công",
      code: 200,
      data: shopInfo,
    });
  } catch (error) {
    console.error("getShopInfo error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/**
 * GET /public/categories — danh mục `active`, mỗi tên trùng chỉ 1 row đại diện (không JWT).
 * Output: `data` là mảng category `{ id, shopId, name, description, status, createdAt, updatedAt }`.
 */
export const getPublicCategories = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const items = await shopOwnerService.listPublicActiveCategories();
    return res.status(200).json({
      msg: "Lấy danh sách danh mục thành công",
      code: 200,
      data: items,
    });
  } catch (error) {
    console.error("getPublicCategories error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/** GET công khai — quảng cáo đang `active` (ảnh base64 hoặc đường dẫn `/videos/...`). */
export const getPublicActiveAdvertisement = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const data = await shopOwnerService.getPublicActiveAdvertisement();
    return res.status(200).json({
      msg: "OK",
      code: 200,
      data,
    });
  } catch (error) {
    console.error("getPublicActiveAdvertisement error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/**
 * POST /public/product-search — tìm sản phẩm theo tên (không JWT).
 * Body: `{ "keyWord": "..." }`. Header: `page`, `page_size`.
 */
/**
 * POST/GET /public/product-sort
 *
 * Query: shopId (uuid), page?, page_size?
 * Body (POST): { sortStrategy: "price-descend" | "price-ascend" | "best-seller" }
 * GET: thêm sortStrategy trên query.
 *
 * Output data: { items, pagination, sortStrategy } — mỗi item có category, flash_sale_campaign;
 * best-seller thêm sold_quantity, bestseller_label.
 */
export const sortPublicProducts = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopIdRaw = req.query.shopId ?? req.query.shop_id;
    const shopId =
      shopIdRaw != null && typeof shopIdRaw !== "object"
        ? String(shopIdRaw).trim()
        : "";

    const strategyRaw =
      req.body?.sortStrategy ?? req.query.sortStrategy ?? req.query.sort_strategy;
    const sortStrategy =
      strategyRaw != null && typeof strategyRaw !== "object"
        ? String(strategyRaw).trim()
        : "";

    if (!shopId) {
      return res.status(400).json({
        msg: "shopId is required",
        code: 400,
        data: null,
      });
    }

    if (
      !["price-descend", "price-ascend", "best-seller"].includes(sortStrategy)
    ) {
      return res.status(400).json({
        msg: "sortStrategy must be price-descend, price-ascend, or best-seller",
        code: 400,
        data: null,
      });
    }

    const { page, page_size } = parsePageSize(
      req.query.page != null ? String(req.query.page) : undefined,
      req.query.page_size != null ? String(req.query.page_size) : undefined,
    );

    const result = await shopOwnerService.sortPublicProductsByStrategy(
      shopId,
      sortStrategy as shopOwnerService.ProductSortStrategy,
      { page, page_size },
    );

    return res.status(200).json({
      msg: "Sắp xếp sản phẩm thành công",
      code: 200,
      data: {
        items: result.items,
        pagination: result.pagination,
        sortStrategy: result.sortStrategy,
      },
    });
  } catch (error) {
    console.error("sortPublicProducts error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

export const searchPublicProducts = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const rawKeyword =
      req.body?.keyWord ?? req.body?.keyword ?? req.body?.KeyWord;
    const keyWord =
      rawKeyword != null && typeof rawKeyword !== "object"
        ? String(rawKeyword)
        : "";

    const { page, page_size } = parsePageSize(
      req.headers.page,
      req.headers.page_size,
    );

    const result = await shopOwnerService.searchPublicProductsByName(keyWord, {
      page,
      page_size,
    });

    if (!result.ok) {
      return res.status(400).json({
        msg: "keyWord is required",
        code: 400,
        data: null,
      });
    }

    return res.status(200).json({
      msg: "Tìm kiếm sản phẩm thành công",
      code: 200,
      data: {
        items: result.items,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    console.error("searchPublicProducts error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/**
 * POST multipart `file` — ảnh → base64 (data URL) trong DB; video → file trong `src/public/videos`, DB lưu `/videos/...`.
 * Một thời điểm chỉ một row `active` (logic service).
 */
export const shopownerCreateAdvertisement = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const form = new IncomingForm({
      multiples: false,
      keepExtensions: true,
      maxFileSize: ADV_UPLOAD_MAX_BYTES,
    });

    let files: FormidableFiles;
    try {
      [, files] = await form.parse(req);
    } catch (parseErr) {
      console.error("shopownerCreateAdvertisement parse:", parseErr);
      return res.status(400).json({
        msg: "Không đọc được form upload (multipart)",
        code: 400,
        data: null,
      });
    }

    const fileField = files.file;
    const uploaded = Array.isArray(fileField) ? fileField[0] : fileField;
    if (!uploaded?.filepath) {
      return res.status(400).json({
        msg: "Thiếu file (field name: file)",
        code: 400,
        data: null,
      });
    }

    const mime = uploaded.mimetype || "application/octet-stream";
    const extRaw = path
      .extname(uploaded.originalFilename || uploaded.filepath || "")
      .replace(/^\./, "");
    const kind = classifyAdvUpload(mime, extRaw);
    console.log("kind", kind);
    if (!kind) {
      try {
        await fs.unlink(uploaded.filepath);
      } catch {
        /* ignore */
      }
      return res.status(400).json({
        msg: "Chỉ hỗ trợ file ảnh hoặc video (video/mp4, webm, mov, …)",
        code: 400,
        data: null,
      });
    }

    let mediaRef: string;
    console.log("kind", kind);
    if (kind === "video") {
      await fs.mkdir(ADV_PUBLIC_VIDEOS_DIR, { recursive: true });
      const vidExt = resolveVideoFileExtension(mime, extRaw);
      const destName = `${randomUUID()}.${vidExt}`;
      const destPath = path.join(ADV_PUBLIC_VIDEOS_DIR, destName);
      try {
        await fs.copyFile(uploaded.filepath, destPath);
        console.log("destPath", destPath);
      } finally {
        try {
          await fs.unlink(uploaded.filepath);
        } catch {
          /* temp file may already be removed */
        }
      }
      mediaRef = `/videos/${destName}`;
    } else {
      try {
        const buf = await fs.readFile(uploaded.filepath);
        mediaRef = `data:${mime};base64,${buf.toString("base64")}`;
      } finally {
        try {
          await fs.unlink(uploaded.filepath);
        } catch {
          /* temp file may already be removed */
        }
      }
    }

    const row = await createShopAdvertisementFromUpload(mediaRef);

    return res.status(200).json({
      msg: "Tạo quảng cáo thành công",
      code: 200,
      data: row.get({ plain: true }),
    });
  } catch (error) {
    console.error("shopownerCreateAdvertisement error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/** GET — danh sách advertisements (mọi trạng thái), phân trang. */
export const shopownerListAdvertisements = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const { page, page_size } = parsePageSize(
      req.query.page,
      req.query.page_size,
    );

    const data = await listShopAdvertisements({ page, page_size });

    return res.status(200).json({
      msg: "Lấy danh sách quảng cáo thành công",
      code: 200,
      data,
    });
  } catch (error) {
    console.error("shopownerListAdvertisements error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/**
 * POST — cập nhật status (`active` | `inactive`).
 * Query: adv_id. Chỉ một row `active` tại một thời điểm.
 */
export const shopownerUpdateAdvertisementStatus = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const advIdRaw = req.query.adv_id;
    const advId =
      typeof advIdRaw === "string" && advIdRaw !== "null" && advIdRaw.trim()
        ? advIdRaw.trim()
        : "";

    if (!advId) {
      return res.status(400).json({
        msg: "Thiếu adv_id (query)",
        code: 400,
        data: null,
      });
    }

    const status = (req.body as { status?: unknown })?.status;
    const result = await updateShopAdvertisementStatus(advId, status);

    if (result.ok === false) {
      if (result.reason === "NOT_FOUND") {
        return res.status(404).json({
          msg: "Không tìm thấy quảng cáo",
          code: 404,
          data: null,
        });
      }
      return res.status(400).json({
        msg: "status phải là active hoặc inactive",
        code: 400,
        data: null,
      });
    }

    return res.status(200).json({
      msg: "Cập nhật trạng thái quảng cáo thành công",
      code: 200,
      data: result.advertisement.get({ plain: true }),
    });
  } catch (error) {
    console.error("shopownerUpdateAdvertisementStatus error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/**
 * POST /shopowner/Flscamp — tạo flash sale (body snake_case như client).
 */
export const shopownerCreateFlashSaleCampaign = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const body = req.body as Record<string, unknown>;
    const result = await createShopFlashSaleCampaign(shopId, body);

    if (result.ok === false) {
      const msgMap: Record<string, string> = {
        INVALID_PRODUCT: "Sản phẩm không thuộc shop hoặc không tồn tại",
        INVALID_DATES:
          "campaign_start_at / expired_in không hợp lệ hoặc không đúng thứ tự thời gian",
        INVALID_NUMBERS:
          "total_quantity (số nguyên > 0) và discount (0–100) không hợp lệ",
        BAD_REQUEST: "Thiếu product_target_id",
      };
      return res.status(400).json({
        msg: msgMap[result.reason] ?? "Dữ liệu không hợp lệ",
        code: 400,
        data: null,
      });
    }

    return res.status(200).json({
      msg: "Tạo chiến dịch flash sale thành công",
      code: 200,
      data: result.campaign.get({ plain: true }),
    });
  } catch (error) {
    console.error("shopownerCreateFlashSaleCampaign error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/** GET /shopowner/Flscamps — mọi trạng thái; tự expire các row active đã quá expired_in. */
export const shopownerListFlashSaleCampaigns = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const { page, page_size } = parsePageSize(
      req.query.page,
      req.query.page_size,
    );

    const data = await listShopFlashSaleCampaigns(shopId, { page, page_size });

    return res.status(200).json({
      msg: "Lấy danh sách flash sale thành công",
      code: 200,
      data,
    });
  } catch (error) {
    console.error("shopownerListFlashSaleCampaigns error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/**
 * POST /shopowner/Flscamp/updt-status?flash_sale_campaign_id=
 * Chỉ active ↔ inactive; row đã expired (hoặc vừa hết hạn) không đổi được.
 */
export const shopownerUpdateFlashSaleCampaignStatus = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const idRaw = req.query.flash_sale_campaign_id;
    const campaignId =
      typeof idRaw === "string" && idRaw !== "null" && idRaw.trim() !== ""
        ? idRaw.trim()
        : "";

    if (!campaignId) {
      return res.status(400).json({
        msg: "Thiếu flash_sale_campaign_id (query)",
        code: 400,
        data: null,
      });
    }

    const status = (req.body as { status?: unknown })?.status;
    const result = await updateShopFlashSaleCampaignStatus(
      shopId,
      campaignId,
      status,
    );

    if (result.ok === false) {
      if (result.reason === "NOT_FOUND") {
        return res.status(404).json({
          msg: "Không tìm thấy chiến dịch flash sale",
          code: 404,
          data: null,
        });
      }
      if (result.reason === "EXPIRED_LOCKED") {
        return res.status(400).json({
          msg: "Chiến dịch đã hết hạn (expired), không thể đổi trạng thái",
          code: 400,
          data: null,
        });
      }
      return res.status(400).json({
        msg: "status phải là active hoặc inactive",
        code: 400,
        data: null,
      });
    }

    return res.status(200).json({
      msg: "Cập nhật trạng thái flash sale thành công",
      code: 200,
      data: result.campaign.get({ plain: true }),
    });
  } catch (error) {
    console.error("shopownerUpdateFlashSaleCampaignStatus error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/** DELETE /shopowner/Flscamp?flash_sale_campaign_id= */
export const shopownerDeleteFlashSaleCampaign = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const idRaw = req.query.flash_sale_campaign_id;
    const campaignId =
      typeof idRaw === "string" && idRaw !== "null" && idRaw.trim() !== ""
        ? idRaw.trim()
        : "";

    if (!campaignId) {
      return res.status(400).json({
        msg: "Thiếu flash_sale_campaign_id (query)",
        code: 400,
        data: null,
      });
    }

    const result = await deleteShopFlashSaleCampaign(shopId, campaignId);
    if (!result.ok) {
      return res.status(404).json({
        msg: "Không tìm thấy chiến dịch flash sale",
        code: 404,
        data: null,
      });
    }

    return res.status(200).json({
      msg: "Xóa chiến dịch flash sale thành công",
      code: 200,
      data: null,
    });
  } catch (error) {
    console.error("shopownerDeleteFlashSaleCampaign error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/**
 * POST multipart — field `product_id`, `comment` (tùy chọn), `file` (tùy chọn), `star` (tùy chọn, 1–5).
 * Phải có ít nhất một trong: nội dung comment, file hoặc star. Ảnh → data URL base64 trong DB; video → `src/public/video_comment`, DB lưu `/video_comment/...`.
 * Auth: JWT (mọi role đăng nhập), không bắt buộc shop owner.
 */
export const shopownerCreateProductComment = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const userId = req.userJwt?.id;
    if (!userId) {
      return res.status(401).json({
        msg: "UNAUTHORIZED",
        code: 401,
        data: null,
      });
    }

    const form = new IncomingForm({
      multiples: false,
      keepExtensions: true,
      maxFileSize: COMMENT_UPLOAD_MAX_BYTES,
    });

    let fields: FormidableFields;
    let files: FormidableFiles;
    try {
      [fields, files] = await form.parse(req);
    } catch (parseErr) {
      console.error("shopownerCreateProductComment parse:", parseErr);
      return res.status(400).json({
        msg: "Không đọc được form upload (multipart)",
        code: 400,
        data: null,
      });
    }

    const productIdRaw =
      stripOuterQuotes(firstFormField(fields.product_id)) ||
      stripOuterQuotes(firstFormField(fields.productId));
    const productId = productIdRaw?.trim() || "";
    if (!productId) {
      return res.status(400).json({
        msg: "Thiếu product_id (form field)",
        code: 400,
        data: null,
      });
    }

    const commentText =
      stripOuterQuotes(firstFormField(fields.comment))?.trim() || null;

    const starRaw = stripOuterQuotes(firstFormField(fields.star))?.trim();
    let star: number | null = null;
    if (starRaw) {
      const starNum = Number.parseInt(starRaw, 10);
      if (!Number.isInteger(starNum) || starNum < 1 || starNum > 5) {
        return res.status(400).json({
          msg: "star phải là số nguyên từ 1 đến 5",
          code: 400,
          data: null,
        });
      }
      star = starNum;
    }

    const fileField = files.file;
    const uploaded = Array.isArray(fileField) ? fileField[0] : fileField;

    if (!commentText && !uploaded?.filepath && star == null) {
      return res.status(400).json({
        msg: "Cần có ít nhất nội dung comment, file đính kèm hoặc đánh giá sao",
        code: 400,
        data: null,
      });
    }

    let fileRef: string | null = null;
    let fileType: string | null = null;

    if (uploaded?.filepath) {
      const mime = uploaded.mimetype || "application/octet-stream";
      const extRaw = path
        .extname(uploaded.originalFilename || uploaded.filepath || "")
        .replace(/^\./, "");
      const kind = classifyAdvUpload(mime, extRaw);
      if (!kind) {
        try {
          await fs.unlink(uploaded.filepath);
        } catch {
          /* ignore */
        }
        return res.status(400).json({
          msg: "Chỉ hỗ trợ file ảnh hoặc video",
          code: 400,
          data: null,
        });
      }

      if (kind === "video") {
        await fs.mkdir(COMMENT_VIDEO_DIR, { recursive: true });
        const vidExt = resolveVideoFileExtension(mime, extRaw);
        const destName = `${randomUUID()}.${vidExt}`;
        const destPath = path.join(COMMENT_VIDEO_DIR, destName);
        try {
          await fs.copyFile(uploaded.filepath, destPath);
        } finally {
          try {
            await fs.unlink(uploaded.filepath);
          } catch {
            /* ignore */
          }
        }
        fileRef = `/video_comment/${destName}`;
        fileType = mime;
      } else {
        try {
          const buf = await fs.readFile(uploaded.filepath);
          fileRef = `data:${mime};base64,${buf.toString("base64")}`;
          fileType = mime;
        } finally {
          try {
            await fs.unlink(uploaded.filepath);
          } catch {
            /* ignore */
          }
        }
      }
    }

    const isBought = await userHasSuccessfulPurchaseForProduct(
      userId,
      productId,
    );

    const created = await createProductCommentRecord({
      userId,
      productId,
      isBought,
      comment: commentText,
      file: fileRef,
      fileType,
      star,
    });

    if (!created.ok) {
      return res.status(404).json({
        msg: "Không tìm thấy sản phẩm",
        code: 404,
        data: null,
      });
    }

    return res.status(200).json({
      msg: "Đăng bình luận thành công",
      code: 200,
      data: created.row.get({ plain: true }),
    });
  } catch (error) {
    console.error("shopownerCreateProductComment error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/**
 * GET ?product_id=&page=&page_size= — danh sách comment của sản phẩm (kèm user).
 * Auth: JWT, không bắt buộc shop owner.
 */
export const shopownerListProductComments = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    if (!req.userJwt?.id) {
      return res.status(401).json({
        msg: "UNAUTHORIZED",
        code: 401,
        data: null,
      });
    }

    const productIdRaw = req.query.product_id ?? req.query.productId;
    const productId =
      typeof productIdRaw === "string" &&
      productIdRaw !== "null" &&
      productIdRaw.trim() !== ""
        ? productIdRaw.trim()
        : "";

    if (!productId) {
      return res.status(400).json({
        msg: "Thiếu product_id (query)",
        code: 400,
        data: null,
      });
    }

    const { page, page_size } = parsePageSize(
      req.query.page,
      req.query.page_size,
    );

    const result = await listProductComments(productId, { page, page_size });
    if (!result.ok) {
      return res.status(404).json({
        msg: "Không tìm thấy sản phẩm",
        code: 404,
        data: null,
      });
    }

    return res.status(200).json({
      msg: "Lấy danh sách bình luận thành công",
      code: 200,
      data: result.data,
    });
  } catch (error) {
    console.error("shopownerListProductComments error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/**
 * POST /shopowner/voucher — shop owner tạo voucher (body: name, discount).
 */
export const shopownerCreateVoucher = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const body = req.body as Record<string, unknown>;
    const name = body.name;
    const discount = body.discount;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        msg: "name is required (non-empty string)",
        code: 400,
        data: null,
      });
    }
    if (discount === undefined || discount === null) {
      return res.status(400).json({
        msg: "discount is required (integer >= 0)",
        code: 400,
        data: null,
      });
    }

    const result = await shopownerCreateVoucherRecord({
      name,
      discount: Number(discount),
    });

    if (result.ok === false) {
      const msgMap: Record<string, string> = {
        NAME_REQUIRED: "name is required",
        INVALID_DISCOUNT: "discount must be a non-negative integer",
      };
      return res.status(400).json({
        msg: msgMap[result.reason] ?? "Invalid input",
        code: 400,
        data: null,
      });
    }

    return res.status(200).json({
      msg: "Tạo voucher thành công",
      code: 200,
      data: result.voucher.get({ plain: true }),
    });
  } catch (error) {
    console.error("shopownerCreateVoucher error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/**
 * GET /shopowner/vouchers?page=&page_size= — mọi user đã JWT: danh sách voucher (phân trang).
 */
export const listVouchersAuthenticated = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    if (!req.userJwt?.id) {
      return res.status(401).json({
        msg: "UNAUTHORIZED",
        code: 401,
        data: null,
      });
    }

    const { page, page_size } = parsePageSize(
      req.query.page,
      req.query.page_size,
    );

    const data = await listAllVouchers({ page, page_size });

    return res.status(200).json({
      msg: "Lấy danh sách voucher thành công",
      code: 200,
      data,
    });
  } catch (error) {
    console.error("listVouchersAuthenticated error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/**
 * POST /shopowner/banned-user
 * Input body: { email: string, status: "active" | "inactive" }
 * Output data: { id, email, status, ... } (user sau khi cập nhật, không có password)
 */
export const shopownerUpdateUserStatus = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const { email, status } = req.body as {
      email: string;
      status: "active" | "inactive";
    };

    const result = await updateUserStatusByEmail(email, status);
    if (!result.ok) {
      return res.status(404).json({
        msg: "Không tìm thấy user với email này",
        code: 404,
        data: null,
      });
    }

    const { password: _pw, ...userSafe } = result.user;
    return res.status(200).json({
      msg: "Cập nhật trạng thái user thành công",
      code: 200,
      data: userSafe,
    });
  } catch (error) {
    console.error("shopownerUpdateUserStatus error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/**
 * GET /shopowner/users?page=&page_size=
 * Output data: { items: User[], pagination }; mỗi user có order_stats:
 * { total, cart, processing, paid, order, cancel, failed }
 */
export const shopownerListUsers = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const shopId = req.shopId;
    if (!shopId) {
      return res.status(403).json({
        msg: "Không xác định được shop",
        code: 403,
        data: null,
      });
    }

    const { page, page_size } = parsePageSize(
      req.query.page,
      req.query.page_size,
    );

    const data = await listUsersWithOrderStats({ page, page_size });

    return res.status(200).json({
      msg: "Lấy danh sách user thành công",
      code: 200,
      data,
    });
  } catch (error) {
    console.error("shopownerListUsers error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};
