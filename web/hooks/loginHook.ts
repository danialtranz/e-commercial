import { useMutation } from "@tanstack/react-query";
import { useHotToast } from "@/components/ui/hot-toast";
import {
  applyAuthFromOAuthBody,
  exchangeGoogleOAuthCode,
  type GoogleOAuthLoginResult,
} from "@/lib/googleOAuthLogin";

export type { GoogleOAuthLoginResult };

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
    }): Promise<GoogleOAuthLoginResult> => {
      const result = await exchangeGoogleOAuthCode(
        "user",
        params.code,
        params.google_redirect_uri
      );

      if (result.code === 0 && applyAuthFromOAuthBody(result.body)) {
        success("Đăng nhập thành công");
      } else {
        error("Đăng nhập thất bại");
      }

      return result;
    },
  });
  return { data, loading, login: mutateAsync };
};
