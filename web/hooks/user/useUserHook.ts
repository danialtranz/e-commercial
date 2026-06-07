import { useCallback, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHotToast } from "@/components/ui/hot-toast";
import type { PaginationInfo, UserProduct, UserShop } from "@/interface/shop";
import { fetchUserShops } from "@/services/user/shopService";
import {
  fetchUserProductDetail,
  fetchUserProducts,
  sortPublicProducts,
  type ProductSortStrategy,
  type SortPublicProductsData,
} from "@/services/user/productService";
import {
  checkoutOrder,
  createOrderFromItems,
  type ICheckoutPayload,
  type ICreateOrderPayload,
} from "@/services/user/paymentService";
import {
  addProductToCart,
  updateCartProductQuantity,
  removeProductFromCart,
  fetchCartProducts,
  fetchUserOrders,
  fetchUserOrderStatus,
  fetchUserCartOrderProducts,
  cancelUserOrder,
  type IAddProductToCartPayload,
  type IUpdateCartProductQuantityPayload,
  type IRemoveProductFromCartPayload,
  type ICancelUserOrderPayload,
  type IUserCartOrder,
  type IUserCartOrderItem,
  type IUserOrdersData,
  type IUserOrderStatus,
} from "@/services/user/orderService";
import {
  claimUserVoucher,
  fetchUserCredit,
  fetchUserVouchers,
  fetchUserDeliveryStatus,
  type FetchUserVoucherParams,
  type FetchUserDeliveryStatusParams,
  type UserCreditDetail,
  type UserVoucherItem,
  type UserVoucherListData,
  type UserDeliveryStatusListData,
  type UserDeliveryStatusRow,
} from "@/services/user/deliveryAndVoucherService";

import { Authorization } from "@/constants/authorization";
import userService, {
  changePassword,
  forgotPassword,
  signInWithPassword,
  signUpUser,
  takePasswordResetCode,
  type IChangePasswordPayload,
  type IForgotPasswordPayload,
  type ISignInWithPasswordPayload,
  type ISignUpPayload,
  type ITakePasswordResetCodePayload,
  type AuthUser,
} from "@/services/user/userService";
import authorizationUtil from "@/utils/authorizationUtil";
import { setToken } from "@/utils/tokenManager";

import {
  fetchConversationHistory,
  streamConversationAsk,
  type StreamConversationAskOptions,
} from "@/services/user/conversationService";
import { notifyAuthSessionUpdated } from "@/lib/authSession";
import { persistDefaultShopInLocalStorage } from "@/services/shopowner/shopOwnerInfoService";
import message from "@/components/ui/message";
import { toast } from "sonner";

// --- Auth (đăng ký / mật khẩu) ---

function persistPasswordSignInSession(
  axiosResponse: Awaited<ReturnType<typeof signInWithPassword>>,
  user: AuthUser,
  token: string
) {
  const authorization =
    axiosResponse?.headers?.[Authorization] ||
    axiosResponse?.headers?.[Authorization.toLowerCase()] ||
    `Bearer ${token}`;

  setToken(token);
  const userInfo = {
    name: user.name,
    email: user.email,
    picture: user.avatar || user.picture,
    role: user.role,
  };
  authorizationUtil.setItems({
    Authorization: authorization,
    userInfo: JSON.stringify(userInfo),
    Token: token,
    role: String(user.role ?? ""),
  });

  notifyAuthSessionUpdated();
}

export type {
  ISignUpPayload,
  ISignInWithPasswordPayload,
  ITakePasswordResetCodePayload,
  IForgotPasswordPayload,
  IChangePasswordPayload,
};

export const useSignUp = () => {
  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationKey: ["user-sign-up"],
    mutationFn: async (payload: ISignUpPayload) => {
      const axiosResponse = await signUpUser(payload);
      return axiosResponse.data;
    },
  });

  return { data, loading, signUp: mutateAsync };
};

