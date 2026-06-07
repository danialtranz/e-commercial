import { Authorization } from "@/constants/authorization";
import { useHotToast } from "@/components/ui/hot-toast";
import authorizationUtil from "@/utils/authorizationUtil";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { setToken } from "@/utils/tokenManager";
import { api_host } from "@/apis/endpoint";
import registerNextServer from "@/utils/registerServer";
import {
  uploadShopownerProductImage,
  type UploadShopownerProductImageParams,
  type UploadShopownerProductImageResult,
} from "@/services/shopowner/productImageService";
import {
  createShopownerProduct,
  deleteShopownerProduct,
  fetchPublicActiveCategories,
  getShopownerStockRemain,
  publicCategoriesQueryKey,
  searchPublicProductsByKeyword,
  updateShopownerStock,
  type CreateShopownerProductParams,
  type CreateShopownerProductResult,
  type DeleteShopownerProductParams,
  type DeleteShopownerProductResult,
  type GetShopownerStockRemainParams,
  type PublicCategory,
  type PublicProductSearchData,
  type SearchPublicProductsParams,
  type ShopownerStockRemainData,
  type UpdateShopownerStockParams,
  type UpdateShopownerStockResult,
} from "@/services/shopowner/shopownerProductService";
import type { PaginationInfo, UserProduct } from "@/interface/shop";
import {
  fetchShopOwnerIncome,
  type ShopOwnerIncomeData,
  type ShopOwnerIncomeDateRange,
} from "@/services/shopowner/dashboardService";
import {
  fetchDefaultShopInfo,
  fetchShopOwnerInfo,
  type ShopOwnerInfoData,
} from "@/services/shopowner/shopOwnerInfoService";
import {
  listShopownerAdvertisements,
  publicActiveAdvertisementQueryKey,
  updateShopownerAdvertisementStatus,
  uploadShopownerAdvertisement,
  type ListShopownerAdvertisementsParams,
  type ShopownerAdvertisementRow,
  type ShopownerAdvertisementsListData,
  type ShopownerAdvertisementStatus,
  type UpdateShopownerAdvertisementStatusParams,
  type UpdateShopownerAdvertisementStatusResult,
  type UploadShopownerAdvertisementParams,
  type UploadShopownerAdvertisementResult,
} from "@/services/shopowner/shopownerAdvertisementService";
import {
  createShopownerFlashSaleCampaign,
  deleteShopownerFlashSaleCampaign,
  listShopownerFlashSaleCampaigns,
  updateShopownerFlashSaleCampaignStatus,
  type CreateShopownerFlashSaleCampaignParams,
  type CreateShopownerFlashSaleCampaignResult,
  type DeleteShopownerFlashSaleCampaignParams,
  type DeleteShopownerFlashSaleCampaignResult,
  type ListShopownerFlashSaleCampaignsParams,
  type ShopownerFlashSaleCampaignRow,
  type ShopownerFlashSaleListData,
  type ShopownerFlashSaleManualStatus,
  type UpdateShopownerFlashSaleCampaignStatusParams,
  type UpdateShopownerFlashSaleCampaignStatusResult,
} from "@/services/shopowner/shopownerFlashSaleService";
import {
  createShopownerProductComment,
  listShopownerProductComments,
  type CreateShopownerProductCommentParams,
  type CreateShopownerProductCommentResult,
  type ListShopownerProductCommentsParams,
  type ShopownerProductCommentRow,
  type ShopownerProductCommentsListData,
} from "@/services/shopowner/shopownerCommentService";
import {
  createShopownerVoucher,
  listShopownerVouchers,
  type CreateShopownerVoucherParams,
  type CreateShopownerVoucherResult,
  type ListShopownerVouchersParams,
  type ShopownerVouchersListData,
} from "@/services/shopowner/shopownerVoucherService";
import {
  listShopownerUsers,
  updateShopownerUserStatus,
  type ListShopownerUsersParams,
  type ListShopownerUsersResult,
  type ShopownerUserRow,
  type ShopownerUsersListData,
  type UpdateShopownerUserStatusParams,
  type UpdateShopownerUserStatusResult,
} from "@/services/shopowner/shopownerUserService";

// --- Product image ---

export type IUploadShopownerProductImageRequest =
  UploadShopownerProductImageParams;

