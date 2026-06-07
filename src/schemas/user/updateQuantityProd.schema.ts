import Joi from "joi";

export const updateQuantityProdBodySchema = Joi.object({
  action: Joi.string().trim().valid("increase", "decrease").required(),
  productId: Joi.string().trim().uuid().required(),
});
