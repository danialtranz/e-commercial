import "../../config/config";
import { Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import { User } from "../../models/modal";
import { randomUUID } from "crypto";
import {
  IDataResponse,
  IUserAuthRequest,
} from "../../interface/request/request";
import {
  getCollaboratorCollaInfo,
  isAllowedShipperZone,
  isCollaboratorDeliverStatus,
  listCollaboratorDeliveries,
  updateCollaboratorDeliveryStatus,
  upsertCollaboratorShipperInfor as upsertShipperInforService,
} from "../../services/collaboratorService/collaboratorService";

interface GoogleOAuthPayload {
  code: string;
  callback_url?: string;
}

const createCollaboratorJwtToken = (payload: {
  id: string;
  email?: string | null;
}) => {
  const secret = process.env.JWT_SECRET_COLLABORATOR_LOGIN;
  if (!secret) {
    throw new Error("JWT_SECRET_COLLABORATOR_LOGIN is not configured");
  }
  return jwt.sign(
    {
      ...payload,
      role: "collaborator",
    },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRE ?? "7d",
    },
  );
};

/**
 * Đăng nhập Google cho collaborator: JWT ký bằng JWT_SECRET_COLLABORATOR_LOGIN, payload.role = "collaborator".
 * Tài khoản mới được tạo với role collaborator. Tài khoản đã tồn tại với role khác → 403.
 */
export const loginCollaboratorWithGoogle = async (
  req: Request,
  res: Response,
) => {
  try {
    const { code, callback_url }: GoogleOAuthPayload = req.body || {};
    if (!code) {
      return res.status(400).json({ msg: "Missing code", code: 400 });
    }

    const redirectUri =
      callback_url || process.env.GOOGLE_REDIRECT_URI || undefined;

    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    );

    const { tokens } = await client.getToken({
      code,
      redirect_uri: redirectUri,
    });

    if (!tokens.access_token) {
      return res
        .status(400)
        .json({ msg: "Cannot get access_token from Google", code: 400 });
    }

    const userInfoRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      },
    );

    const { email, name, picture } = userInfoRes.data || {};

    if (!email) {
      return res
        .status(400)
        .json({ msg: "Cannot get email from Google", code: 400 });
    }

    let user = await User.findOne({ where: { email } });

    if (!user) {
      user = await User.create({
        id: randomUUID(),
        email,
        name: name || email,
        avatar: picture || null,
        provider: "google",
        role: "collaborator",
        status: "active",
      });
    } else if (user.role !== "collaborator") {
      return res.status(403).json({
        msg: "Account is not registered as collaborator",
        code: 403,
      });
    }

    const token = createCollaboratorJwtToken({
      id: user.id,
      email: user.email,
    });

    return res.status(200).json({
      msg: "Login with Google successfully",
      code: 0,
      data: {
        token,
        user: {
          ...user.get({ plain: true }),
          role: "collaborator",
        },
      },
    });
  } catch (error: any) {
    if (error?.message === "JWT_SECRET_COLLABORATOR_LOGIN is not configured") {
      console.error("loginCollaboratorWithGoogle:", error.message);
      return res.status(500).json({
        msg: "Server misconfiguration: collaborator JWT secret",
        code: 500,
      });
    }
    console.error(
      "loginCollaboratorWithGoogle error:",
      error?.message || error,
    );
    return res.status(500).json({
      msg: "Error login with Google",
      code: 500,
    });
  }
};

function parsePageSize(
  pageRaw: unknown,
  pageSizeRaw: unknown,
): { page: number; page_size: number } {
  let page = 1;
  let page_size = 10;

  if (
    pageRaw != null &&
    pageRaw !== "null" &&
    pageRaw !== "" &&
    typeof pageRaw === "string"
  ) {
    const p = parseInt(pageRaw, 10);
    if (!isNaN(p) && p >= 1) page = p;
  }

  if (
    pageSizeRaw != null &&
    pageSizeRaw !== "null" &&
    pageSizeRaw !== "" &&
    typeof pageSizeRaw === "string"
  ) {
    const ps = parseInt(pageSizeRaw, 10);
    if (!isNaN(ps) && ps > 0) page_size = ps;
  }

  return { page, page_size };
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim() !== "" && v !== "null";
}

/**
 * GET /collaborator/my-delivery?page=1&page_size=5
 */
