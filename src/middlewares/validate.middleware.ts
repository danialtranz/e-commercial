import Joi from "joi";
import { NextFunction, RequestHandler } from "express";
import { IDataResponse } from "../interface/request/request";

/**
 * Validate middleware (JOI) - chuẩn response format theo `cursor.guide.txt`
 *
 * Flow chuẩn:
 * ROUTE -> AUTH -> JOI VALIDATION -> CONTROLLER -> SERVICE
 */
type ValidationSchema = {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
};

export const validate =
  (schema: ValidationSchema) =>
  ((req: any, res: IDataResponse, next: NextFunction) => {
    const { body, params, query } = schema;

    if (params) {
      const { error, value } = params.validate(req.params, {
        abortEarly: false,
        allowUnknown: true,
      });
      if (error) {
        res.status(400).json({
          code: 400,
          msg: "VALIDATION_FAILED",
          data: error.details.map((d) => ({ message: d.message, path: d.path })),
        });
        return;
      }
      req.params = value;
    }

    if (query) {
      const { error, value } = query.validate(req.query, {
        abortEarly: false,
        allowUnknown: true,
      });
      if (error) {
        res.status(400).json({
          code: 400,
          msg: "VALIDATION_FAILED",
          data: error.details.map((d) => ({ message: d.message, path: d.path })),
        });
        return;
      }
      req.query = value;
    }

    if (body) {
      const { error, value } = body.validate(req.body, {
        abortEarly: false,
        allowUnknown: true,
      });
      if (error) {
        res.status(400).json({
          code: 400,
          msg: "VALIDATION_FAILED",
          data: error.details.map((d) => ({ message: d.message, path: d.path })),
        });
        return;
      }
      req.body = value;
    }

    next();
  }) as RequestHandler;

