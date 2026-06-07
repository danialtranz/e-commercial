"use client";

interface DayFilterProps {
  value: number;
  onChange: (next: number) => void;
}

const OPTIONS = [4, 7, 14];

const DayFilter: React.FC<DayFilterProps> = ({ value, onChange }) => {
  return (
    <div className="inline-flex rounded-2xl border border-cyan-500/25 bg-white/90 p-1 shadow-sm">
      {OPTIONS.map((day) => {
        const active = day === value;
        return (
          <button
            key={day}
            type="button"
            onClick={() => onChange(day)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
              active
                ? "bg-cyan-500/15 text-cyan-800 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {day} days
          </button>
        );
      })}
    </div>
  );
};

export default DayFilter;
