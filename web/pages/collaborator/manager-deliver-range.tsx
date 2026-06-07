import type { NextPage } from "next";
import Head from "next/head";
import ManagerDeliverRangeView from "@/view/managerDeliverRange/index";

const ManagerDeliverRangePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Quản lý khu vực giao hàng | Cộng tác viên</title>
      </Head>
      <ManagerDeliverRangeView />
    </>
  );
};

export default ManagerDeliverRangePage;