export const useUploadShopownerProductImage = () => {
  const { success, error } = useHotToast();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["shopowner-upload-product-image"],
    mutationFn: async (
      payload: IUploadShopownerProductImageRequest
    ): Promise<UploadShopownerProductImageResult> => {
      const result = await uploadShopownerProductImage(payload);

      if (result.ok) {
        success("Product image updated.");
        void queryClient.invalidateQueries({ queryKey: ["user-products"] });
        void queryClient.invalidateQueries({
          queryKey: ["user-product-detail", payload.productId],
        });
      } else {
        error(result.msg?.trim() || "Could not update the product image.");
      }

      return result;
    },
  });

  return {
    uploadProductImage: mutateAsync,
    loading: isPending,
  };
};

// --- Create / delete product ---

export type ICreateShopownerProductRequest = CreateShopownerProductParams;

export const useCreateShopownerProduct = () => {
  const { success, error } = useHotToast();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["shopowner-create-product"],
    mutationFn: async (
      payload: ICreateShopownerProductRequest
    ): Promise<CreateShopownerProductResult> => {
      const result = await createShopownerProduct(payload);

      if (result.ok) {
        success("Đã tạo sản phẩm.");
        void queryClient.invalidateQueries({ queryKey: ["user-products"] });
      } else {
        error(result.msg?.trim() || "Không tạo được sản phẩm.");
      }

      return result;
    },
  });

  return {
    createProduct: mutateAsync,
    loading: isPending,
  };
};

export type IDeleteShopownerProductRequest = DeleteShopownerProductParams;

export const useDeleteShopownerProduct = () => {
  const { success, error } = useHotToast();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["shopowner-delete-product"],
    mutationFn: async (
      payload: IDeleteShopownerProductRequest
    ): Promise<DeleteShopownerProductResult> => {
      const result = await deleteShopownerProduct(payload);

      if (result.ok) {
        success("Đã xóa sản phẩm.");
        void queryClient.invalidateQueries({ queryKey: ["user-products"] });
        void queryClient.invalidateQueries({
          queryKey: ["user-product-detail", payload.productId],
        });
      } else {
        error(result.msg?.trim() || "Không xóa được sản phẩm.");
      }

      return result;
    },
  });

  return {
    deleteProduct: mutateAsync,
    loading: isPending,
  };
};

// --- Stock (manager-quantity) ---

export type IUpdateStockRequest = UpdateShopownerStockParams;

export const useUpdateStock = () => {
  const { success, error } = useHotToast();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["shopowner-update-stock"],
    mutationFn: async (
      payload: IUpdateStockRequest
    ): Promise<UpdateShopownerStockResult> => {
      const result = await updateShopownerStock(payload);

      if (result.ok) {
        success("Đã cập nhật tồn kho.");
        void queryClient.invalidateQueries({
          queryKey: ["shopowner-stock-remain"],
        });
        void queryClient.invalidateQueries({ queryKey: ["user-products"] });
        void queryClient.invalidateQueries({
          queryKey: ["user-product-detail", payload.productId],
        });
      } else {
        error(result.msg?.trim() || "Không cập nhật được tồn kho.");
      }

      return result;
    },
  });

  return {
    updateStock: mutateAsync,
    loading: isPending,
  };
};

export type IGetStockRemainRequest = GetShopownerStockRemainParams;

export const useGetStockRemain = (
  params: IGetStockRemainRequest | undefined
) => {
  const { error } = useHotToast();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      "shopowner-stock-remain",
      params?.shopId,
      params?.productId,
      params?.page ?? 1,
      params?.page_size ?? 10,
    ],
    enabled: !!params?.shopId && !!params?.productId,
    queryFn: async () => {
      if (!params?.shopId || !params?.productId) return null;

      const result = await getShopownerStockRemain({
        shopId: params.shopId,
        productId: params.productId,
        page: params.page,
        page_size: params.page_size,
      });

      if (!result.ok) {
        error(result.msg?.trim() || "Không tải được lịch sử tồn kho.");
        return null as ShopownerStockRemainData | null;
      }

      return result.data;
    },
  });

  return {
    data,
    stockRemain: data,
    loading: isLoading || isFetching,
    refetch,
  };
};

// --- Dashboard ---

export interface IGetIncomeRequest {
  shopId: string;
  daysAgo?: number;
  /** DD-MM-YYYY — ưu tiên hơn daysAgo */
  dateRange?: ShopOwnerIncomeDateRange;
}

