import express, { RequestHandler } from "express";
import * as commonController from "../controllers/shopOwnerController/shopOwnerController";
import { validate } from "../middlewares/validate.middleware";
import {
  productSortBodySchema,
  productSortGetQuerySchema,
  productSortQuerySchema,
} from "../schemas/public/productSort.schema";

const router = express.Router();

router.get(
  "/public/categories",
  commonController.getPublicCategories as unknown as RequestHandler,
) as unknown as RequestHandler;

router.get(
  "/public/shopInfo",
  commonController.getShopInfo as unknown as RequestHandler,
) as unknown as RequestHandler;

router.get(
  "/public/active-advertisement",
  commonController.getPublicActiveAdvertisement as unknown as RequestHandler,
) as unknown as RequestHandler;

router.post(
  "/public/product-search",
  commonController.searchPublicProducts as unknown as RequestHandler,
) as unknown as RequestHandler;

/**
 * Sắp xếp sản phẩm theo shop (public, không JWT).
 * POST — query: shopId, page, page_size; body: { sortStrategy }
 * GET  — query: shopId, page, page_size, sortStrategy
 */
router.post(
  "/public/product-sort",
  validate({ query: productSortQuerySchema, body: productSortBodySchema }),
  commonController.sortPublicProducts as unknown as RequestHandler,
);

router.get(
  "/public/product-sort",
  validate({ query: productSortGetQuerySchema }),
  commonController.sortPublicProducts as unknown as RequestHandler,
);

export default router;
