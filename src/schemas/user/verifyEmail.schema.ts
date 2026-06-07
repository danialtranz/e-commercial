import Joi from "joi";

export const verifyEmailQuerySchema = Joi.object({
  token: Joi.string().trim().pattern(/^\d{6}$/).required().messages({
    "any.required": "token is required",
    "string.pattern.base": "token must be 6 digits",
  }),
});
