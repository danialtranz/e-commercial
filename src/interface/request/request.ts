import { Response, Request } from "express";

export interface IDataResponse extends Response {
  code: string;
  msg: string;
  data?: any;
}

export interface SysUserData {
  id: number;
  username: string;
  password?: string;
  super_admin?: number;
  status?: number;
  create_date?: Date;
  updater?: number;
  creator?: number;
  update_date?: Date;
}

export interface IUserAuthRequest extends Request {
  user: SysUserData | null;
  /**
   * Dùng cho JWT login (Google OAuth2).
   * Được gắn bởi middleware `isAuthJwt` trong `middlewares/auth/jwt.auth.ts`
   */
  userJwt?: {
    id: string;
    email?: string | null;
    role?: string | null;
  };
  /**
   * `shop_infos.id` — gắn bởi `requireShopOwner` sau khi xác minh user là chủ shop.
   */
  shopId?: string;
}
