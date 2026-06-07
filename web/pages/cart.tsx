import type { NextPage } from "next";
import Head from "next/head";
import CartView from "@/view/cart/CartView";

const CartPage: NextPage = () => (
  <>
    <Head>
      <title>Giỏ hàng | MiniShop</title>
    </Head>
    <CartView />
  </>
);

export default CartPage;