export const useSignInWithPassword = () => {
  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationKey: ["user-sign-in-pw"],
    mutationFn: async (payload: ISignInWithPasswordPayload) => {
      const axiosResponse = await signInWithPassword(payload);
      const res = axiosResponse.data;

      if (res?.code === 0 && res.data?.token) {
        persistPasswordSignInSession(
          axiosResponse,
          res.data.user,
          res.data.token
        );
        await persistDefaultShopInLocalStorage();
      }

      return res;
    },
  });

  return { data, loading, signIn: mutateAsync };
};

export const useTakePasswordResetCode = () => {
  const { error, success } = useHotToast();
  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationKey: ["user-take-reset-code"],
    mutationFn: async (payload: ITakePasswordResetCodePayload) => {
      const axiosResponse = await takePasswordResetCode(payload);
      const res = axiosResponse.data;

      if (res?.code === 0) {
        success(res.msg || "Mã khôi phục đã được gửi đến email của bạn");
      } else {
        error(res?.msg || "Không gửi được mã khôi phục");
      }

      return res;
    },
  });

  return { data, loading, takeResetCode: mutateAsync };
};

export const useForgotPassword = () => {
  const { error, success } = useHotToast();
  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationKey: ["user-forgot-password"],
    mutationFn: async (payload: IForgotPasswordPayload) => {
      const axiosResponse = await forgotPassword(payload);
      const res = axiosResponse.data;

      if (res?.code === 0) {
        success(res.msg || "Đặt lại mật khẩu thành công");
      } else {
        error(res?.msg || "Đặt lại mật khẩu thất bại");
      }

      return res;
    },
  });

  return { data, loading, forgotPassword: mutateAsync };
};

export const useChangePassword = () => {
  const { error, success } = useHotToast();
  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationKey: ["user-change-password"],
    mutationFn: async (payload: IChangePasswordPayload) => {
      const axiosResponse = await changePassword(payload);
      const res = axiosResponse.data;

      if (res?.code === 0) {
        success(res.msg || "Đổi mật khẩu thành công");
      } else {
        error(res?.msg || "Đổi mật khẩu thất bại");
      }

      return res;
    },
  });

  return { data, loading, changePassword: mutateAsync };
};

// --- Shops ---

export interface IGetUserShopsRequest {
  page?: number;
  page_size?: number;
}

export const useGetUserShops = (params?: IGetUserShopsRequest) => {
  const { error } = useHotToast();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["user-shops", params],
    queryFn: async () => {
      try {
        return await fetchUserShops(params?.page, params?.page_size);
      } catch {
        error("Không tải được danh sách cửa hàng.");
        return {
          items: [] as UserShop[],
          pagination: null as PaginationInfo | null,
        };
      }
    },
  });

  return {
    data,
    shops: data?.items ?? [],
    pagination: data?.pagination ?? null,
    loading: isLoading || isFetching,
    refetch,
  };
};

// --- Products ---

export interface IGetUserProductsRequest {
  shop_id: string;
  page?: number;
  page_size?: number;
}

export interface IGetUserProductDetailRequest {
  product_id: string;
}

export const useGetUserProducts = (params?: IGetUserProductsRequest) => {
  const { error } = useHotToast();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["user-products", params],
    enabled: !!params?.shop_id,
    queryFn: async () => {
      if (!params?.shop_id) {
        return {
          items: [] as UserProduct[],
          pagination: null as PaginationInfo | null,
        };
      }

      try {
        return await fetchUserProducts(params);
      } catch {
        error("Không tải được danh sách sản phẩm.");
        return {
          items: [] as UserProduct[],
          pagination: null as PaginationInfo | null,
        };
      }
    },
  });

  return {
    data,
    products: data?.items ?? [],
    pagination: data?.pagination ?? null,
    loading: isLoading || isFetching,
    refetch,
  };
};

export type { ProductSortStrategy };

export interface ISortPublicProductsRequest {
  shopId: string;
  sortStrategy: ProductSortStrategy;
  page?: number;
  page_size?: number;
}

