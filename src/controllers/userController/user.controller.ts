import "../../config/config";
import { Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import { User } from "../../models/modal";
import { randomUUID } from "crypto";
import {
  IDataResponse,
  IUserAuthRequest,
} from "../../interface/request/request";
import {
  appendConversationMessage,
  getPolicyContentByShopId,
  getUserShopConversationHistory,
  streamPolicyBotAnswer,
} from "../../services/userService/userService";
import {
  addProductToDefaultUserCart,
  getUserCartOrderItemsWithProduct,
  getUserCheckoutOrdersWithItems,
  getUserOrderPaymentStatus,
  listUserOrdersDeliveryStatus,
  removeProductFromUserCart,
  updateCartProductQuantity,
  cancelUserOrder,
} from "../../services/userService/userService";
import {
  claimVoucherWithUserCredit,
  checkoutCreatePayment,
  createCheckoutOrderFromCart,
  createCheckoutOrderFromItems,
  CheckoutOrderItemInput,
} from "../../services/userService/userService";
import {
  getUserProductById,
  getUserCreditDetailByUserId,
  listUserActiveVouchersByUserId,
  listUserProductsByShop,
} from "../../services/userService/userService";
import { listUserShops } from "../../services/userService/userService";
import {
  signUpUser,
  SignUpServiceError,
  verifyEmailByToken,
  VerifyEmailServiceError,
} from "../../services/userService/signUp.service";
import {
  signInWithPassword,
  takePasswordResetCode,
  forgotPassword,
  changePassword,
  PasswordAuthServiceError,
} from "../../services/userService/passwordAuth.service";

interface GoogleOAuthPayload {
  code: string;
  callback_url?: string;
}

const createJwtToken = (payload: any, role?: string | null) => {
  const isShopowner = role === "shopowner";
  const secret = isShopowner
    ? process.env.JWT_SECRET_SHOPOWNER_LOGIN!
    : process.env.JWT_SECRET_USER_LOGIN!;
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRE ?? "7d",
  });
};

/**
 * POST /user/sign-up — đăng ký tài khoản user (username + password), gửi link xác minh email.
 */
export const signUp = async (req: Request, res: Response) => {
  try {
    const { sentTo } = await signUpUser({
      fullName: req.body.fullName,
      userName: req.body.userName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      password: req.body.password,
    });

    return res.status(200).json({
      code: 0,
      msg: "Vui lòng kiểm tra email để xác minh tài khoản",
      data: { sentTo },
    });
  } catch (error) {
    if (error instanceof SignUpServiceError) {
      return res.status(400).json({
        code: error.code,
        msg: error.message,
        data: null,
      });
    }
    console.error("signUp error:", error);
    return res.status(500).json({
      code: 500,
      msg: "INTERNAL_SERVER_ERROR",
      data: null,
    });
  }
};

export const signUpHandler = signUp as unknown as RequestHandler;

const getVerifyEmailSuccessRedirectUrl = (): string => {
  if (process.env.VERIFY_EMAIL_SUCCESS_REDIRECT_URL) {
    return process.env.VERIFY_EMAIL_SUCCESS_REDIRECT_URL;
  }
  const feBase = (process.env.FRONTEND_URL_DEV || "http://localhost:2989").replace(
    /\/$/,
    "",
  );
  return `${feBase}/user-login`;
};

/**
 * GET /user/verify-email?token=123456 — xác minh email, tạo user từ payload Redis.
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const token =
      typeof req.query.token === "string" ? req.query.token : "";

    await verifyEmailByToken(token);

    const redirectUrl = `${getVerifyEmailSuccessRedirectUrl()}?verified=1`;
    return res.redirect(302, redirectUrl);
  } catch (error) {
    if (error instanceof VerifyEmailServiceError) {
      return res.status(400).json({
        code: error.code,
        msg: error.message,
        data: null,
      });
    }
    console.error("verifyEmail error:", error);
    return res.status(500).json({
      code: 500,
      msg: "INTERNAL_SERVER_ERROR",
      data: null,
    });
  }
};

export const verifyEmailHandler = verifyEmail as unknown as RequestHandler;

/**
 * POST /user/sign-in-pw — đăng nhập bằng email và mật khẩu (role user).
 */
