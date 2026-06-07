import type { NextPage } from "next";
import Head from "next/head";
import OrdersView from "@/view/account/OrdersView";

const OrdersPage: NextPage = () => (
  <>
    <Head>
      <title>Đơn hàng | TMDT</title>
    </Head>
    <OrdersView />
  </>
);

export default OrdersPage;