/**
 * POST /v1/public/product-sort — sắp xếp SP theo giá hoặc bán chạy (không JWT).
 */
export const useSortPublicProducts = (params?: ISortPublicProductsRequest) => {
  const { error } = useHotToast();
  const shopId = params?.shopId?.trim() ?? "";
  const sortStrategy = params?.sortStrategy;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["public-product-sort", params],
    enabled: Boolean(shopId && sortStrategy),
    queryFn: async (): Promise<SortPublicProductsData> => {
      if (!shopId || !sortStrategy) {
        return {
          items: [],
          pagination: null,
          sortStrategy: sortStrategy ?? "price-descend",
        };
      }

      try {
        return await sortPublicProducts({
          shopId,
          sortStrategy,
          page: params?.page ?? 1,
          page_size: params?.page_size ?? 10,
        });
      } catch {
        error("Không tải được sản phẩm theo bộ lọc sắp xếp.");
        return {
          items: [],
          pagination: {
            page: params?.page ?? 1,
            page_size: params?.page_size ?? 10,
            total: 0,
          },
          sortStrategy,
        };
      }
    },
  });

  return {
    data,
    products: data?.items ?? [],
    pagination: data?.pagination ?? null,
    sortStrategy: data?.sortStrategy ?? sortStrategy ?? null,
    loading: isLoading || isFetching,
    refetch,
  };
};

export const useGetUserProductDetail = (
  params?: IGetUserProductDetailRequest
) => {
  const { error } = useHotToast();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["user-product-detail", params?.product_id],
    enabled: !!params?.product_id,
    queryFn: async () => {
      if (!params?.product_id) return null;

      try {
        return await fetchUserProductDetail(params.product_id);
      } catch {
        error("Không tải được chi tiết sản phẩm.");
        return null;
      }
    },
  });

  return {
    data,
    product: data,
    loading: isLoading || isFetching,
    refetch,
  };
};

// --- Payment ---

export const useCreateOrder = () => {
  const { success } = useHotToast();

  const { data, isPending, mutateAsync } = useMutation({
    mutationKey: ["user-create-order"],
    mutationFn: async (payload: ICreateOrderPayload) => {
      const axiosResponse = await createOrderFromItems(payload);
      const res = axiosResponse.data || {};

      if (res.code === 0 || res.code === 200) {
        success("Tạo đơn hàng thành công");
      }

      return res;
    },
  });

  return {
    data,
    loading: isPending,
    createOrder: mutateAsync,
  };
};

export const useCheckout = () => {
  const { error, success } = useHotToast();

  const { data, isPending, mutateAsync } = useMutation({
    mutationKey: ["user-checkout"],
    mutationFn: async (payload: ICheckoutPayload) => {
      const axiosResponse = await checkoutOrder(payload);
      const res = axiosResponse.data || {};

      if (res.code === 0 || res.code === 200) {
        success("Đặt hàng thành công!");
      } else {
        error("Không thể đặt hàng");
      }

      return res;
    },
  });

  return {
    data,
    loading: isPending,
    checkout: mutateAsync,
  };
};

// --- Orders / cart ---

export interface IGetCartProductsRequest {
  orderId: string;
}

export interface IGetUserOrderStatusRequest {
  orderId: string;
}

export type ICancelUserOrderRequest = ICancelUserOrderPayload;

export const useCancelUserOrder = () => {
  const { error, success } = useHotToast();
  const queryClient = useQueryClient();

  const { data, isPending, mutateAsync } = useMutation({
    mutationKey: ["user-cancel-order"],
    mutationFn: async (payload: ICancelUserOrderRequest) => {
      const axiosResponse = await cancelUserOrder(payload);
      const res = axiosResponse.data || {};

      if (res.code === 0 || res.code === 200) {
        success(
          (typeof res.msg === "string" && res.msg.trim()) ||
            "Hủy đơn hàng thành công"
        );
        await queryClient.invalidateQueries({
          queryKey: ["user-delivery-status"],
        });
        await queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      } else {
        error(
          (typeof res.msg === "string" && res.msg.trim()) ||
            "Không thể hủy đơn hàng."
        );
      }

      return res;
    },
  });

  return {
    data,
    loading: isPending,
    cancelOrder: mutateAsync,
  };
};

