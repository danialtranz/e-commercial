import type { ReactNode } from "react";
import Link from "next/link";
import {
  Facebook,
  Instagram,
  Youtube,
  MapPin,
  Phone,
  Mail,
  Clock,
  type LucideIcon,
} from "lucide-react";

const CUSTOMER_SUPPORT_LINKS = [
  { href: "/policy", label: "Chính sách mua hàng" },
  { href: "/policy", label: "Chính sách đổi trả" },
  { href: "/policy", label: "Chính sách vận chuyển" },
  { href: "/policy", label: "Hướng dẫn thanh toán" },
  { href: "/policy", label: "Điều khoản dịch vụ" },
] as const;

const CATEGORY_LINKS = [
  { href: "/product", label: "Rau củ hữu cơ" },
  { href: "/product", label: "Trái cây sạch" },
  { href: "/product", label: "Thực phẩm organic" },
  { href: "/product", label: "Đồ khô" },
] as const;

const BOTTOM_NAV = [
  { href: "/product", label: "Trang chủ" },
  { href: "/product", label: "Sản phẩm" },
  { href: "/about", label: "Giới thiệu" },
] as const;

const PAYMENT_METHODS = ["Momo", "COD"] as const;

/** Footer theo mẫu Organicmart — dùng chung mọi trang. */
export default function ContactComp() {
  return (
    <footer className="mt-20 border-t-2 border-organic" role="contentinfo">
      <div className="bg-login-bg pt-16 pb-12">
        <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Info */}
          <div className="space-y-6">
            <Link href="/" className="flex flex-col">
              <span className="text-organic text-3xl font-bold italic tracking-tighter">
                Hoa quả tươi
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                Natural Foods
              </span>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed">
              Tự hào là nhà cung cấp thực phẩm sạch hàng đầu, mang tinh hoa hữu
              cơ từ nông trại đến tận bàn ăn của gia đình bạn.
            </p>
            <div className="space-y-3">
              <ContactRow Icon={MapPin}>PTIT</ContactRow>
              <ContactRow Icon={Phone}>
                <a
                  href="tel:0123456789"
                  className="hover:text-organic transition-colors"
                >
                  0123 456 789
                </a>
              </ContactRow>
              <ContactRow Icon={Mail}>
                <a
                  href="mailto:support@banmichu.local"
                  className="hover:text-organic transition-colors break-all"
                >
                  support@banmichu.local
                </a>
              </ContactRow>
              <ContactRow Icon={Clock}>Thứ 2 - CN: 07:00 - 21:00</ContactRow>
            </div>
          </div>

          {/* Customer Support */}
          <FooterColumn title="Hỗ trợ khách hàng">
            {CUSTOMER_SUPPORT_LINKS.map((link) => (
              <FooterLink key={link.label} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </FooterColumn>

          {/* Categories */}
          <FooterColumn title="Danh mục sản phẩm">
            {CATEGORY_LINKS.map((link) => (
              <FooterLink key={link.label} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </FooterColumn>

          {/* Connect & Payment */}
          <div>
            <FooterColumnTitle>Kết nối với chúng tôi</FooterColumnTitle>
            <div className="flex gap-3 mb-8">
              <SocialIcon Icon={Facebook} label="Facebook" />
              <SocialIcon Icon={Instagram} label="Instagram" />
              <SocialIcon Icon={Youtube} label="Youtube" />
              <SocialIcon Icon={Phone} label="Điện thoại" />
            </div>

            <h4 className="text-organic font-bold uppercase text-xs mb-4 tracking-widest">
              Phương thức thanh toán
            </h4>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((name) => (
                <PaymentIcon key={name} name={name} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-organic-dark text-white py-4 text-[11px]">
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="opacity-80">
            © {new Date().getFullYear()} Hoa quả tươi. All rights reserved.
            Designed for Quality.
          </p>
          <nav className="flex gap-6 uppercase font-bold tracking-widest">
            {BOTTOM_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-gray-300 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

function FooterColumnTitle({ children }: { children: ReactNode }) {
  return (
    <h4 className="text-organic font-bold uppercase text-sm mb-8 tracking-widest relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-organic">
      {children}
    </h4>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <FooterColumnTitle>{title}</FooterColumnTitle>
      <ul className="space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-gray-500 hover:text-organic hover:translate-x-1 transition-all flex items-center"
      >
        <ChevronSmallRight />
        {children}
      </Link>
    </li>
  );
}

function ContactRow({
  Icon,
  children,
}: {
  Icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 text-sm text-gray-600">
      <Icon size={18} className="text-organic shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

function ChevronSmallRight() {
  return (
    <svg
      className="w-3 h-3 mr-1 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

function SocialIcon({ Icon, label }: { Icon: LucideIcon; label: string }) {
  return (
    <a
      href="#"
      aria-label={label}
      className="w-9 h-9 bg-white shadow-sm border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-organic hover:text-white hover:-translate-y-1 transition-all"
    >
      <Icon size={18} />
    </a>
  );
}

function PaymentIcon({ name }: { name: string }) {
  return (
    <div className="px-3 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
      {name}
    </div>
  );
}
