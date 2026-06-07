import Joi from "joi";

export const signInBodySchema = Joi.object({
  email: Joi.string().trim().required(),
  password: Joi.string().required(),
});