export const useAddProductToCart = () => {
  const { error, success } = useHotToast();
  const queryClient = useQueryClient();

  const { data, isPending, mutateAsync } = useMutation({
    mutationKey: ["add-product-to-cart"],
    mutationFn: async (payload: IAddProductToCartPayload) => {
      const axiosResponse = await addProductToCart(payload);
      const res = axiosResponse.data || {};

      if (res.code === 0 || res.code === 200) {
        // su dung toast de thong bao thanh cong
        toast.success("Thêm sản phẩm vào giỏ hàng thành công");
        await queryClient.invalidateQueries({
          queryKey: ["user-cart-order-products"],
        });
      } else {
        error("Không thêm được sản phẩm vào giỏ hàng");
      }

      return res;
    },
  });

  return {
    data,
    loading: isPending,
    addToCart: mutateAsync,
  };
};

export type IUpdateCartProductQuantityRequest =
  IUpdateCartProductQuantityPayload;

export const useUpdateCartProductQuantity = () => {
  const { error } = useHotToast();
  const queryClient = useQueryClient();

  const { data, isPending, mutateAsync } = useMutation({
    mutationKey: ["user-update-cart-quantity"],
    mutationFn: async (payload: IUpdateCartProductQuantityRequest) => {
      const axiosResponse = await updateCartProductQuantity(payload);
      const res = axiosResponse.data || {};

      if (res.code === 0 || res.code === 200) {
        await queryClient.invalidateQueries({
          queryKey: ["user-cart-order-products"],
        });
      } else {
        error(
          (typeof res.msg === "string" && res.msg.trim()) ||
            "Không cập nhật được số lượng sản phẩm."
        );
      }

      return res;
    },
  });

  return {
    data,
    loading: isPending,
    updateQuantity: mutateAsync,
  };
};

export type IRemoveProductFromCartRequest = IRemoveProductFromCartPayload;

export const useRemoveProductFromCart = () => {
  const { error, success } = useHotToast();
  const queryClient = useQueryClient();

  const { data, isPending, mutateAsync } = useMutation({
    mutationKey: ["user-remove-from-cart"],
    mutationFn: async (payload: IRemoveProductFromCartRequest) => {
      const axiosResponse = await removeProductFromCart(payload);
      const res = axiosResponse.data || {};

      if (res.code === 0 || res.code === 200) {
        success(
          (typeof res.msg === "string" && res.msg.trim()) ||
            "Đã xóa sản phẩm khỏi giỏ hàng"
        );
        await queryClient.invalidateQueries({
          queryKey: ["user-cart-order-products"],
        });
      } else {
        error(
          (typeof res.msg === "string" && res.msg.trim()) ||
            "Không xóa được sản phẩm khỏi giỏ hàng."
        );
      }

      return res;
    },
  });

  return {
    data,
    loading: isPending,
    removeFromCart: mutateAsync,
  };
};

export const useGetUserOrders = () => {
  const { error } = useHotToast();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      try {
        return await fetchUserOrders();
      } catch {
        error("Không tải được danh sách đơn hàng.");
        return {
          items: [],
          pagination: null,
        } as IUserOrdersData;
      }
    },
  });

  return {
    data,
    orders: data?.items ?? [],
    pagination: data?.pagination ?? null,
    loading: isLoading || isFetching,
    refetch,
  };
};

export const useGetUserOrderStatus = (params?: IGetUserOrderStatusRequest) => {
  const { error } = useHotToast();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["user-order-status", params?.orderId],
    enabled: !!params?.orderId,
    queryFn: async () => {
      if (!params?.orderId) return null;

      try {
        return await fetchUserOrderStatus(params.orderId);
      } catch {
        error("Không tải được trạng thái đơn hàng.");
        return null as IUserOrderStatus | null;
      }
    },
  });

  return {
    data,
    status: data?.orderStatus ?? data?.status ?? null,
    loading: isLoading || isFetching,
    refetch,
  };
};

