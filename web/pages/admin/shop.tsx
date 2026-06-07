import type { NextPage } from "next";
import Head from "next/head";
import AdminShopView from "@/view/admin/shop/AdminShopView";

const AdminShopPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Quản lý cửa hàng | Admin</title>
      </Head>
      <AdminShopView />
    </>
  );
};

export default AdminShopPage;