export const getCollaboratorMyDeliveries = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const userId = req.userJwt?.id;
    if (!userId) {
      return res.status(401).json({
        msg: "UNAUTHORIZED",
        code: 401,
        data: null,
      });
    }

    const { page, page_size } = parsePageSize(
      req.query.page,
      req.query.page_size,
    );

    const result = await listCollaboratorDeliveries(userId, page, page_size);

    return res.status(result.code).json({
      msg: result.msg,
      code: result.code,
      data: result.data,
    });
  } catch (error) {
    console.error("getCollaboratorMyDeliveries error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

/**
 * PATCH /collaborator/my-delivery?shipper_assignment_id=...
 * Body: { "deliver_status": "assigned" | "picked" | "delivered_at" | "failed" }
 */
export const patchCollaboratorMyDeliveryStatus = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const userId = req.userJwt?.id;
    if (!userId) {
      return res.status(401).json({
        msg: "UNAUTHORIZED",
        code: 401,
        data: null,
      });
    }

    const q = req.query.shipper_assignment_id;
    const shipperAssignmentId =
      typeof q === "string" && q.trim() !== "" ? q.trim() : "";
    if (!isNonEmptyString(shipperAssignmentId)) {
      return res.status(400).json({
        msg: "shipper_assignment_id query parameter is required",
        code: 400,
        data: null,
      });
    }

    const deliverStatusRaw = (req.body ?? {}).deliver_status;
    if (typeof deliverStatusRaw !== "string" || !deliverStatusRaw.trim()) {
      return res.status(400).json({
        msg: "deliver_status is required in body",
        code: 400,
        data: null,
      });
    }

    const deliverStatus = deliverStatusRaw.trim();
    if (!isCollaboratorDeliverStatus(deliverStatus)) {
      return res.status(400).json({
        msg: "deliver_status must be one of: assigned, picked, delivered_at, failed",
        code: 400,
        data: null,
      });
    }

    const result = await updateCollaboratorDeliveryStatus(
      userId,
      shipperAssignmentId,
      deliverStatus,
    );

    return res.status(result.code).json({
      msg: result.msg,
      code: result.code,
      data: result.data,
    });
  } catch (error) {
    console.error("patchCollaboratorMyDeliveryStatus error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

export const getCollaboratorMyDeliveriesHandler =
  getCollaboratorMyDeliveries as unknown as RequestHandler;

export const patchCollaboratorMyDeliveryStatusHandler =
  patchCollaboratorMyDeliveryStatus as unknown as RequestHandler;

/**
 * POST | PATCH /collaborator/upt-info
 * Body: { "shipper_zone": "I1" | "I2" | "I3" }
 */
export const upsertCollaboratorShipperInfor = async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const userId = req.userJwt?.id;
    if (!userId) {
      return res.status(401).json({
        msg: "UNAUTHORIZED",
        code: 401,
        data: null,
      });
    }

    const body = req.body ?? {};
    const zoneRaw = body.shipper_zone ?? body.shipperZone;
    if (typeof zoneRaw !== "string" || !zoneRaw.trim()) {
      return res.status(400).json({
        msg: "shipper_zone is required (allowed: I1, I2, I3, I4, I5)",
        code: 400,
        data: null,
      });
    }

    const shipperZone = zoneRaw.trim();
    if (!isAllowedShipperZone(shipperZone)) {
      return res.status(400).json({
        msg: "shipper_zone must be one of: I1, I2, I3, I4, I5",
        code: 400,
        data: null,
      });
    }

    const result = await upsertShipperInforService(userId, shipperZone);

    return res.status(result.code).json({
      msg: result.msg,
      code: result.code,
      data: result.data,
    });
  } catch (error) {
    console.error("upsertCollaboratorShipperInfor error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
};

export const upsertCollaboratorShipperInforHandler =
  upsertCollaboratorShipperInfor as unknown as RequestHandler;

/**
 * GET | POST /collaborator/colla-info — trả về users + shipper_infor (nếu có) của shipper đang đăng nhập.
 */
export const getCollaboratorCollaInfoHandler = (async (
  req: IUserAuthRequest,
  res: IDataResponse,
) => {
  try {
    const userId = req.userJwt?.id;
    if (!userId) {
      return res.status(401).json({
        msg: "UNAUTHORIZED",
        code: 401,
        data: null,
      });
    }

    const result = await getCollaboratorCollaInfo(userId);

    return res.status(result.code).json({
      msg: result.msg,
      code: result.code,
      data: result.data,
    });
  } catch (error) {
    console.error("getCollaboratorCollaInfo error:", error);
    return res.status(500).json({
      msg: "Internal server error",
      code: 500,
      data: null,
    });
  }
}) as unknown as RequestHandler;
