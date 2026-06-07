import type { NextPage } from "next";
import Head from "next/head";
import CheckoutView from "@/view/checkout/CheckoutView";

const CheckoutPage: NextPage = () => (
  <>
    <Head>
      <title>Thanh toán | TMDT</title>
    </Head>
    <CheckoutView />
  </>
);

export default CheckoutPage;