export type IGetUserDeliveryStatusRequest =
  | FetchUserDeliveryStatusParams
  | undefined;

export const useGetUserDeliveryStatus = (
  params?: IGetUserDeliveryStatusRequest
) => {
  const { error } = useHotToast();
  const page = params?.page ?? 1;
  const page_size = params?.page_size ?? 10;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["user-delivery-status", page, page_size],
    queryFn: async (): Promise<UserDeliveryStatusListData> => {
      try {
        return await fetchUserDeliveryStatus({ page, page_size });
      } catch {
        error("Không tải được trạng thái giao hàng.");
        return {
          items: [] as UserDeliveryStatusRow[],
          pagination: null,
        };
      }
    },
  });

  return {
    data,
    items: data?.items ?? [],
    pagination: data?.pagination ?? null,
    loading: isLoading || isFetching,
    refetch,
  };
};

export interface IClaimUserVoucherRequest {
  voucherId: string;
}

export const useClaimUserVoucher = () => {
  const { error, success } = useHotToast();

  const { data, isPending, mutateAsync } = useMutation({
    mutationKey: ["user-claim-voucher"],
    mutationFn: async (payload: IClaimUserVoucherRequest) => {
      const axiosResponse = await claimUserVoucher(payload);
      const res = axiosResponse.data || {};

      if (res.code === 0 || res.code === 200) {
        success("Đã đổi điểm lấy voucher.");
      } else {
        error(
          (typeof res.msg === "string" && res.msg.trim()) ||
            "Không đổi được voucher."
        );
      }

      return res;
    },
  });

  return {
    data,
    loading: isPending,
    claimVoucher: mutateAsync,
  };
};

export type IUseListMyVoucherRequest = FetchUserVoucherParams | undefined;

export const useListMyVoucher = (params?: IUseListMyVoucherRequest) => {
  const { error } = useHotToast();
  const page = params?.page ?? 1;
  const page_size = params?.page_size ?? 10;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["user-my-vouchers", page, page_size],
    queryFn: async (): Promise<UserVoucherListData> => {
      try {
        return await fetchUserVouchers({ page, page_size });
      } catch {
        error("Không tải được danh sách voucher của bạn.");
        return {
          items: [] as UserVoucherItem[],
          pagination: null,
        };
      }
    },
  });

  return {
    data,
    vouchers: data?.items ?? [],
    pagination: data?.pagination ?? null,
    loading: isLoading || isFetching,
    refetch,
  };
};

export const useGetUserCredit = () => {
  const { error } = useHotToast();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["user-my-credit"],
    queryFn: async (): Promise<UserCreditDetail | null> => {
      try {
        return await fetchUserCredit();
      } catch {
        error("Không tải được điểm của bạn.");
        return null;
      }
    },
  });

  return {
    data,
    credit: data,
    totalCredit: data?.totalCredit ?? 0,
    usedCredit: data?.usedCredit ?? 0,
    loading: isLoading || isFetching,
    refetch,
  };
};

export const useGetCartProducts = (params?: IGetCartProductsRequest) => {
  const { error } = useHotToast();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["user-cart-products", params?.orderId],
    enabled: !!params?.orderId,
    queryFn: async () => {
      if (!params?.orderId) {
        return {
          items: [] as UserProduct[],
          pagination: null as PaginationInfo | null,
        };
      }

      try {
        return await fetchCartProducts(params.orderId);
      } catch {
        error("Không tải được sản phẩm trong giỏ.");
        return {
          items: [] as UserProduct[],
          pagination: null as PaginationInfo | null,
        };
      }
    },
  });

  return {
    data,
    products: data?.items ?? [],
    pagination: data?.pagination ?? null,
    loading: isLoading || isFetching,
    refetch,
  };
};

