import "../../config/config";
import { NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import {
  IDataResponse,
  IUserAuthRequest,
} from "../../interface/request/request";
import { ROLE } from "../../const/const";
import { ShopInfoModel } from "../../models/modal";
/**
 * JWT Auth (dùng cho flow Google OAuth2 trong `user.controller.ts`)
 *
 * - Client gửi: Authorization: Bearer <jwt>
 * - Server verify bằng các secret (thử lần lượt):
 *   - admin: JWT_SECRET_ADMIN_LOGIN
 *   - user : JWT_SECRET_USER_LOGIN
 *   - collaborator: JWT_SECRET_COLLABORATOR_LOGIN
 *
 * Sau khi verify thành công sẽ gắn `req.userJwt`.
 */

export interface JwtUserPayload {
  id: string;
  email?: string | null;
  role?: string | null; // collaborator | user | shopowner
}

const extractBearer = (req: IUserAuthRequest) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return null;
  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
};

export const isAuthJwt = async (
  req: IUserAuthRequest,
  res: IDataResponse,
  next: NextFunction,
): Promise<void> => {
  try {
    console.log("isAuthJwt");
    const token = extractBearer(req);
    if (!token) {
      res.status(401).json({ code: 401, msg: "MISSING_TOKEN", data: null });
      return;
    }

    const secrets = [
      process.env.JWT_SECRET_ADMIN_LOGIN,
      process.env.JWT_SECRET_USER_LOGIN,
      process.env.JWT_SECRET_COLLABORATOR_LOGIN,
      process.env.JWT_SECRET_SHOPOWNER_LOGIN,
    ].filter(Boolean) as string[];
    let decoded: JwtUserPayload | null = null;
    for (const secret of secrets) {
      try {
        decoded = jwt.verify(token, secret) as JwtUserPayload;
        console.log("decoded", decoded);
        break;
      } catch {
        // ignore and try next secret
      }
    }

    if (!decoded) {
      res.status(401).json({ code: 401, msg: "UNAUTHORIZED", data: null });
      return;
    }

    req.userJwt = decoded;
    next();
    return;
  } catch (error) {
    res.status(500).json({
      code: 500,
      msg: "INTERNAL_SERVER_ERROR",
      data: null,
    });
    return;
  }
};

/**
 * Guard: chỉ chủ shop (bản ghi `shop_infos` có `user_id` = JWT `id`).
 * Gắn `req.shopId` = `shop_infos.id` để controller/service chỉ thao tác đúng shop đó.
 *
 * Chọn shop khi một user có nhiều shop: gửi header `x-shop-id` hoặc query `shopId`
 * (phải thuộc user hiện tại). Không gửi thì dùng một shop bất kỳ của user (findOne).
 */
export const requireShopOwner = async (
  req: IUserAuthRequest,
  res: IDataResponse,
  next: NextFunction,
): Promise<void> => {
  const shopownerJwt: JwtUserPayload | undefined = req.userJwt;
  console.log("shopownerJwt", shopownerJwt);
  if (!shopownerJwt?.id) {
    res.status(401).json({ code: 401, msg: "UNAUTHORIZED", data: null });
    return;
  }
  // query ra shop owner ứng với userId này
  const shopowner = await ShopInfoModel.findAll({
    where: { userId: shopownerJwt.id, status: "active" },
    limit: 1,
  });
  if (shopowner.length === 0) {
    res
      .status(403)
      .json({ code: 403, msg: "FORBIDDEN_NOT_SHOP_OWNER", data: null });
    return;
  }
  req.shopId = shopowner[0].dataValues.id;
  if (shopownerJwt.role !== ROLE.SHOPOWNER) {
    res
      .status(403)
      .json({ code: 403, msg: "FORBIDDEN_NOT_SHOP_OWNER", data: null });
    return;
  }

  next();
  return;
};

export const requireCollaborator = async (
  req: IUserAuthRequest,
  res: IDataResponse,
  next: NextFunction,
): Promise<void> => {
  const collaboratorJwt: JwtUserPayload | undefined = req.userJwt;
  if (!collaboratorJwt?.id) {
    res.status(401).json({ code: 401, msg: "UNAUTHORIZED", data: null });
    return;
  }
  if (collaboratorJwt.role !== ROLE.COLLABORATOR) {
    res
      .status(403)
      .json({ code: 403, msg: "FORBIDDEN_NOT_COLLABORATOR", data: null });
    return;
  }
  next();
};

// Export typed handlers (cho router không bị lỗi type)
export const isAuthJwtMiddleware = isAuthJwt as unknown as RequestHandler;

export const requireShopOwnerMiddleware =
  requireShopOwner as unknown as RequestHandler;

export const requireCollaboratorMiddleware =
  requireCollaborator as unknown as RequestHandler;
