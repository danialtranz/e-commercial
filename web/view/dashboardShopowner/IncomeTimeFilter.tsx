"use client";

import { DatePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import DayFilter from "./DayFilter";

dayjs.extend(customParseFormat);

/** Định dạng gửi API POST /shopowner/income */
export const INCOME_API_DATE_FORMAT = "DD-MM-YYYY";

export type IncomeFilterMode = "days" | "range";

export interface IncomeDateRangeValue {
  from: string;
  to: string;
}

interface IncomeTimeFilterProps {
  mode: IncomeFilterMode;
  onModeChange: (mode: IncomeFilterMode) => void;
  daysAgo: number;
  onChangeDays: (days: number) => void;
  dateRange: IncomeDateRangeValue | null;
  onDateRangeChange: (range: IncomeDateRangeValue | null) => void;
}

function defaultLastDaysRange(days: number): IncomeDateRangeValue {
  const to = dayjs().endOf("day");
  const from = dayjs().subtract(days - 1, "day").startOf("day");
  return {
    from: from.format(INCOME_API_DATE_FORMAT),
    to: to.format(INCOME_API_DATE_FORMAT),
  };
}

function toPickerValue(
  range: IncomeDateRangeValue | null
): [Dayjs, Dayjs] | null {
  if (!range?.from || !range?.to) return null;
  const from = dayjs(range.from, INCOME_API_DATE_FORMAT, true);
  const to = dayjs(range.to, INCOME_API_DATE_FORMAT, true);
  if (!from.isValid() || !to.isValid()) return null;
  return [from, to];
}

const IncomeTimeFilter: React.FC<IncomeTimeFilterProps> = ({
  mode,
  onModeChange,
  daysAgo,
  onChangeDays,
  dateRange,
  onDateRangeChange,
}) => {
  const pickerValue = toPickerValue(dateRange);

  return (
    <div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:items-end">
      <div className="inline-flex self-end rounded-2xl border border-slate-200 bg-white/90 p-1 shadow-sm">
        <button
          type="button"
          onClick={() => onModeChange("days")}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            mode === "days"
              ? "bg-cyan-500/15 text-cyan-800"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Nhanh
        </button>
        <button
          type="button"
          onClick={() => {
            onModeChange("range");
            if (!dateRange) {
              onDateRangeChange(defaultLastDaysRange(daysAgo));
            }
          }}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            mode === "range"
              ? "bg-cyan-500/15 text-cyan-800"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Chọn ngày
        </button>
      </div>

      {mode === "days" ? (
        <DayFilter value={daysAgo} onChange={onChangeDays} />
      ) : (
        <div className="flex flex-col items-end gap-1">
          <DatePicker.RangePicker
            value={pickerValue}
            format="DD/MM/YYYY"
            allowClear
            className="rounded-xl! border-cyan-500/30!"
            placeholder={["Từ ngày", "Đến ngày"]}
            onChange={(dates) => {
              if (!dates?.[0] || !dates[1]) {
                onDateRangeChange(null);
                return;
              }
              onDateRangeChange({
                from: dates[0].startOf("day").format(INCOME_API_DATE_FORMAT),
                to: dates[1].endOf("day").format(INCOME_API_DATE_FORMAT),
              });
            }}
          />
        </div>
      )}
    </div>
  );
};

export default IncomeTimeFilter;
