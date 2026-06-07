import type { NextPage } from "next";
import Head from "next/head";
import { ManagerAdvCampView } from "@/view/managerAdvCamp/index";

const AdvertisingPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Quản lý quảng cáo | Shop</title>
        <meta
          name="description"
          content="Tải lên và quản lý chiến dịch quảng cáo (ảnh / video)"
        />
      </Head>
      <ManagerAdvCampView />
    </>
  );
};

export default AdvertisingPage;
