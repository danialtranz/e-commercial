import Joi from "joi";

export const signUpBodySchema = Joi.object({
  fullName: Joi.string().trim().required().messages({
    "any.required": "fullName is required",
    "string.empty": "fullName is required",
  }),
  userName: Joi.string().trim().required().messages({
    "any.required": "userName is required",
    "string.empty": "userName is required",
  }),
  email: Joi.string().trim().required().messages({
    "any.required": "email is required",
    "string.empty": "email is required",
  }),
  phoneNumber: Joi.string().trim().required().messages({
    "any.required": "phoneNumber is required",
    "string.empty": "phoneNumber is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "password is required",
    "string.empty": "password is required",
  }),
});
