import express, { RequestHandler } from "express";
import {
  getShopIncome,
  loginShopownerGoogleController,
  shopownerAdjustProductQuantity,
  shopownerCreateAdvertisement,
  shopownerCreateCategory,
  shopownerCreateFlashSaleCampaign,
  shopownerCreateProduct,
  shopownerCreateProductComment,
  shopownerDeleteCategory,
  shopownerDeleteFlashSaleCampaign,
  shopownerDeleteProduct,
  shopownerDeleteShopPolicy,
  shopownerGetCategory,
  shopownerGetProduct,
  shopownerListAdvertisements,
  shopownerListCategories,
  shopownerListFlashSaleCampaigns,
  listVouchersAuthenticated,
  shopownerCreateVoucher,
  shopownerListProductComments,
  shopownerListProductStockDetails,
  shopownerListProducts,
  shopownerListUsers,
  shopownerUpdateAdvertisementStatus,
  shopownerUpdateFlashSaleCampaignStatus,
  shopownerUpdateProductImage,
  shopownerUpdateUserStatus,
  shopownerUpsertPolicy,
} from "../../controllers/shopOwnerController/shopOwnerController";
import {
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
} from "../../middlewares/auth/jwt.auth";
import { validate } from "../../middlewares/validate.middleware";
import { bannedUserBodySchema } from "../../schemas/shopowner/bannedUser.schema";
import { listShopownerUsersQuerySchema } from "../../schemas/shopowner/listUsers.schema";

const router = express.Router();

router.post(
  "/shopowner/oAuth-login",
  loginShopownerGoogleController as unknown as RequestHandler,
);

/**
 * Doanh thu shop — GET /shopowner/income
 * - Body (ưu tiên): { from, to } — DD-MM-YYYY, vd. "15-08-2026"
 * - Hoặc days_ago: query ?days_ago=7 hoặc header days_ago / days-ago
 */
router.post(
  "/shopowner/income",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  getShopIncome as unknown as RequestHandler,
);

/**
 * Shop owner — danh mục (theo shop_id trên bảng categories)
 *
 * Mount: /v1
 * - POST   /shopowner/categories
 * - GET    /shopowner/category?id=
 * - GET    /shopowner/categories?page=&page_size=
 * - DELETE /shopowner/categories?id=
 */
router.post(
  "/shopowner/categories",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerCreateCategory as unknown as RequestHandler,
);
router.get(
  "/shopowner/category",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerGetCategory as unknown as RequestHandler,
);
router.get(
  "/shopowner/categories",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerListCategories as unknown as RequestHandler,
);
router.delete(
  "/shopowner/categories",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerDeleteCategory as unknown as RequestHandler,
);

/**
 * Shop owner — chính sách (bảng `policies`, 1 row / shop).
 *
 * Mount: /v1
 * - POST   /shopowner/policy — body: policyTitle, policyContent; header x-shop-id hoặc ?shopId=
 * - DELETE /shopowner?shopId= — xóa policy của shop (cùng header/query chọn shop)
 */
router.post(
  "/shopowner/policy",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerUpsertPolicy as unknown as RequestHandler,
);

router.delete(
  "/shopowner",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerDeleteShopPolicy as unknown as RequestHandler,
);

/**
 * Shop owner — sản phẩm
 *
 * Mount: /v1
 * - POST   /shopowner/products
 * - GET    /shopowner/product?id=
 * - GET    /shopowner/products?page=&page_size=
 * - DELETE /shopowner/products?id=
 * - POST   /shopowner/product-image — multipart: productId + file (ảnh → lưu TEXT dạng data URL base64)
 *
 * Auth: JWT + requireShopOwner (header x-shop-id hoặc query shopId nếu nhiều shop)
 */
router.post(
  "/shopowner/products",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerCreateProduct as unknown as RequestHandler,
);
router.get(
  "/shopowner/product",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerGetProduct as unknown as RequestHandler,
);
router.get(
  "/shopowner/products",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerListProducts as unknown as RequestHandler,
);
router.delete(
  "/shopowner/products",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerDeleteProduct as unknown as RequestHandler,
);
router.post(
  "/shopowner/product-image",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerUpdateProductImage as unknown as RequestHandler,
);

