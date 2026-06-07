import type { NextPage } from "next";
import Head from "next/head";
import DashboardShopownerView from "@/view/dashboardShopowner";

const DashboardShopownerPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Shop Owner Dashboard | TMDT</title>
        <meta
          name="description"
          content="Dashboard doanh thu cho chu shop theo khoang ngay"
        />
      </Head>
      <DashboardShopownerView />
    </>
  );
};

export default DashboardShopownerPage;
