import { api_host } from "@/apis/endpoint";
import authorizationUtil from "@/utils/authorizationUtil";
import { setToken } from "@/utils/tokenManager";
import { notifyAuthSessionUpdated } from "@/lib/authSession";
import { persistOAuthDebug } from "@/lib/oauthDebug";
import type { LoginPortal } from "@/lib/oauthState";

export type GoogleOAuthLoginResult = {
  code: number;
  httpStatus: number;
  body: Record<string, unknown> | null;
  networkError?: string;
};

const OAUTH_ENDPOINTS: Record<LoginPortal, string> = {
  user: `${api_host}/user/oAuth-login`,
  shopOwner: `${api_host}/shopowner/oAuth-login`,
  collaborator: `${api_host}/collaborator/oAuth-login`,
};

/**
 * Đổi Google code lấy JWT — dùng fetch (không phụ thuộc lifecycle React/axios),
 * tránh request bị hủy khi callback đổi URL sớm.
 */
export async function exchangeGoogleOAuthCode(
  portal: LoginPortal,
  code: string,
  callbackUrl: string
): Promise<GoogleOAuthLoginResult> {
  const url = OAUTH_ENDPOINTS[portal];
  persistOAuthDebug({ phase: "request_start", portal, url, callbackUrl });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, callback_url: callbackUrl }),
      credentials: "same-origin",
      cache: "no-store",
    });

    let body: Record<string, unknown> | null = null;
    try {
      body = (await response.json()) as Record<string, unknown>;
    } catch {
      body = null;
    }

    const businessCode =
      typeof body?.code === "number"
        ? body.code
        : response.ok
          ? 0
          : response.status;

    const result: GoogleOAuthLoginResult = {
      code: businessCode,
      httpStatus: response.status,
      body,
    };
    persistOAuthDebug({ phase: "response", portal, ...result });
    return result;
  } catch (err) {
    const result: GoogleOAuthLoginResult = {
      code: -1,
      httpStatus: 0,
      body: null,
      networkError: err instanceof Error ? err.message : String(err),
    };
    persistOAuthDebug({ phase: "network_error", portal, ...result });
    return result;
  }
}

export function applyAuthFromOAuthBody(
  body: Record<string, unknown> | null
): boolean {
  if (!body || body.code !== 0) return false;

  const data = body.data as
    | {
        token?: string;
        user?: {
          name?: string;
          email?: string;
          avatar?: string;
          picture?: string;
          role?: string;
        };
      }
    | undefined;

  const token = data?.token;
  const user = data?.user;
  if (!token || !user) return false;

  setToken(token);
  const userInfo = {
    name: user.name,
    email: user.email,
    picture: user.avatar || user.picture,
    role: user.role,
  };
  authorizationUtil.setItems({
    Authorization: "",
    userInfo: JSON.stringify(userInfo),
    Token: token,
    ...(user.role ? { role: String(user.role) } : {}),
  });
  notifyAuthSessionUpdated();
  return true;
}
