"use client";

import type { ShopOwnerIncomeData } from "@/services/shopowner/dashboardService";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RevenueChartProps {
  data: ShopOwnerIncomeData | null | undefined;
}

interface ChartItem {
  label: string;
  revenue: number;
  quantity: number;
}

const BAR_GRADIENTS = [
  { id: "barG0", from: "#fcd34d", to: "#f59e0b" },
  { id: "barG1", from: "#67e8f9", to: "#0891b2" },
  { id: "barG2", from: "#c4b5fd", to: "#7c3aed" },
  { id: "barG3", from: "#6ee7b7", to: "#059669" },
  { id: "barG4", from: "#f9a8d4", to: "#db2777" },
  { id: "barG5", from: "#93c5fd", to: "#2563eb" },
];

function truncateLabel(value: string, max = 16) {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

function formatCompactVnd(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return value.toLocaleString("vi-VN");
}

function formatFullVnd(value: number) {
  return `${value.toLocaleString("vi-VN")} ₫`;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartItem }>;
}) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="min-w-[180px] rounded-2xl border border-slate-200/90 bg-white/95 px-4 py-3 shadow-xl shadow-slate-300/50 backdrop-blur-md">
      <p className="text-sm font-semibold leading-snug text-slate-900">
        {row.label}
      </p>
      <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5 text-xs">
        <p className="flex justify-between gap-4 text-slate-500">
          <span>Số lượng</span>
          <span className="font-medium tabular-nums text-slate-800">
            {row.quantity}
          </span>
        </p>
        <p className="flex justify-between gap-4 text-slate-500">
          <span>Doanh thu</span>
          <span className="font-semibold tabular-nums text-amber-700">
            {formatFullVnd(row.revenue)}
          </span>
        </p>
      </div>
    </div>
  );
};

function formatBarLabel(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "0 ₫";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₫`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K ₫`;
  return `${n.toLocaleString("vi-VN")} ₫`;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const chartData: ChartItem[] = (data?.product_sales ?? [])
    .map((item) => ({
      label: item?.product?.name || item?.productId || "Chưa rõ",
      revenue: Number(item?.total_revenue ?? 0),
      quantity: Number(item?.total_quantity ?? 0),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = chartData.reduce((sum, row) => sum + row.revenue, 0);
  const withRevenue = chartData.filter((r) => r.revenue > 0);
  const zeroRevenue = chartData.filter((r) => r.revenue === 0);

  if (!chartData.length) {
    return (
      <div className="relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-slate-200/90 bg-white px-6 py-12 shadow-lg shadow-slate-200/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,0.08),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(251,191,36,0.06),transparent_50%)]" />
        <div className="relative z-10 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-700/80">
            Biểu đồ doanh thu
          </p>
          <p className="mt-4 text-lg font-medium text-slate-700">
            Chưa có dữ liệu trong khoảng thời gian này
          </p>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Thử chọn khoảng ngày khác hoặc chờ phát sinh đơn hàng.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[400px] overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-lg shadow-slate-200/60 md:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,0.06),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(251,191,36,0.05),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-300/50 to-transparent" />

      <div className="relative z-10 mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-800/70">
            Doanh thu theo sản phẩm
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900 md:text-xl">
            {withRevenue.length > 0
              ? `${withRevenue.length} sản phẩm có doanh thu`
              : "Chưa có doanh thu theo sản phẩm"}
          </h3>
          {zeroRevenue.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              {zeroRevenue.length} sản phẩm có dòng đơn nhưng doanh thu = 0 ₫ (
              {zeroRevenue.map((r) => r.label).join(", ")})
            </p>
          )}
        </div>
        <p className="text-sm text-slate-500">
          Tổng cột:{" "}
          <span className="font-semibold tabular-nums text-amber-700">
            {formatFullVnd(totalRevenue)}
          </span>
        </p>
      </div>

      <div className="relative z-10 h-[320px] min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 4, bottom: 48 }}
            barCategoryGap="28%"
          >
            <defs>
              {BAR_GRADIENTS.map((g) => (
                <linearGradient
                  key={g.id}
                  id={g.id}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={g.from} stopOpacity={1} />
                  <stop offset="100%" stopColor={g.to} stopOpacity={0.9} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="4 6"
              stroke="#e2e8f0"
            />
            <XAxis
              dataKey="label"
              interval={0}
              angle={-28}
              textAnchor="end"
              height={56}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
              tickFormatter={(v) => truncateLabel(String(v))}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCompactVnd(Number(v))}
              width={48}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(15, 23, 42, 0.04)", radius: 8 }}
            />
            <Bar
              dataKey="revenue"
              radius={[10, 10, 4, 4]}
              maxBarSize={52}
              minPointSize={4}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((row, idx) => (
                <Cell
                  key={`cell-${row.label}-${idx}`}
                  fill={`url(#${BAR_GRADIENTS[idx % BAR_GRADIENTS.length].id})`}
                  fillOpacity={row.revenue > 0 ? 1 : 0.35}
                />
              ))}
              <LabelList
                dataKey="revenue"
                position="top"
                formatter={formatBarLabel}
                className="fill-slate-600 text-[10px] font-medium"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
