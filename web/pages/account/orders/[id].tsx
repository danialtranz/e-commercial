import type { NextPage } from "next";
import Head from "next/head";
import OrderDetailView from "@/view/account/OrderDetailView";

const OrderDetailPage: NextPage = () => (
  <>
    <Head>
      <title>Chi tiết đơn hàng | TMDT</title>
    </Head>
    <OrderDetailView />
  </>
);

export default OrderDetailPage;
