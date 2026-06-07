import { Authorization } from "@/constants/authorization";
import { useHotToast } from "@/components/ui/hot-toast";
import authorizationUtil from "@/utils/authorizationUtil";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { setToken } from "@/utils/tokenManager";
import { api_host } from "@/apis/endpoint";
import registerNextServer from "@/utils/registerServer";
import {
  fetchCollaboratorMyDeliveries,
  patchCollaboratorMyDeliveryStatus,
  upsertCollaboratorShipperInfo,
  type FetchCollaboratorMyDeliveriesParams,
  type PatchCollaboratorMyDeliveryParams,
  type UpsertCollaboratorShipperInfoParams,
  type CollaboratorMyDeliveriesListData,
  type CollaboratorDeliveryRow,
  fetchCollaboratorCollaInfo,
  type CollaboratorCollaInfoData,
} from "@/services/collaborator/collaboratorService";

const methods = {
  oauthLogin: {
    url: `${api_host}/collaborator/oAuth-login`,
    method: "post",
  },
} as const;

const collaboratorAuthService =
  registerNextServer<keyof typeof methods>(methods);

export const useSignInGoogle = () => {
  const { error, success } = useHotToast();
  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationKey: ["collaborator-oauth-login"],
    mutationFn: async (params: {
      code: string;
      google_redirect_uri: string;
    }) => {
      const axiosResponse = await collaboratorAuthService.oauthLogin({
        code: params.code,
        callback_url: params.google_redirect_uri,
      });
      const res = axiosResponse.data || {};

      if (res.code === 0) {
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

// --- My deliveries (danh sách đơn được gán) ---

export type IGetCollaboratorMyDeliveriesRequest =
  | FetchCollaboratorMyDeliveriesParams
  | undefined;

export const useGetCollaboratorMyDeliveries = (
  params?: IGetCollaboratorMyDeliveriesRequest
) => {
  const { error } = useHotToast();
  const page = params?.page ?? 1;
  const page_size = params?.page_size ?? 10;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["collaborator-my-delivery", page, page_size],
    queryFn: async (): Promise<CollaboratorMyDeliveriesListData> => {
      try {
        return await fetchCollaboratorMyDeliveries({ page, page_size });
      } catch {
        error("Không tải được danh sách giao hàng.");
        return {
          items: [] as CollaboratorDeliveryRow[],
          pagination: null,
        };
      }
    },
  });

  return {
    data,
    deliveries: data?.items ?? [],
    pagination: data?.pagination ?? null,
    loading: isLoading || isFetching,
    refetch,
  };
};

export const useGetCollaboratorInfo = () => {
  const { error } = useHotToast();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["collaborator-colla-info"],
    queryFn: async (): Promise<CollaboratorCollaInfoData | null> => {
      try {
        return await fetchCollaboratorCollaInfo();
      } catch {
        error("Không tải được thông tin cộng tác viên.");
        return null;
      }
    },
  });

  return {
    data,
    user: data?.user ?? null,
    shipper_infor: data?.shipper_infor ?? null,
    loading: isLoading || isFetching,
    refetch,
  };
};

export type IPatchCollaboratorMyDeliveryRequest =
  PatchCollaboratorMyDeliveryParams;

export const usePatchCollaboratorMyDeliveryStatus = () => {
  const { error, success } = useHotToast();
  const queryClient = useQueryClient();

  const { data, isPending, mutateAsync } = useMutation({
    mutationKey: ["collaborator-patch-my-delivery"],
    mutationFn: async (payload: IPatchCollaboratorMyDeliveryRequest) => {
      const axiosResponse = await patchCollaboratorMyDeliveryStatus(payload);
      const res = axiosResponse.data || {};

      if (res.code === 0 || res.code === 200) {
        success("Đã cập nhật trạng thái giao hàng.");
        void queryClient.invalidateQueries({
          queryKey: ["collaborator-my-delivery"],
        });
      } else {
        error((typeof res.msg === "string" && res.msg.trim()) ||
            "Không cập nhật được trạng thái giao hàng.");
      }

      return res;
    },
  });

  return {
    data,
    loading: isPending,
    patchDeliveryStatus: mutateAsync,
  };
};

export type IUpsertCollaboratorShipperInfoRequest =
  UpsertCollaboratorShipperInfoParams;

export const useUpsertCollaboratorShipperInfo = () => {
  const { error, success } = useHotToast();
  const queryClient = useQueryClient();

  const { data, isPending, mutateAsync } = useMutation({
    mutationKey: ["collaborator-upt-shipper-info"],
    mutationFn: async (payload: IUpsertCollaboratorShipperInfoRequest) => {
      const axiosResponse = await upsertCollaboratorShipperInfo(payload);
      const res = axiosResponse.data || {};

      if (res.code === 0 || res.code === 200) {
        success("Đã cập nhật khu vực giao hàng.");
        void queryClient.invalidateQueries({
          queryKey: ["collaborator-colla-info"],
        });
      } else {
        error((typeof res.msg === "string" && res.msg.trim()) ||
            "Không cập nhật được thông tin shipper.");
      }

      return res;
    },
  });

  return {
    data,
    loading: isPending,
    upsertShipperInfo: mutateAsync,
  };
};
