import Joi from "joi";

export const cancelOrderBodySchema = Joi.object({
  orderId: Joi.string().trim().uuid().required(),
  reason: Joi.string().trim().min(1).max(500).required(),
});
