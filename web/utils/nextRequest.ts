import { Authorization } from "../constants/authorization";

import authorizationUtil, { redirectToLogin } from "@/utils/authorizationUtil";
import axios, { AxiosError, AxiosResponse } from "axios";
import { convertTheKeysOfTheObjectToSnake } from "./commonUtils";
import { getToken, removeToken } from "../utils/tokenManager";
import { toast } from "@/hooks/useToast";
import Cookies from "js-cookie";

export const RetcodeMessage = {
  200: "Thành công",
  201: "Đã tạo thành công",
  202: "Đã chấp nhận",
  204: "Không có nội dung",
  400: "Yêu cầu không hợp lệ",
  401: "Chưa xác thực",
  403: "Không có quyền truy cập",
  404: "Không tìm thấy",
  406: "Không chấp nhận được",
  410: "Tài nguyên đã bị gỡ",
  413: "Dữ liệu gửi lên quá lớn",
  422: "Dữ liệu không hợp lệ",
  500: "Lỗi máy chủ nội bộ",
  502: "Cổng không hợp lệ",
  503: "Dịch vụ tạm không khả dụng",
  504: "Hết thời gian chờ cổng",
} as const;

const MSG = {
  authErrorTitle: "Lỗi xác thực",
  networkTitle: "Lỗi mạng",
  networkDesc:
    "Không kết nối được máy chủ. Kiểm tra kết nối mạng hoặc đảm bảo máy chủ đang chạy.",
  timeoutTitle: "Hết thời gian chờ",
  timeoutDesc: "Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại sau.",
  serverErrorTitle: "Lỗi máy chủ",
  criticalTitle: "Lỗi nghiêm trọng",
  criticalDesc:
    "Đã xảy ra lỗi nghiêm trọng không mong muốn. Vui lòng thử lại sau.",
  sessionExpired: "Phiên đăng nhập hết hạn",
  pleaseLoginAgain: "Vui lòng đăng nhập lại để tiếp tục",
  unauthorized: "Chưa được phép",
  internalServerError: "Lỗi máy chủ nội bộ",
} as const;

export type ResultCode =
  | 200
  | 201
  | 202
  | 204
  | 400
  | 401
  | 403
  | 404
  | 406
  | 410
  | 413
  | 422
  | 500
  | 502
  | 503
  | 504;

const isCriticalError = (error: AxiosError | Error): boolean => {
  if ("code" in error) {
    const code = (error as AxiosError).code;
    if (
      code === "ERR_NETWORK" ||
      code === "ECONNREFUSED" ||
      code === "ETIMEDOUT" ||
      code === "ENOTFOUND" ||
      code === "ECONNABORTED"
    ) {
      return true;
    }
  }

  const message = error.message || "";
  if (
    message.includes("Network Error") ||
    message.includes("Failed to fetch") ||
    message.includes("ERR_NETWORK") ||
    message.includes("ECONNREFUSED") ||
    message.includes("timeout")
  ) {
    return true;
  }

  const axiosError = error as AxiosError;
  if (axiosError.request && !axiosError.response) {
    return true;
  }

  if (axiosError.response) {
    const status = axiosError.response.status;
    if (status >= 500 && status < 600) {
      return true;
    }
  }

  return false;
};

export const clearAllAuthData = (): void => {
  removeToken();

  authorizationUtil.removeAll();

  if (typeof window !== "undefined") {
    const allCookies = Cookies.get();
    const hostname = window.location.hostname;

    Object.keys(allCookies).forEach((cookieName) => {
      Cookies.remove(cookieName, { path: "/" });

      if (
        hostname &&
        !hostname.startsWith("localhost") &&
        !hostname.startsWith("127.0.0.1")
      ) {
        Cookies.remove(cookieName, { path: "/", domain: hostname });
        Cookies.remove(cookieName, { path: "/", domain: `.${hostname}` });
      }
    });
  }
};

