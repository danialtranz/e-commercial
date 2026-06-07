import Joi from "joi";

const pageQuery = Joi.alternatives()
  .try(Joi.number().integer().min(1), Joi.string().pattern(/^\d+$/))
  .optional()
  .default(1);

const pageSizeQuery = Joi.alternatives()
  .try(Joi.number().integer().min(1).max(100), Joi.string().pattern(/^\d+$/))
  .optional()
  .default(10);

export const listShopownerUsersQuerySchema = Joi.object({
  page: pageQuery,
  page_size: pageSizeQuery,
});
