import Joi from "joi";

export const PRODUCT_SORT_STRATEGIES = [
  "price-descend",
  "price-ascend",
  "best-seller",
] as const;

const sortStrategyField = Joi.string()
  .trim()
  .valid(...PRODUCT_SORT_STRATEGIES);

export const productSortQuerySchema = Joi.object({
  shopId: Joi.string().trim().uuid().required(),
  page: Joi.alternatives().try(Joi.number().integer().min(1), Joi.string()).optional(),
  page_size: Joi.alternatives()
    .try(Joi.number().integer().min(1).max(100), Joi.string())
    .optional(),
  sortStrategy: sortStrategyField.optional(),
});

export const productSortBodySchema = Joi.object({
  sortStrategy: sortStrategyField.required(),
});

/** GET — `sortStrategy` trên query (không body). */
export const productSortGetQuerySchema = productSortQuerySchema.fork(
  ["sortStrategy"],
  (field) => field.required(),
);
