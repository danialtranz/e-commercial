import Joi from "joi";

export const changePasswordBodySchema = Joi.object({
  old_password: Joi.string().required(),
  new_password: Joi.string().required(),
});