type IncomeArg = number | IGetIncomeRequest | undefined;

function resolveIncomeParams(arg?: IncomeArg): IGetIncomeRequest | undefined {
  if (typeof arg === "number") {
    if (typeof window === "undefined") return undefined;
    const shopId =
      localStorage.getItem("shopId") ||
      localStorage.getItem("shop_id") ||
      localStorage.getItem("currentShopId") ||
      "";
    if (!shopId) return undefined;
    return { shopId, daysAgo: arg };
  }
  return arg;
}

function incomeQueryKey(params: IGetIncomeRequest | undefined) {
  if (!params) return ["shopowner-income"] as const;
  const range = params.dateRange;
  if (range?.from && range?.to) {
    return [
      "shopowner-income",
      params.shopId,
      "range",
      range.from,
      range.to,
    ] as const;
  }
  return [
    "shopowner-income",
    params.shopId,
    "days",
    params.daysAgo ?? 7,
  ] as const;
}

export const useGetIncome = (arg?: IncomeArg) => {
  const { error } = useHotToast();
  const params = resolveIncomeParams(arg);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: incomeQueryKey(params),
    enabled: !!params?.shopId,
    queryFn: async () => {
      if (!params?.shopId) return null;

      try {
        const result = await fetchShopOwnerIncome({
          shopId: params.shopId,
          daysAgo: params.daysAgo ?? 7,
          dateRange: params.dateRange,
        });

        if (!result.ok) {
          error(result.msg?.trim() || "Không tải được doanh thu.");
          return null;
        }

        return result.data;
      } catch {
        error("Không tải được doanh thu.");
        return null as ShopOwnerIncomeData | null;
      }
    },
  });

  return {
    data,
    income: data,
    loading: isLoading || isFetching,
    refetch,
  };
};

// --- Public default shop ---

export const useGetDefaultShopInfo = () => {
  const { error } = useHotToast();

  const {
    data,
    isLoading,
    isFetching,
    refetch,
    error: queryError,
  } = useQuery({
    queryKey: ["public-default-shop-info"],
    queryFn: async () => {
      try {
        return await fetchDefaultShopInfo();
      } catch {
        error("Could not load shop information.");
        return null as ShopOwnerInfoData | null;
      }
    },
  });

  return {
    data,
    shopInfo: data,
    loading: isLoading || isFetching,
    refetch,
    error: queryError,
  };
};

// --- Public categories & product search ---

/**
 * GET /v1/public/categories — danh mục active (không JWT).
 */
export const useGetPublicCategories = () => {
  const { error } = useHotToast();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: publicCategoriesQueryKey,
    queryFn: async () => {
      try {
        return await fetchPublicActiveCategories();
      } catch {
        error("Could not load categories.");
        return [] as PublicCategory[];
      }
    },
  });

  return {
    data,
    categories: data ?? [],
    loading: isLoading || isFetching,
    refetch,
  };
};

export interface ISearchPublicProductsRequest {
  keyWord: string;
  page?: number;
  page_size?: number;
}

/**
 * POST /v1/public/product-search — tìm sản phẩm theo `keyWord` (không JWT).
 * Chỉ gọi API khi `keyWord` sau trim khác rỗng.
 */