export const useGetUserCartOrderProducts = (enabled = true) => {
  const { error } = useHotToast();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["user-cart-order-products"],
    enabled,
    queryFn: async () => {
      try {
        return await fetchUserCartOrderProducts();
      } catch {
        error("Không tải được giỏ hàng.");
        return {
          order: null as IUserCartOrder | null,
          items: [] as IUserCartOrderItem[],
          pagination: null as PaginationInfo | null,
        };
      }
    },
  });

  return {
    data,
    order: data?.order ?? null,
    items: data?.items ?? [],
    products: (data?.items ?? []).map((x) => x.product),
    pagination: data?.pagination ?? null,
    loading: isLoading || isFetching,
    refetch,
  };
};

// --- Conversation ---

export interface UseChatCompletionOptions {
  /** Mặc định raw; dùng sse nếu server gửi SSE (data: ...). */
  streamFormat?: StreamConversationAskOptions["streamFormat"];
}

export function useChatCompletion(options?: UseChatCompletionOptions) {
  const streamFormat = options?.streamFormat ?? "raw";

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    abort();
    setText("");
    setError(null);
    setLoading(false);
  }, [abort]);

  const send = useCallback(
    async (params: { shopId: string; userQuestion: string }) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      setText("");
      setError(null);
      setLoading(true);

      try {
        let acc = "";
        await streamConversationAsk({
          shopId: params.shopId,
          userQuestion: params.userQuestion,
          signal: ac.signal,
          streamFormat,
          onChunk: (chunk) => {
            acc += chunk;
            setText(acc);
          },
        });
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          return;
        }
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setLoading(false);
        if (abortRef.current === ac) abortRef.current = null;
      }
    },
    [streamFormat]
  );

  return {
    text,
    loading,
    error,
    send,
    abort,
    reset,
    setText,
  };
}

export function useChatHistory(shopId: string | undefined) {
  const { error } = useHotToast();

  const {
    data,
    isLoading,
    isFetching,
    refetch,
    error: queryError,
  } = useQuery({
    queryKey: ["conversation-history", shopId],
    enabled: Boolean(shopId),
    queryFn: async () => {
      if (!shopId) return null;
      try {
        return await fetchConversationHistory(shopId);
      } catch {
        error("Could not load conversation history.");
        return null;
      }
    },
  });

  return {
    data,
    history: data,
    loading: isLoading || isFetching,
    refetch,
    error: queryError,
  };
}

export const useSignInGoogle = () => {
  const { error, success } = useHotToast();
  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationKey: ["oauth-login"],
    mutationFn: async (params: {
      code: string;
      google_redirect_uri: string;
    }) => {
      const axiosResponse = await userService.oauthLogin({
        code: params.code,
        callback_url: params.google_redirect_uri,
      });
      const res = axiosResponse.data || {};

      if (res.code === 0) {
        // Axios normalizes response headers to lowercase
        const authorization =
          axiosResponse?.headers?.[Authorization] ||
          axiosResponse?.headers?.[Authorization.toLowerCase()] ||
          "";
        const token = res.data.token;

        setToken(token);
        const user = res.data.user;
        const userInfo = {
          name: user.name,
          email: user.email,
          picture: user.avatar || user.picture,
          role: user.role,
        };
        authorizationUtil.setItems({
          Authorization: authorization,
          userInfo: JSON.stringify(userInfo),
          Token: token,
          role: user.role,
        });
        notifyAuthSessionUpdated();
        success("Đăng nhập thành công");
      } else {
        error("Đăng nhập thất bại");
      }
      return res.code;
    },
  });
  return { data, loading, login: mutateAsync };
};

// Re-exports: shop owner product image

export { useUploadShopownerProductImage } from "@/hooks/shopowner/useShopOwnerHook";
export type { IUploadShopownerProductImageRequest } from "@/hooks/shopowner/useShopOwnerHook";
