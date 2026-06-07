import type { NextPage } from "next";
import Head from "next/head";
import ProductCatalogView from "@/view/product/index";
import { useRouter } from "next/router";

const ProductDetailPage: NextPage = () => {
  const router = useRouter();
  const rawId = router.query.id;
  const productId =
    router.isReady && typeof rawId === "string" ? rawId.trim() : "";

  if (!router.isReady) {
    return (
      <>
        <Head>
          <title>Sản phẩm | TMDT</title>
        </Head>
        <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
          <i className="fas fa-spinner fa-spin mr-2" aria-hidden />
          Đang tải…
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Chi tiết sản phẩm | TMDT</title>
        <meta name="description" content="Thông tin sản phẩm" />
      </Head>
      <ProductCatalogView productId={productId} />
    </>
  );
};

export default ProductDetailPage;
