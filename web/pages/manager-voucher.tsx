import type { NextPage } from "next";
import Head from "next/head";

import { ManagerVoucherView } from "@/view/managerVoucherView";

const ManagerVoucherPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Quản lý voucher | Shop</title>
      </Head>
      <ManagerVoucherView />
    </>
  );
};

export default ManagerVoucherPage;