export const useSearchPublicProducts = (
  params?: ISearchPublicProductsRequest
) => {
  const { error } = useHotToast();
  const keyword = params?.keyWord?.trim() ?? "";

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["public-product-search", params],
    enabled: keyword.length > 0,
    queryFn: async (): Promise<PublicProductSearchData> => {
      try {
        return await searchPublicProductsByKeyword({
          keyWord: keyword,
          page: params?.page ?? 1,
          page_size: params?.page_size ?? 10,
        });
      } catch {
        error("Could not search products.");
        return {
          items: [] as UserProduct[],
          pagination: {
            page: params?.page ?? 1,
            page_size: params?.page_size ?? 10,
            total: 0,
          } as PaginationInfo,
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

export type {
  PublicCategory,
  PublicProductSearchData,
  SearchPublicProductsParams,
};

// --- Auth ---

const methods = {
  oauthLogin: {
    url: `${api_host}/shopowner/oAuth-login`,
    method: "post",
  },
} as const;

const shopOwnerAuthService = registerNextServer<keyof typeof methods>(methods);

export const useSignInGoogle = () => {
  const { error, success } = useHotToast();
  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationKey: ["shopowner-oauth-login"],
    mutationFn: async (params: {
      code: string;
      google_redirect_uri: string;
    }) => {
      const axiosResponse = await shopOwnerAuthService.oauthLogin({
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
        success("Đăng nhập thành công");
      } else {
        error("Đăng nhập thất bại");
      }
      return res.code;
    },
  });

  return { data, loading, login: mutateAsync };
};

const SHOP_ID_KEYS = ["shopId", "shop_id", "currentShopId"] as const;

function persistShopId(shopId: string) {
  if (typeof window === "undefined") return;
  for (const key of SHOP_ID_KEYS) {
    localStorage.setItem(key, shopId);
  }
}

export const useGetShopId = () => {
  const {
    data,
    isPending: loading,
    mutateAsync: fetchShopId,
    reset,
  } = useMutation({
    mutationKey: ["shopowner-info", "shop-id"],
    mutationFn: async (): Promise<ShopOwnerInfoData | null> => {
      return fetchShopOwnerInfo();
    },
    onSuccess: (payload) => {
      if (payload?.shopId) {
        persistShopId(payload.shopId);
      }
    },
  });

  return {
    data,
    shopInfo: data,
    loading,
    fetchShopId,
    reset,
  };
};

// --- Advertisements (adv) ---

export type IUploadShopownerAdvertisementRequest =
  UploadShopownerAdvertisementParams;

export const useUploadShopownerAdvertisement = () => {
  const { success, error } = useHotToast();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["shopowner-upload-advertisement"],
    mutationFn: async (
      payload: IUploadShopownerAdvertisementRequest
    ): Promise<UploadShopownerAdvertisementResult> => {
      const result = await uploadShopownerAdvertisement(payload);

      if (result.ok) {
        success("Đã tải lên quảng cáo.");
        void queryClient.invalidateQueries({ queryKey: ["shopowner-advs"] });
        void queryClient.invalidateQueries({
          queryKey: publicActiveAdvertisementQueryKey,
        });
      } else {
        error(result.msg?.trim() || "Không tải lên được quảng cáo.");
      }

      return result;
    },
  });

  return {
    uploadAdvertisement: mutateAsync,
    loading: isPending,
  };
};

export type IListShopownerAdvertisementsRequest =
  | ListShopownerAdvertisementsParams
  | undefined;

export const useListShopownerAdvertisements = (
  params?: IListShopownerAdvertisementsRequest
) => {
  const { error } = useHotToast();
  const page = params?.page ?? 1;
  const page_size = params?.page_size ?? 10;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["shopowner-advs", page, page_size],
    queryFn: async (): Promise<ShopownerAdvertisementsListData | null> => {
      const result = await listShopownerAdvertisements({
        page,
        page_size,
      });

      if (!result.ok) {
        error(result.msg?.trim() || "Không tải được danh sách quảng cáo.");
        return null;
      }

      return result.data;
    },
  });

  return {
    data,
    advertisements: data,
    loading: isLoading || isFetching,
    refetch,
  };
};

export type IUpdateShopownerAdvertisementStatusRequest =
  UpdateShopownerAdvertisementStatusParams;

export const useUpdateShopownerAdvertisementStatus = () => {
  const { success, error } = useHotToast();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["shopowner-update-advertisement-status"],
    mutationFn: async (
      payload: IUpdateShopownerAdvertisementStatusRequest
    ): Promise<UpdateShopownerAdvertisementStatusResult> => {
      const result = await updateShopownerAdvertisementStatus(payload);

      if (result.ok) {
        success("Đã cập nhật trạng thái quảng cáo.");
        void queryClient.invalidateQueries({ queryKey: ["shopowner-advs"] });
        void queryClient.invalidateQueries({
          queryKey: publicActiveAdvertisementQueryKey,
        });
      } else {
        error(
          result.msg?.trim() || "Không cập nhật được trạng thái quảng cáo."
        );
      }

      return result;
    },
  });

  return {
    updateAdvertisementStatus: mutateAsync,
    loading: isPending,
  };
};

export type { ShopownerAdvertisementRow, ShopownerAdvertisementStatus };

// --- Flash sale (Flscamp) ---

