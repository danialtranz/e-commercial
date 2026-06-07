import Joi from "joi";

export const bannedUserBodySchema = Joi.object({
  email: Joi.string().trim().email().required(),
  status: Joi.string().valid("active", "inactive").required(),
});
