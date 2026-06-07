import type { NextPage } from "next";
import Head from "next/head";
import { ManagerAdvCampView } from "@/view/managerAdvCamp/index";

/** Alias route — cùng nội dung với `/advertising`. */
const ManagerAdvertisingCampPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Quản lý quảng cáo | Shop</title>
      </Head>
      <ManagerAdvCampView />
    </>
  );
};

export default ManagerAdvertisingCampPage;
