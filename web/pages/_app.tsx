import "@/styles/globals.css";

import "@fortawesome/fontawesome-free/css/all.min.css";
import type { AppProps } from "next/app";

import { ConfigProvider } from "antd";
import theme from "../theme/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { RadixToaster } from "@/components/ui/radix-toast";
import { HotToaster } from "@/components/ui/hot-toast";
import { Toaster as SonnerToaster } from "sonner";
import MenuCompV2 from "@/components/menuCompV2";
import { ShopActiveAdvertisementHost } from "@/components/managerAdCamp";
import ContactComp from "@/components/ContactComp";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={theme}>
        <MenuCompV2>
          <div className="flex min-h-screen flex-col">
            <ShopActiveAdvertisementHost />
            <main className="flex w-full flex-1 flex-col">
              <Component {...pageProps} />
            </main>
            <ContactComp />
          </div>
        </MenuCompV2>

        <RadixToaster />
        <HotToaster />
        <SonnerToaster position="top-center" richColors closeButton />
      </ConfigProvider>
    </QueryClientProvider>
  );
}
