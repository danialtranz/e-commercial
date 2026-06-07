import type { NextPage } from "next";
import Head from "next/head";
import OrdersView from "@/view/account/OrdersView";

const MyOrderPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Đơn hàng | TMDT</title>
        <meta name="description" content="Danh sách đơn hàng" />
      </Head>
      <OrdersView />
    </>
  );
};

export default MyOrderPage;
