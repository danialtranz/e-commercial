import type { NextPage } from "next";
import Head from "next/head";

import { ExchangeVoucherView } from "@/view/exchangeVoucherView";

const ExchangeVoucherPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Săn voucher | Shop</title>
      </Head>
      <ExchangeVoucherView />
    </>
  );
};

export default ExchangeVoucherPage;
