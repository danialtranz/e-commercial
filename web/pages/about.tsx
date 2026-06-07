import type { NextPage } from "next";
import Head from "next/head";
import StaticPageView from "@/view/static/StaticPageView";

const AboutPage: NextPage = () => (
  <>
    <Head>
      <title>Về chúng tôi | MiniShop</title>
    </Head>
    <StaticPageView title="Về chúng tôi">
      <p>
        TMDT là nền tảng thương mại điện tử kết nối người mua với sản phẩm địa
        phương. Chúng tôi cam kết minh bạch về nguồn gốc và chất lượng.
      </p>
      <p className="mt-4">
        Mọi giao dịch thanh toán và xác thực người dùng tuân thủ các biện pháp
        bảo mật chuẩn ngành (HTTPS khi triển khai production, JWT có thời hạn,
        không lưu mật khẩu thô cho đăng nhập Google).
      </p>
    </StaticPageView>
  </>
);

export default AboutPage;