export const signInWithPasswordHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { user, jwtPayload } = await signInWithPassword({
      email: req.body.email,
      password: req.body.password,
    });

    const token = createJwtToken(jwtPayload, "user");

    return res.status(200).json({
      code: 0,
      msg: "Đăng nhập thành công",
      data: { token, user },
    });
  } catch (error) {
    if (error instanceof PasswordAuthServiceError) {
      return res.status(400).json({
        code: error.code,
        msg: error.message,
        data: null,
      });
    }
    console.error("signInWithPassword error:", error);
    return res.status(500).json({
      code: 500,
      msg: "INTERNAL_SERVER_ERROR",
      data: null,
    });
  }
};

export const signInWithPasswordRouteHandler =
  signInWithPasswordHandler as unknown as RequestHandler;

/**
 * POST /user/tke-code — gửi mã khôi phục mật khẩu qua email.
 */
export const takeResetCode = async (req: Request, res: Response) => {
  try {
    const { sentTo } = await takePasswordResetCode({
      email: req.body.email,
    });

    return res.status(200).json({
      code: 0,
      msg: "Mã khôi phục đã được gửi đến email của bạn",
      data: { sentTo },
    });
  } catch (error) {
    if (error instanceof PasswordAuthServiceError) {
      return res.status(400).json({
        code: error.code,
        msg: error.message,
        data: null,
      });
    }
    console.error("takeResetCode error:", error);
    return res.status(500).json({
      code: 500,
      msg: "INTERNAL_SERVER_ERROR",
      data: null,
    });
  }
};

export const takeResetCodeHandler = takeResetCode as unknown as RequestHandler;

/**
 * POST /user/fg-pasw — đặt lại mật khẩu bằng mã OTP (email đối chiếu từ Redis theo code).
 */
export const forgotPasswordHandler = async (req: Request, res: Response) => {
  try {
    await forgotPassword({
      email: req.body.email,
      new_password: req.body.new_password,
      code: req.body.code,
    });

    return res.status(200).json({
      code: 0,
      msg: "Đặt lại mật khẩu thành công",
      data: null,
    });
  } catch (error) {
    if (error instanceof PasswordAuthServiceError) {
      return res.status(400).json({
        code: error.code,
        msg: error.message,
        data: null,
      });
    }
    console.error("forgotPassword error:", error);
    return res.status(500).json({
      code: 500,
      msg: "INTERNAL_SERVER_ERROR",
      data: null,
    });
  }
};

export const forgotPasswordRouteHandler =
  forgotPasswordHandler as unknown as RequestHandler;

/**
 * POST /user/chag-pasw — đổi mật khẩu (JWT, provider local/password).
 */
export const changePasswordHandler = async (
  req: IUserAuthRequest,
  res: Response,
) => {
  try {
    const email = req.userJwt?.email?.trim().toLowerCase();
    if (!email) {
      return res.status(401).json({
        code: 401,
        msg: "UNAUTHORIZED",
        data: null,
      });
    }

    await changePassword({
      email,
      old_password: req.body.old_password,
      new_password: req.body.new_password,
    });

    return res.status(200).json({
      code: 0,
      msg: "Đổi mật khẩu thành công",
      data: null,
    });
  } catch (error) {
    if (error instanceof PasswordAuthServiceError) {
      return res.status(400).json({
        code: error.code,
        msg: error.message,
        data: null,
      });
    }
    console.error("changePassword error:", error);
    return res.status(500).json({
      code: 500,
      msg: "INTERNAL_SERVER_ERROR",
      data: null,
    });
  }
};