export type ICreateShopownerFlashSaleCampaignRequest =
  CreateShopownerFlashSaleCampaignParams;

export const useCreateShopownerFlashSaleCampaign = () => {
  const { success, error } = useHotToast();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["shopowner-create-flash-sale"],
    mutationFn: async (
      payload: ICreateShopownerFlashSaleCampaignRequest
    ): Promise<CreateShopownerFlashSaleCampaignResult> => {
      const result = await createShopownerFlashSaleCampaign(payload);

      if (result.ok) {
        success("Đã tạo chiến dịch flash sale.");
        void queryClient.invalidateQueries({
          queryKey: ["shopowner-flash-sale-campaigns"],
        });
      } else {
        error(result.msg?.trim() || "Không tạo được chiến dịch flash sale.");
      }

      return result;
    },
  });

  return {
    createFlashSaleCampaign: mutateAsync,
    loading: isPending,
  };
};

export type IListShopownerFlashSaleCampaignsRequest =
  | ListShopownerFlashSaleCampaignsParams
  | undefined;

export const useListShopownerFlashSaleCampaigns = (
  params?: IListShopownerFlashSaleCampaignsRequest
) => {
  const { error } = useHotToast();
  const page = params?.page ?? 1;
  const page_size = params?.page_size ?? 10;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["shopowner-flash-sale-campaigns", page, page_size],
    queryFn: async (): Promise<ShopownerFlashSaleListData | null> => {
      const result = await listShopownerFlashSaleCampaigns({
        page,
        page_size,
      });

      if (!result.ok) {
        error(result.msg?.trim() || "Không tải được danh sách flash sale.");
        return null;
      }

      return result.data;
    },
  });

  return {
    data,
    campaigns: data,
    loading: isLoading || isFetching,
    refetch,
  };
};

export type IUpdateShopownerFlashSaleCampaignStatusRequest =
  UpdateShopownerFlashSaleCampaignStatusParams;

export const useUpdateShopownerFlashSaleCampaignStatus = () => {
  const { success, error } = useHotToast();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["shopowner-update-flash-sale-status"],
    mutationFn: async (
      payload: IUpdateShopownerFlashSaleCampaignStatusRequest
    ): Promise<UpdateShopownerFlashSaleCampaignStatusResult> => {
      const result = await updateShopownerFlashSaleCampaignStatus(payload);

      if (result.ok) {
        success("Đã cập nhật trạng thái flash sale.");
        void queryClient.invalidateQueries({
          queryKey: ["shopowner-flash-sale-campaigns"],
        });
      } else {
        error(
          result.msg?.trim() || "Không cập nhật được trạng thái flash sale."
        );
      }

      return result;
    },
  });

  return {
    updateFlashSaleCampaignStatus: mutateAsync,
    loading: isPending,
  };
};

export type IDeleteShopownerFlashSaleCampaignRequest =
  DeleteShopownerFlashSaleCampaignParams;

export const useDeleteShopownerFlashSaleCampaign = () => {
  const { success, error } = useHotToast();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["shopowner-delete-flash-sale"],
    mutationFn: async (
      payload: IDeleteShopownerFlashSaleCampaignRequest
    ): Promise<DeleteShopownerFlashSaleCampaignResult> => {
      const result = await deleteShopownerFlashSaleCampaign(payload);

      if (result.ok) {
        success("Đã xóa chiến dịch flash sale.");
        void queryClient.invalidateQueries({
          queryKey: ["shopowner-flash-sale-campaigns"],
        });
      } else {
        error(result.msg?.trim() || "Không xóa được chiến dịch flash sale.");
      }

      return result;
    },
  });

  return {
    deleteFlashSaleCampaign: mutateAsync,
    loading: isPending,
  };
};

export type { ShopownerFlashSaleCampaignRow, ShopownerFlashSaleManualStatus };

// --- Product comments ---

export type ICreateShopownerProductCommentRequest =
  CreateShopownerProductCommentParams;

export const useCreateShopownerProductComment = () => {
  const { success, error } = useHotToast();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["shopowner-create-product-comment"],
    mutationFn: async (
      payload: ICreateShopownerProductCommentRequest
    ): Promise<CreateShopownerProductCommentResult> => {
      const result = await createShopownerProductComment(payload);

      if (result.ok) {
        success("Đã đăng bình luận.");
        void queryClient.invalidateQueries({
          queryKey: ["shopowner-product-comments", payload.product_id.trim()],
        });
      } else {
        error(result.msg?.trim() || "Không đăng được bình luận.");
      }

      return result;
    },
  });

  return {
    createProductComment: mutateAsync,
    loading: isPending,
  };
};

