import { useHotToast } from "@/components/ui/hot-toast";
import translationService from "@/services/translationService";
import { useMutation } from "@tanstack/react-query";

export interface IUnderstandTextRequestBody {
  question: string;
  target: string;
}

export const useTranslationHook = () => {
  const { error } = useHotToast();
  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationKey: ["translation-understand-text"],
    mutationFn: async (body: IUnderstandTextRequestBody) => {
      const axiosResponse = await translationService.understandText(body);
      const res = axiosResponse.data || {};

      if (res.code === 0) {
      } else {
        error("Không dịch được nội dung.");
      }

      return res;
    },
  });
  // expose field đúng nghĩa; vẫn giữ alias login để tránh phá code đang dùng cũ (nếu có)
  return { data, loading, understandText: mutateAsync, login: mutateAsync };
};
