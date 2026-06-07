"use client";

import IncomeTimeFilter, {
  type IncomeDateRangeValue,
  type IncomeFilterMode,
} from "./IncomeTimeFilter";

export type DashboardTab = "revenue" | "users";

interface DashboardHeaderProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  incomeMode: IncomeFilterMode;
  onIncomeModeChange: (mode: IncomeFilterMode) => void;
  daysAgo: number;
  onChangeDays: (days: number) => void;
  dateRange: IncomeDateRangeValue | null;
  onDateRangeChange: (range: IncomeDateRangeValue | null) => void;
}

const TABS: { id: DashboardTab; label: string }[] = [
  { id: "revenue", label: "Thống kê doanh thu" },
  { id: "users", label: "Thống kê user" },
];

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeTab,
  onTabChange,
  incomeMode,
  onIncomeModeChange,
  daysAgo,
  onChangeDays,
  dateRange,
  onDateRangeChange,
}) => {
  return (
    <div className="mb-8 space-y-5">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Shop Owner
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Quản lý doanh thu và người dùng cửa hàng
          </p>
        </div>
        {activeTab === "revenue" && (
          <IncomeTimeFilter
            mode={incomeMode}
            onModeChange={onIncomeModeChange}
            daysAgo={daysAgo}
            onChangeDays={onChangeDays}
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
          />
        )}
      </div>

      <div className="inline-flex rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm shadow-slate-200/50">
        {TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardHeader;
