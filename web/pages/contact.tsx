import type { NextPage } from "next";
import Head from "next/head";
import StaticPageView from "@/view/static/StaticPageView";

const ContactPage: NextPage = () => (
  <>
    <Head>
      <title>Liên hệ | TMDT</title>
    </Head>
    <StaticPageView title="Liên hệ">
      <p>
        Hỗ trợ khách hàng: vui lòng gửi email qua kênh chính thức của cửa hàng
        (cập nhật địa chỉ email trong cấu hình doanh nghiệp).
      </p>
      <p className="mt-4 text-slate-500">
        Form liên hệ có thể được thêm sau khi tích hợp backend gửi email / ticket.
      </p>
    </StaticPageView>
  </>
);

export default ContactPage;
