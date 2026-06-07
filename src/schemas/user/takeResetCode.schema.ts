import Joi from "joi";

export const takeResetCodeBodySchema = Joi.object({
  email: Joi.string().trim().required(),
});
