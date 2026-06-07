import type { NextPage } from "next";
import Head from "next/head";
import { ManagerFlashCampView } from "@/view/managerFlCamp/index";
const ManagerFlashCampPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Quản lý chiến dịch flash sale | Shop</title>
      </Head>
      <ManagerFlashCampView />
    </>
  );
};

export default ManagerFlashCampPage;
