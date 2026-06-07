import type { NextPage } from "next";
import Head from "next/head";
import ProductCatalogView from "@/view/product/index";

const ProductCatalogPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Sản phẩm | TMDT</title>
        <meta
          name="description"
          content="Danh sách sản phẩm thương mại điện tử"
        />
      </Head>
      <ProductCatalogView />
    </>
  );
};

export default ProductCatalogPage;
