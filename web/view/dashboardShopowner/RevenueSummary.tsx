"use client";

import type { ShopOwnerIncomeData } from "@/services/shopowner/dashboardService";

function formatMoney(v?: number) {
  if (typeof v !== "number") return "0 ₫";
  return `${v.toLocaleString("vi-VN")} ₫`;
}

function formatDate(v?: string) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface StatRowProps {
  label: string;
  value: string;
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
      <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="text-right text-sm font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}

interface RevenueSummaryProps {
  data: ShopOwnerIncomeData | null | undefined;
}

const RevenueSummary: React.FC<RevenueSummaryProps> = ({ data }) => {
  const totalRevenue = data?.total_revenue ?? data?.total_income ?? 0;
  const fromTime = data?.from_time;
  const toTime = data?.to_time;
  const products = data?.product_sales ?? [];

  return (
    <div className="relative flex h-full min-h-[400px] flex-col overflow-hidden rounded-3xl border border-amber-200/70 bg-linear-to-br from-amber-50/90 via-white to-cyan-50/40 p-6 shadow-lg shadow-slate-200/60">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-cyan-200/30 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-amber-300/60 to-transparent" />

      <div className="relative z-10 flex flex-1 flex-col">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-amber-800/80">
          Tổng quan
        </p>

        <p className="mt-4 bg-linear-to-r from-amber-700 via-amber-600 to-slate-800 bg-clip-text text-4xl font-bold leading-none tracking-tight text-transparent">
          {formatMoney(totalRevenue)}
        </p>
        <p className="mt-2 text-sm text-slate-500">Tổng doanh thu</p>

        <div className="mt-8 flex flex-1 flex-col gap-2.5">
          {data?.from && data?.to && (
            <StatRow label="Khoảng chọn" value={`${data.from} → ${data.to}`} />
          )}
          <StatRow
            label="Thời gian"
            value={`${formatDate(fromTime)} → ${formatDate(toTime)}`}
          />
          <StatRow
            label="Sản phẩm"
            value={`${products.length} mặt hàng`}
          />
          {typeof data?.days_ago === "number" && data.days_ago > 0 && (
            <StatRow label="Gần đây" value={`${data.days_ago} ngày`} />
          )}
        </div>

        <p className="relative z-10 mt-6 border-t border-slate-200/80 pt-4 text-[11px] leading-relaxed text-slate-500">
          Số liệu tổng hợp từ đơn đã ghi nhận trong khoảng thời gian lọc.
        </p>
      </div>
    </div>
  );
};

export default RevenueSummary;
