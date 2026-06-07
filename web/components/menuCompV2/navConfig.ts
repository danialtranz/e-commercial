import type { AppHeaderRole } from "@/utils/roleUtils";

export type NavLinkItem = {
  href: string;
  icon: string;
  label: string;
};

/** Menu header theo role — toàn bộ nhãn tiếng Việt. */
export function getNavLinksForRole(headerRole: AppHeaderRole): NavLinkItem[] {
  switch (headerRole) {
    case "shopowner":
      return [
        {
          href: "/manager-advertising-camp",
          icon: "fa-bullhorn",
          label: "Quảng cáo",
        },
        {
          href: "/dashboard-shopowner",
          icon: "fa-chart-line",
          label: "Thống kê",
        },
        { href: "/admin/shop", icon: "fa-box", label: "Sản phẩm" },
        {
          href: "/manager-flash-camp",
          icon: "fa-ticket-alt", // them 1 icon moi dung voi thu vien fontawesome: fa-flash
          label: "Quản lý chiến dịch flash sale",
        },
        {
          href: "/manager-voucher",
          icon: "fa-ticket-alt",
          label: "Quản lý voucher",
        },
      ];
    case "collaborator":
      return [
        {
          href: "/my-assignment",
          icon: "fa-truck",
          label: "Giao hàng của tôi",
        },
        {
          href: "/collaborator/manager-deliver-range",
          icon: "fa-map-marker-alt",
          label: "Quản lý khu vực giao hàng",
        },
      ];
    case "user":
      return [
        { href: "/product", icon: "fa-store", label: "Sản phẩm" },
        { href: "/my-order", icon: "fa-receipt", label: "Đơn hàng của tôi" },
        {
          href: "/exchange-voucher",
          icon: "fa-ticket-alt",
          label: "Săn voucher",
        },
      ];
    case "guest":
    default:
      return [
        { href: "/product", icon: "fa-store", label: "Sản phẩm" },
        { href: "/about", icon: "fa-info-circle", label: "Giới thiệu" },
      ];
  }
}
