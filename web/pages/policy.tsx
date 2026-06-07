import type { NextPage } from "next";
import Head from "next/head";
import StaticPageView from "@/view/static/StaticPageView";

const PolicyPage: NextPage = () => (
  <>
    <Head>
      <title>Chính sách & bảo mật | TMDT</title>
    </Head>
    <StaticPageView title="Chính sách & bảo mật">
      <h2 className="text-lg font-semibold text-slate-900">Dữ liệu cá nhân</h2>
      <p className="mt-2">
        Chúng tôi chỉ thu thập thông tin cần thiết để vận hành đơn hàng và xác
        thực tài khoản (email, tên hiển thị từ nhà cung cấp OAuth). Không bán
        dữ liệu cho bên thứ ba.
      </p>
      <h2 className="mt-8 text-lg font-semibold text-slate-900">Cookie & phiên đăng nhập</h2>
      <p className="mt-2">
        Phiên đăng nhập sử dụng JWT. Trên production nên bật HTTPS, SameSite phù
        hợp và xem xét lưu token trong cookie httpOnly do server cấp để giảm
        rủi ro XSS.
      </p>
      <h2 className="mt-8 text-lg font-semibold text-slate-900">Đặt hàng</h2>
      <p className="mt-2">
        Giá và tồn kho được xác nhận trên máy chủ tại thời điểm đặt hàng; client
        không thể sửa giá bằng cách chỉnh payload.
      </p>
    </StaticPageView>
  </>
);

export default PolicyPage;
