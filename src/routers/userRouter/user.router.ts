import express, { RequestHandler } from "express";
import * as userController from "../../controllers/userController/user.controller";
import {
  isAuthJwt,
  isAuthJwtMiddleware,
} from "../../middlewares/auth/jwt.auth";
import { validate } from "../../middlewares/validate.middleware";
import { signUpBodySchema } from "../../schemas/user/signUp.schema";
import { verifyEmailQuerySchema } from "../../schemas/user/verifyEmail.schema";
import { signInBodySchema } from "../../schemas/user/signIn.schema";
import { takeResetCodeBodySchema } from "../../schemas/user/takeResetCode.schema";
import { forgotPasswordBodySchema } from "../../schemas/user/forgotPassword.schema";
import { changePasswordBodySchema } from "../../schemas/user/changePassword.schema";
import { cancelOrderBodySchema } from "../../schemas/user/cancelOrder.schema";
import { updateQuantityProdBodySchema } from "../../schemas/user/updateQuantityProd.schema";

const router = express.Router();

// Webhook từ Lemon Squeezy - không cần xác thực JWT vì đây là request từ Lemon Squeezy
// Lưu ý: express.raw() được apply trong index.ts cho route này để giữ raw body cho signature verification

// PUBLIC API - Login với Google OAuth2
router.post(
  "/user/oAuth-login",
  userController.loginWithGoogle as unknown as RequestHandler,
);

/** Đăng ký tài khoản user (username + password) — gửi link xác minh qua email */
router.post(
  "/user/sign-up",
  validate({ body: signUpBodySchema }),
  userController.signUpHandler,
);

/** Xác minh email qua token (6 chữ số) trong link */
router.get(
  "/user/verify-email",
  validate({ query: verifyEmailQuerySchema }),
  userController.verifyEmailHandler,
);

/** Đăng nhập email + password (role user) */
router.post(
  "/user/sign-in-pw",
  validate({ body: signInBodySchema }),
  userController.signInWithPasswordRouteHandler,
);

/** Gửi mã khôi phục mật khẩu qua email */
router.post(
  "/user/tke-code",
  validate({ body: takeResetCodeBodySchema }),
  userController.takeResetCodeHandler,
);

/** Đặt lại mật khẩu bằng mã OTP */
router.post(
  "/user/fg-pasw",
  validate({ body: forgotPasswordBodySchema }),
  userController.forgotPasswordRouteHandler,
);

/** Đổi mật khẩu khi đã đăng nhập (JWT) */
router.post(
  "/user/chag-pasw",
  isAuthJwtMiddleware,
  validate({ body: changePasswordBodySchema }),
  userController.changePasswordRouteHandler,
);

router.get(
  "/user/shops",
  isAuthJwt,
  userController.getUserShops as unknown as RequestHandler,
);

router.get(
  "/user/vouchers",
  isAuthJwtMiddleware,
  userController.postUserVouchers as unknown as RequestHandler,
);

router.get(
  "/user/my-credit",
  isAuthJwtMiddleware,
  userController.getMyCredit as unknown as RequestHandler,
);

/**
 * User — xem sản phẩm (chỉ JWT, không requireShopOwner)
 *
 * Mount: /v1
 * - GET /user/products?product_id=...
 * - GET /user/products?shop_id=...&page=...&page_size=...
 */
// router.get(
//   "/user/products",
//   isAuthJwtMiddleware,
//   userController.getUserProducts as unknown as RequestHandler,
// );
router.get(
  "/user/products",
  userController.getUserProducts as unknown as RequestHandler,
);

/**
 * Checkout / payment prep
 * Mount: /v1
 * - POST /user/create-order — body: { items: [{ productId, quantity }] }
 * - POST /user/create-order-from-cart
 * - POST /user/checkout — body: { orderId, method, delivery_target, voucher_id?, payment? }
 *   COD → payment cod + waiting; MOMO → momo + success. Gán shipper theo zone I1…I5, voucher optional.
 */
router.post(
  "/user/create-order",
  isAuthJwtMiddleware,
  userController.postCreateCheckoutOrder as unknown as RequestHandler,
);

router.post(
  "/user/create-order-from-cart",
  isAuthJwtMiddleware,
  userController.postCreateCheckoutOrderFromCart as unknown as RequestHandler,
);

router.post(
  "/user/checkout",
  isAuthJwtMiddleware,
  userController.postUserCheckoutPayment as unknown as RequestHandler,
);

/**
 * POST /user/claim-voucher — đổi điểm UserCredit lấy user_voucher (body: voucherId)
 */
router.post(
  "/user/claim-voucher",
  isAuthJwtMiddleware,
  userController.postUserClaimVoucher as unknown as RequestHandler,
);

/**
 * User Order (default cart)
 * Mount: /v1
 * - POST /user/order
 * - GET /user/orders?page=1&page_size=10
 * - GET /user/orders/status?orderId=...
 * - GET /user/cart-order
 * - DELETE /user/cart-order (body: { productId })
 * - POST /user/update-quantity-prod (body: { action, productId })
 */
router.post(
  "/user/order",
  isAuthJwtMiddleware,
  userController.addProductToUserOrder as unknown as RequestHandler,
);

router.get(
  "/user/orders",
  isAuthJwtMiddleware,
  userController.getUserOrderItems as unknown as RequestHandler,
);

router.get(
  "/user/orders/status",
  isAuthJwtMiddleware,
  userController.getUserOrderStatus as unknown as RequestHandler,
);

/**
 * User — theo dõi đơn đặt: thanh toán + giao hàng (shipper_assignments).
 * GET /user/delivery-status?page=1&page_size=5
 */
router.get(
  "/user/delivery-status",
  isAuthJwtMiddleware,
  userController.getUserDeliveryStatus as unknown as RequestHandler,
);

/**
 * User hủy đơn vừa đặt (status processing, delivery assigned).
 * POST /user/cancel-order — body: { orderId, reason }
 */
router.post(
  "/user/cancel-order",
  isAuthJwtMiddleware,
  validate({ body: cancelOrderBodySchema }),
  userController.cancelUserOrderHandler as unknown as RequestHandler,
);

router.get(
  "/user/cart-order",
  isAuthJwtMiddleware,
  userController.getUserCartOrderItems as unknown as RequestHandler,
);

router.delete(
  "/user/cart-order",
  isAuthJwtMiddleware,
  userController.deleteProductFromUserCart as unknown as RequestHandler,
);

router.post(
  "/user/update-quantity-prod",
  isAuthJwtMiddleware,
  validate({ body: updateQuantityProdBodySchema }),
  userController.updateCartProductQuantityHandler as unknown as RequestHandler,
);

/**
 * User — hội thoại với bot theo chính sách shop.
 *
 * Mount: /v1
 * - POST /user/conversation/ask — body: { userQuestion, shopId }; stream text/plain
 * - GET  /user/conversation/history?shopId= — JSON: conversationId + messages (theo order ASC)
 */
router.get(
  "/user/conversation/history",
  isAuthJwtMiddleware,
  userController.userGetConversationHistoryHandler,
);

router.post(
  "/user/conversation/ask",
  isAuthJwtMiddleware,
  userController.userAskShopPolicyBotHandler,
);

export default router;
