import type { NextPage } from "next";
import Head from "next/head";
import AccountView from "@/view/account/AccountView";

const AccountPage: NextPage = () => (
  <>
    <Head>
      <title>Tài khoản | TMDT</title>
    </Head>
    <AccountView />
  </>
);

export default AccountPage;
