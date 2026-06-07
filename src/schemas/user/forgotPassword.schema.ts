import Joi from "joi";

export const forgotPasswordBodySchema = Joi.object({
  email: Joi.string().trim().required(),
  new_password: Joi.string().required(),
  code: Joi.string().trim().pattern(/^\d{6}$/).required().messages({
    "string.pattern.base": "code must be 6 digits",
  }),
});