export const changePasswordRouteHandler =
  changePasswordHandler as unknown as RequestHandler;

export const loginWithGoogle = async (req: Request, res: Response) => {
  try {
    const { code, callback_url }: GoogleOAuthPayload = req.body;
    console.log("Receive request from :");
    if (!code) {
      return res.status(400).json({ msg: "Missing code", code: 400 });
    }

    const redirectUri =
      callback_url || process.env.GOOGLE_REDIRECT_URI || undefined;
    console.log("redirectUri", redirectUri);
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    );
    console.log("process.env.GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID);
    console.log(
      "process.env.GOOGLE_CLIENT_SECRET",
      process.env.GOOGLE_CLIENT_SECRET,
    );
    const { tokens } = await client.getToken({
      code,
      redirect_uri: redirectUri,
    });

    if (!tokens.access_token) {
      return res
        .status(400)
        .json({ msg: "Cannot get access_token from Google", code: 400 });
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
      return res
        .status(400)
        .json({ msg: "Cannot get email from Google", code: 400 });
    }

    let user = await User.findOne({ where: { email } });

    if (!user) {
      const totalUsers = await User.count();
      const role = totalUsers === 0 ? "shopowner" : "user";
      user = await User.create({
        id: randomUUID(),
        email,
        name: name || email,
        avatar: picture || null,
        provider: "google",
        role,
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
    console.log("Request login with Google successfully", user.email);
    const userPlain =
      typeof (user as { get?: (opts: { plain: boolean }) => unknown }).get ===
      "function"
        ? (
            user as {
              get: (opts: { plain: boolean }) => Record<string, unknown>;
            }
          ).get({ plain: true })
        : user;
    return res.status(200).json({
      msg: "Login with Google successfully",
      code: 0,
      data: {
        token,
        user: userPlain,
      },
    });
  } catch (error: any) {
    console.log("error", error);
    console.error("Error login with Google:", error?.message || error);
    return res.status(500).json({
      msg: "Error login with Google",
      code: 500,
    });
  }
};

// --- Shared helpers ---

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

function isValidId(v: unknown): v is string {
  return typeof v === "string" && v.trim() !== "" && v !== "null";
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim() !== "" && v !== "null";
}

function isCheckoutItemArray(v: unknown): v is CheckoutOrderItemInput[] {
  return Array.isArray(v);
}

function isValidIdParam(v: unknown): v is string {
  return (
    typeof v === "string" &&
    v.trim() !== "" &&
    v !== "null" &&
    v !== "undefined"
  );
}

// --- Shop ---

/**
 * GET /user/shops?page=1&page_size=5
 */
export const getUserShops = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const { page, page_size } = parsePageSize(
      req.query.page,
      req.query.page_size,
    );
    const result = await listUserShops({ page, page_size });

    return res.status(200).json({
      msg: "Get shops successfully",
      code: 200,
      data: result,
    });
  } catch (error) {
    console.error("getUserShops error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/**
 * GET /user/vouchers?page=1&page_size=5
 * Danh sách voucher active của user hiện tại.
 */
export const postUserVouchers = async (
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

    const { page, page_size } = parsePageSize(
      req.query.page,
      req.query.page_size,
    );
    const result = await listUserActiveVouchersByUserId(userId, {
      page,
      page_size,
    });

    return res.status(200).json({
      msg: "Get user vouchers successfully",
      code: 200,
      data: result,
    });
  } catch (error) {
    console.error("postUserVouchers error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

export const getMyCredit = async (
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

    const result = await getUserCreditDetailByUserId(userId);
    return res.status(result.code).json({
      msg: result.msg,
      code: result.code,
      data: result.data,
    });
  } catch (error) {
    console.error("getMyCredit error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

// --- Product ---

/**
 * GET /user/products
 * - Có `product_id`: lấy chi tiết một sản phẩm (kèm category).
 * - Có `shop_id`: lấy danh sách sản phẩm của shop (`page`, `page_size`; mặc định 1 và 10).
 * - Ưu tiên `product_id` nếu đồng thời có cả hai.
 */
export const getUserProducts = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const productIdRaw = req.query.product_id;
    const shopIdRaw = req.query.shop_id;

    if (isValidIdParam(productIdRaw)) {
      const product = await getUserProductById(productIdRaw.trim());
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
    }

    if (isValidIdParam(shopIdRaw)) {
      const { page, page_size } = parsePageSize(
        req.query.page,
        req.query.page_size ?? (req.query as { paeg_size?: string }).paeg_size,
      );
      const result = await listUserProductsByShop(shopIdRaw.trim(), {
        page,
        page_size,
      });
      return res.status(200).json({
        msg: "Lấy danh sách sản phẩm thành công",
        code: 200,
        data: result,
      });
    }

    return res.status(400).json({
      msg: "Thiếu tham số: truyền product_id hoặc shop_id",
      code: 400,
      data: null,
    });
  } catch (error) {
    console.error("getUserProducts error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

// --- Payment ---

export const postCreateCheckoutOrder = async (
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

    const { items } = req.body || {};
    if (!isCheckoutItemArray(items)) {
      return res.status(400).json({
        msg: "items must be an array",
        code: 400,
        data: null,
      });
    }

    const result = await createCheckoutOrderFromItems(userId, items);

    return res.status(result.code).json({
      msg: result.msg,
      code: result.code,
      data: result.data,
    });
  } catch (error) {
    console.error("postCreateCheckoutOrder error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

export const postUserCheckoutPayment = async (
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

    const body = req.body || {};
    const { orderId, method, delivery_target, voucher_id } = body;

    if (!isNonEmptyString(orderId)) {
      return res.status(400).json({
        msg: "orderId is required",
        code: 400,
        data: null,
      });
    }
    if (!isNonEmptyString(method)) {
      return res.status(400).json({
        msg: "method is required (COD or MOMO)",
        code: 400,
        data: null,
      });
    }
    const zoneRaw = delivery_target ?? body.deliveryTarget;
    if (!isNonEmptyString(zoneRaw)) {
      return res.status(400).json({
        msg: "delivery_target is required",
        code: 400,
        data: null,
      });
    }

    let voucherIdParam: string | null = null;
    if (voucher_id !== undefined && voucher_id !== null && voucher_id !== "") {
      if (typeof voucher_id !== "string" || !voucher_id.trim()) {
        return res.status(400).json({
          msg: "voucher_id must be a non-empty string when provided",
          code: 400,
          data: null,
        });
      }
      voucherIdParam = voucher_id.trim();
    }

    const result = await checkoutCreatePayment(userId, {
      orderId,
      method,
      delivery_target: zoneRaw.trim(),
      voucher_id: voucherIdParam,
    });

    return res.status(result.code).json({
      msg: result.msg,
      code: result.code,
      data: result.data,
    });
  } catch (error) {
    console.error("postUserCheckoutPayment error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/**
 * POST /user/claim-voucher — đổi điểm (UserCredit) lấy user_voucher active.
 * Body: { voucherId } hoặc { voucher_id }
 */
export const postUserClaimVoucher = async (
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

    const body = req.body || {};
    const voucherIdRaw = body.voucherId ?? body.voucher_id;
    if (typeof voucherIdRaw !== "string" || !voucherIdRaw.trim()) {
      return res.status(400).json({
        msg: "voucherId is required (non-empty string)",
        code: 400,
        data: null,
      });
    }

    const result = await claimVoucherWithUserCredit(userId, voucherIdRaw);

    return res.status(result.code).json({
      msg: result.msg,
      code: result.code,
      data: result.data,
    });
  } catch (error) {
    console.error("postUserClaimVoucher error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

export const postCreateCheckoutOrderFromCart = async (
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

    const result = await createCheckoutOrderFromCart(userId);

    return res.status(result.code).json({
      msg: result.msg,
      code: result.code,
      data: result.data,
    });
  } catch (error) {
    console.error("postCreateCheckoutOrderFromCart error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

// --- Order ---

export const addProductToUserOrder = async (
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

    const { productId, quantity } = req.body || {};
    if (!isValidId(productId)) {
      return res.status(400).json({
        msg: "productId is required",
        code: 400,
        data: null,
      });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({
        msg: "quantity must be a positive integer",
        code: 400,
        data: null,
      });
    }

    const result = await addProductToDefaultUserCart({
      userId,
      productId: productId.trim(),
      quantity: qty,
    });

    return res.status(result.code).json({
      msg: result.msg,
      code: result.code,
      data: result.data,
    });
  } catch (error) {
    console.error("addProductToUserOrder error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

export const getUserOrderItems = async (
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

    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.page_size ?? 10);
    if (!Number.isInteger(page) || page <= 0) {
      return res.status(400).json({
        msg: "page must be a positive integer",
        code: 400,
        data: null,
      });
    }

    if (!Number.isInteger(pageSize) || pageSize <= 0) {
      return res.status(400).json({
        msg: "page_size must be a positive integer",
        code: 400,
        data: null,
      });
    }

    const result = await getUserCheckoutOrdersWithItems(userId, page, pageSize);

    return res.status(result.code).json({
      msg: result.msg,
      code: result.code,
      data: result.data,
    });
  } catch (error) {
    console.error("getUserOrderItems error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

export const getUserOrderStatus = async (
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

    const orderId = req.query.orderId;
    if (!isValidId(orderId)) {
      return res.status(400).json({
        msg: "orderId is required",
        code: 400,
        data: null,
      });
    }

    const result = await getUserOrderPaymentStatus(userId, orderId.trim());

    return res.status(result.code).json({
      msg: result.msg,
      code: result.code,
      data: result.data,
    });
  } catch (error) {
    console.error("getUserOrderStatus error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/**
 * GET /user/delivery-status?page=1&page_size=5
 * Đơn status `order` của user + payment (theo orderId) + shipper assignment.
 */
export const getUserDeliveryStatus = async (
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

    const { page, page_size } = parsePageSize(
      req.query.page,
      req.query.page_size,
    );

    const result = await listUserOrdersDeliveryStatus(userId, page, page_size);

    return res.status(result.code).json({
      msg: result.msg,
      code: result.code,
      data: result.data,
    });
  } catch (error) {
    console.error("getUserDeliveryStatus error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/**
 * POST /user/cancel-order
 * Body: { orderId: string (uuid), reason: string }
 * Output data: { orderId: string, status: "cancel", reason: string }
 */
export const cancelUserOrderHandler = async (
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

    const { orderId, reason } = req.body as {
      orderId: string;
      reason: string;
    };

    const result = await cancelUserOrder(userId, { orderId, reason });

    return res.status(result.code).json({
      msg: result.msg,
      code: result.code,
      data: result.data,
    });
  } catch (error) {
    console.error("cancelUserOrderHandler error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

export const getUserCartOrderItems = async (
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

    const result = await getUserCartOrderItemsWithProduct(userId);

    return res.status(result.code).json({
      msg: result.msg,
      code: result.code,
      data: result.data,
    });
  } catch (error) {
    console.error("getUserCartOrderItems error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/**
 * POST /user/update-quantity-prod
 *
 * Input (body):
 * - action: "increase" | "decrease"
 * - productId: string (uuid)
 *
 * Output (data):
 * - order: Order row (cart)
 * - order_item: OrderItem row sau cập nhật
 * - previousQuantity: number
 * - quantity: number
 * - action: string
 */
export const updateCartProductQuantityHandler = async (
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

    const { action, productId } = req.body as {
      action: "increase" | "decrease";
      productId: string;
    };

    const result = await updateCartProductQuantity({
      userId,
      productId,
      action,
    });

    return res.status(result.code).json({
      msg: result.msg,
      code: result.code,
      data: result.data,
    });
  } catch (error) {
    console.error("updateCartProductQuantityHandler error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

export const deleteProductFromUserCart = async (
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

    const { productId } = req.body || {};
    if (!isValidId(productId)) {
      return res.status(400).json({
        msg: "productId is required",
        code: 400,
        data: null,
      });
    }

    const result = await removeProductFromUserCart(userId, productId.trim());

    return res.status(result.code).json({
      msg: result.msg,
      code: result.code,
      data: result.data,
    });
  } catch (error) {
    console.error("deleteProductFromUserCart error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

// --- Conversation ---

/**
 * POST body: { userQuestion: string, shopId: string }
 * Auth: Bearer JWT (user or admin). Streams plain text chunks with res.write.
 */
export const userAskShopPolicyBot = async (
  req: IUserAuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userJwt?.id;
    if (!userId) {
      (res as IDataResponse)
        .status(401)
        .json({ code: 401, msg: "UNAUTHORIZED", data: null });
      return;
    }

    const { userQuestion, shopId } = (req.body ?? {}) as {
      userQuestion?: unknown;
      shopId?: unknown;
    };

    if (
      typeof userQuestion !== "string" ||
      userQuestion.trim() === "" ||
      typeof shopId !== "string" ||
      shopId.trim() === ""
    ) {
      (res as IDataResponse).status(400).json({
        code: 400,
        msg: "INVALID_BODY",
        data: { need: ["userQuestion", "shopId"] },
      });
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      (res as IDataResponse).status(503).json({
        code: 503,
        msg: "OPENAI_NOT_CONFIGURED",
        data: null,
      });
      return;
    }

    const policyContent = await getPolicyContentByShopId(shopId.trim());
    if (policyContent === null) {
      (res as IDataResponse).status(404).json({
        code: 404,
        msg: "POLICY_NOT_FOUND",
        data: null,
      });
      return;
    }

    const q = userQuestion.trim();
    const sid = shopId.trim();

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const botResponse = await streamPolicyBotAnswer(res, q, policyContent);

    await appendConversationMessage({
      userId,
      shopId: sid,
      userQuestion: q,
      botResponse,
    });

    res.end();
  } catch (error) {
    console.error("userAskShopPolicyBot error:", error);
    if (!res.headersSent) {
      (res as IDataResponse).status(500).json({
        code: 500,
        msg: "INTERNAL_SERVER_ERROR",
        data: null,
      });
    } else {
      res.end();
    }
  }
};

export const userAskShopPolicyBotHandler =
  userAskShopPolicyBot as unknown as RequestHandler;

/**
 * GET ?shopId= — lịch sử chat user ↔ shop (conversation theo user_id + shop_id, messages theo conversation_id).
 */
export const userGetConversationHistory = async (
  req: IUserAuthRequest,
  res: IDataResponse,
): Promise<void> => {
  try {
    const userId = req.userJwt?.id;
    if (!userId) {
      res.status(401).json({ code: 401, msg: "UNAUTHORIZED", data: null });
      return;
    }

    const q = req.query.shopId;
    const shopId =
      typeof q === "string" && q.trim() !== "" ? q.trim() : undefined;
    if (!shopId) {
      res.status(400).json({
        code: 400,
        msg: "INVALID_QUERY",
        data: { need: ["shopId"] },
      });
      return;
    }

    const data = await getUserShopConversationHistory(userId, shopId);
    res.status(200).json({
      code: 200,
      msg: "OK",
      data,
    });
  } catch (error) {
    console.error("userGetConversationHistory error:", error);
    res.status(500).json({
      code: 500,
      msg: "INTERNAL_SERVER_ERROR",
      data: null,
    });
  }
};

export const userGetConversationHistoryHandler =
  userGetConversationHistory as unknown as RequestHandler;