/**
 * Shop owner — điều chỉnh tồn & lịch sử stock_detail
 *
 * Mount: /v1
 * - POST /shopowner/manager-quantity?id= — body: quantity (±), reason: rotten | import
 * - GET  /shopowner/manager-quantity?id=&page=&page_size=
 */
router.post(
  "/shopowner/manager-quantity",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerAdjustProductQuantity as unknown as RequestHandler,
);
router.get(
  "/shopowner/manager-quantity",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerListProductStockDetails as unknown as RequestHandler,
);

/**
 * Shop owner — quảng cáo (bảng `advertisements`, ảnh base64 trong DB)
 *
 * Mount: /v1
 * - POST /shopowner/adv — multipart field `file`
 * - GET  /shopowner/advs?page=&page_size=
 * - POST /shopowner/adv/sta-camp?adv_id= — body: { "status": "active" | "inactive" }
 */
router.post(
  "/shopowner/adv",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerCreateAdvertisement as unknown as RequestHandler,
);
router.get(
  "/shopowner/advs",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerListAdvertisements as unknown as RequestHandler,
);
router.post(
  "/shopowner/adv/sta-camp",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerUpdateAdvertisementStatus as unknown as RequestHandler,
);

/**
 * Shop owner — flash sale (bảng `flash_sale_campaigns`, gắn product của shop)
 *
 * Mount: /v1
 * - POST   /shopowner/Flscamp — body: product_target_id, campaign_start_at, expired_in, total_quantity, discount
 * - GET    /shopowner/Flscamps?page=&page_size=
 * - POST   /shopowner/Flscamp/updt-status?flash_sale_campaign_id= — body: { "status": "active" | "inactive" }
 * - DELETE /shopowner/Flscamp?flash_sale_campaign_id=
 */
router.post(
  "/shopowner/Flscamp",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerCreateFlashSaleCampaign as unknown as RequestHandler,
);
router.get(
  "/shopowner/Flscamps",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerListFlashSaleCampaigns as unknown as RequestHandler,
);
router.post(
  "/shopowner/Flscamp/updt-status",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerUpdateFlashSaleCampaignStatus as unknown as RequestHandler,
);
router.delete(
  "/shopowner/Flscamp",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerDeleteFlashSaleCampaign as unknown as RequestHandler,
);

/**
 * Bình luận sản phẩm — JWT bắt buộc, không yêu cầu shop owner.
 *
 * - POST   /shopowner/comment — multipart: product_id, comment?, file?
 * - GET    /shopowner/comments?product_id=&page=&page_size=
 */
router.post(
  "/shopowner/comment",
  isAuthJwtMiddleware,
  shopownerCreateProductComment as unknown as RequestHandler,
);
router.get(
  "/shopowner/comments",
  isAuthJwtMiddleware,
  shopownerListProductComments as unknown as RequestHandler,
);

/**
 * Voucher — POST chỉ shop owner (+ chọn shop); GET danh sách chỉ cần JWT.
 *
 * - POST /shopowner/voucher — body: { name, discount }
 * - GET  /shopowner/vouchers?page=&page_size=
 */
router.post(
  "/shopowner/voucher",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  shopownerCreateVoucher as unknown as RequestHandler,
);
router.get(
  "/shopowner/vouchers",
  isAuthJwtMiddleware,
  listVouchersAuthenticated as unknown as RequestHandler,
);

/**
 * Shop owner — quản lý user
 *
 * Mount: /v1
 * - POST /shopowner/banned-user — body: { email, status: "active" | "inactive" }
 * - GET  /shopowner/users?page=&page_size=
 */
router.post(
  "/shopowner/banned-user",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  validate({ body: bannedUserBodySchema }),
  shopownerUpdateUserStatus as unknown as RequestHandler,
);
router.get(
  "/shopowner/users",
  isAuthJwtMiddleware,
  requireShopOwnerMiddleware,
  validate({ query: listShopownerUsersQuerySchema }),
  shopownerListUsers as unknown as RequestHandler,
);

export default router;
