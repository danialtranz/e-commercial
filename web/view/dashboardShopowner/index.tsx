"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useGetIncome } from "@/hooks/shopowner/useShopOwnerHook";
import DashboardHeader, { type DashboardTab } from "./DashboardHeader";
import type {
  IncomeDateRangeValue,
  IncomeFilterMode,
} from "./IncomeTimeFilter";
import RevenueChart from "./RevenueChart";
import RevenueSummary from "./RevenueSummary";
import UserStatsTable from "./UserStatsTable";

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
      <div className="lg:col-span-7">
        <div className="min-h-[400px] animate-pulse rounded-3xl bg-slate-100" />
      </div>
      <div className="lg:col-span-3">
        <div className="min-h-[400px] animate-pulse rounded-3xl bg-amber-50/80" />
      </div>
    </div>
  );
}

const DashboardShopownerView: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>("revenue");
  const [incomeMode, setIncomeMode] = useState<IncomeFilterMode>("days");
  const [daysAgo, setDaysAgo] = useState(7);
  const [dateRange, setDateRange] = useState<IncomeDateRangeValue | null>(null);

  const queryShopId = useMemo(() => {
    if (typeof router.query.shopId !== "string") return "";
    return router.query.shopId;
  }, [router.query.shopId]);

  const storedShopId = useMemo(() => {
    if (typeof window === "undefined") return "";
    return (
      localStorage.getItem("shopId") ||
      localStorage.getItem("shop_id") ||
      localStorage.getItem("currentShopId") ||
      ""
    );
  }, []);

  const shopId = queryShopId || storedShopId;

  const incomeRequest = useMemo(() => {
    if (activeTab !== "revenue" || !shopId) return undefined;
    if (incomeMode === "range") {
      if (!dateRange?.from || !dateRange?.to) return undefined;
      return { shopId, dateRange };
    }
    return { shopId, daysAgo };
  }, [activeTab, shopId, incomeMode, daysAgo, dateRange]);

  const { income, loading } = useGetIncome(incomeRequest);

  const incomeFilterReady =
    incomeMode === "days" || (dateRange?.from && dateRange?.to);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <DashboardHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          incomeMode={incomeMode}
          onIncomeModeChange={setIncomeMode}
          daysAgo={daysAgo}
          onChangeDays={setDaysAgo}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {activeTab === "revenue" && (
          <>
            {!shopId && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                Thiếu `shopId`. Thêm `shopId` vào URL hoặc lưu trong
                localStorage.
              </div>
            )}

            {shopId && incomeMode === "range" && !incomeFilterReady && (
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600">
                Chọn khoảng từ ngày — đến ngày để xem doanh thu.
              </div>
            )}

            {shopId && incomeFilterReady && loading && <DashboardSkeleton />}

            {shopId && incomeFilterReady && !loading && (
              <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-10">
                <div className="lg:col-span-7">
                  <RevenueChart data={income} />
                </div>
                <div className="lg:col-span-3">
                  <RevenueSummary data={income} />
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "users" && <UserStatsTable />}
      </div>
    </div>
  );
};

export default DashboardShopownerView;