export type IListShopownerProductCommentsRequest =
  ListShopownerProductCommentsParams;

export const useListShopownerProductComments = (
  params: IListShopownerProductCommentsRequest | undefined
) => {
  const { error } = useHotToast();
  const productId = params?.product_id?.trim() ?? "";
  const page = params?.page ?? 1;
  const page_size = params?.page_size ?? 10;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["shopowner-product-comments", productId, page, page_size],
    enabled: !!productId,
    queryFn: async (): Promise<ShopownerProductCommentsListData | null> => {
      if (!productId) return null;

      const result = await listShopownerProductComments({
        product_id: productId,
        page,
        page_size,
      });

      if (!result.ok) {
        error(result.msg?.trim() || "Không tải được danh sách bình luận.");
        return null;
      }

      return result.data;
    },
  });

  return {
    data,
    comments: data,
    loading: isLoading || isFetching,
    refetch,
  };
};

export type { ShopownerProductCommentRow };

// --- Vouchers ---

export type ICreateVoucherRequest = CreateShopownerVoucherParams;

export const useCreateVoucher = () => {
  const { success, error } = useHotToast();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["shopowner-create-voucher"],
    mutationFn: async (
      payload: ICreateVoucherRequest
    ): Promise<CreateShopownerVoucherResult> => {
      const result = await createShopownerVoucher(payload);

      if (result.ok) {
        success("Đã tạo voucher.");
        void queryClient.invalidateQueries({
          queryKey: ["shopowner-vouchers"],
        });
      } else {
        error(result.msg?.trim() || "Không tạo được voucher.");
      }

      return result;
    },
  });

  return {
    createVoucher: mutateAsync,
    loading: isPending,
  };
};

export type IGetVouchersRequest = ListShopownerVouchersParams | undefined;

export const useGetVouchers = (params?: IGetVouchersRequest) => {
  const { error } = useHotToast();
  const page = params?.page ?? 1;
  const page_size = params?.page_size ?? 10;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["shopowner-vouchers", page, page_size],
    queryFn: async (): Promise<ShopownerVouchersListData | null> => {
      const result = await listShopownerVouchers({
        page,
        page_size,
      });

      if (!result.ok) {
        error(result.msg?.trim() || "Không tải được danh sách voucher.");
        return null;
      }

      return result.data;
    },
  });

  return {
    data,
    vouchers: data,
    loading: isLoading || isFetching,
    refetch,
  };
};

// --- Users (quản lý tài khoản + thống kê đơn) ---

export type IUpdateShopownerUserStatusRequest = UpdateShopownerUserStatusParams;

export const useUpdateShopownerUserStatus = () => {
  const { success, error } = useHotToast();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["shopowner-update-user-status"],
    mutationFn: async (
      payload: IUpdateShopownerUserStatusRequest
    ): Promise<UpdateShopownerUserStatusResult> => {
      const result = await updateShopownerUserStatus(payload);

      if (result.ok) {
        success("Đã cập nhật trạng thái user.");
        void queryClient.invalidateQueries({ queryKey: ["shopowner-users"] });
      } else {
        error(result.msg?.trim() || "Không cập nhật được trạng thái user.");
      }

      return result;
    },
  });

  return {
    updateUserStatus: mutateAsync,
    loading: isPending,
  };
};

export type IGetShopownerUsersRequest = ListShopownerUsersParams | undefined;

export const useGetShopownerUsers = (params?: IGetShopownerUsersRequest) => {
  const { error } = useHotToast();
  const page = params?.page ?? 1;
  const page_size = params?.page_size ?? 10;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["shopowner-users", page, page_size],
    queryFn: async (): Promise<ShopownerUsersListData | null> => {
      const result = await listShopownerUsers({
        page,
        page_size,
      });

      if (!result.ok) {
        error(result.msg?.trim() || "Không tải được danh sách user.");
        return null;
      }

      return result.data;
    },
  });

  return {
    data,
    users: data,
    loading: isLoading || isFetching,
    refetch,
  };
};

export type { ShopownerUserRow, ListShopownerUsersResult };
