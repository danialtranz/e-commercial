import { NextFunction } from "express";
import {
  IDataResponse,
  IUserAuthRequest,
} from "../../interface/request/request";
export const isAuthUserRequest = async (
  req: IUserAuthRequest,
  res: IDataResponse,
  next: NextFunction,
): Promise<any> => {
  try {
    const user_token = req.headers["authorization"];
    const token = user_token.split(" ")[1];
    if (!token) {
      return res.status(401).json({ code: "401", msg: "Missing token" });
    }
    const validUser = await isValidUserByEmail(token);
    if (!validUser) {
      return res.status(401).json({ code: "401", msg: "Unauthorized" });
    }
    req.user = validUser;
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ code: "500", msg: `Internal server error: ${error}` });
  }
};