const errorHandler = (error: AxiosError | Error): AxiosResponse | undefined => {
  const axiosError = error as AxiosError;

  if (axiosError.response) {
    const status = axiosError.response.status;
    if (status === 401 || status === 403) {
      const errorText =
        RetcodeMessage[status as ResultCode] ||
        axiosError.response.statusText ||
        MSG.unauthorized;

      toast({
        title: `${MSG.authErrorTitle} ${status}`,
        description: errorText,
        variant: "destructive",
      });

      clearAllAuthData();

      setTimeout(() => {
        redirectToLogin();
      }, 2000);

      return axiosError.response;
    }
  }

  if (!isCriticalError(error)) {
    return axiosError.response;
  }

  if (
    axiosError.code === "ERR_NETWORK" ||
    axiosError.code === "ECONNREFUSED" ||
    axiosError.code === "ENOTFOUND" ||
    (axiosError.request && !axiosError.response) ||
    error.message?.includes("Network Error") ||
    error.message?.includes("Failed to fetch")
  ) {
    toast({
      title: MSG.networkTitle,
      description: MSG.networkDesc,
      variant: "destructive",
    });
    return undefined;
  }

  if (
    axiosError.code === "ETIMEDOUT" ||
    axiosError.code === "ECONNABORTED" ||
    error.message?.includes("timeout")
  ) {
    toast({
      title: MSG.timeoutTitle,
      description: MSG.timeoutDesc,
      variant: "destructive",
    });
    return undefined;
  }

  if (axiosError.response) {
    const status = axiosError.response.status;
    if (status >= 500 && status < 600) {
      const errorText =
        RetcodeMessage[status as ResultCode] ||
        axiosError.response.statusText ||
        MSG.internalServerError;

      toast({
        title: `${MSG.serverErrorTitle} ${status}`,
        description: errorText,
        variant: "destructive",
      });
      return axiosError.response;
    }
  }

  toast({
    title: MSG.criticalTitle,
    description: error.message || MSG.criticalDesc,
    variant: "destructive",
  });

  return axiosError.response;
};

function isApiEnvelopeResponse(response: AxiosResponse): boolean {
  const data = response?.data;
  return (
    data != null &&
    typeof data === "object" &&
    typeof (data as { code?: unknown }).code === "number"
  );
}

const request = axios.create({
  timeout: 300000,
});

request.interceptors.request.use(
  (config) => {
    const isFormData = config.data instanceof FormData;
    if (isFormData) {
      const skipToken = (config as { skipToken?: boolean }).skipToken;
      if (!skipToken) {
        const token = getToken();
        if (token) {
          if (!config.headers) {
            config.headers = {} as typeof config.headers;
          }
          (config.headers as Record<string, string>)[Authorization] =
            `Bearer ${token}`;
        }
      }

      return config;
    }

    const data = convertTheKeysOfTheObjectToSnake(config.data);
    const params = convertTheKeysOfTheObjectToSnake(config.params);
    const newConfig = { ...config, data, params };

    const skipToken = (config as { skipToken?: boolean }).skipToken;
    if (!skipToken) {
      const token = getToken();
      if (token) {
        if (!newConfig.headers) {
          newConfig.headers = {} as typeof newConfig.headers;
        }
        (newConfig.headers as Record<string, string>)[Authorization] =
          `Bearer ${token}`;
      }
    }

    return newConfig;
  },
  function (error) {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  async (response) => {
    if (response?.status === 413 || response?.status === 504) {
      toast({
        title: RetcodeMessage[response?.status as ResultCode] || "Lỗi",
        variant: "destructive",
      });
    }

    if (response.config.responseType === "blob") {
      return response;
    }

    const data = response?.data;

    if (data?.code === 401) {
      toast({
        title: data?.message || data?.msg || MSG.sessionExpired,
        description: MSG.pleaseLoginAgain,
        variant: "destructive",
      });

      clearAllAuthData();

      setTimeout(() => {
        redirectToLogin();
      }, 2000);
    }

    return response;
  },
  function (error: AxiosError | Error) {
    const axiosError = error as AxiosError;
    const response = axiosError.response;

    if (
      response &&
      isApiEnvelopeResponse(response) &&
      response.status >= 400 &&
      response.status < 500 &&
      response.status !== 401 &&
      response.status !== 403
    ) {
      return response;
    }

    errorHandler(error);
    return Promise.reject(error);
  }
);

export default request;

export const get = (url: string) => {
  try {
    const response = request.get(url);
    return response;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const post = (url: string, body: Record<string, unknown>) => {
  return request.post(url, { data: body });
};

export const drop = () => {};

export const put = () => {};
