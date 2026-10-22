import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { CHART_COLORS } from "../../constants/finance";
import { fmtShort } from "../../utils/format";
import { inputClass } from "../ui";

const TONES = {
  indigo: "bg-indigo-50 text-indigo-500",
  green: "bg-emerald-50 text-emerald-500",
  red: "bg-red-50 text-red-500",
  amber: "bg-amber-50 text-amber-500",
  cyan: "bg-cyan-50 text-cyan-500",
};

// delta: percentage change. goodWhenDown flips the colours (failed payments, overdue...).
export function Delta({ value, goodWhenDown = false, suffix = "vs last month" }) {
  if (value == null) return null;
  const up = value >= 0;
  const good = goodWhenDown ? !up : up;
  return (
    <span
      className={`mt-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium ${
        good ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
      }`}
    >
      {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      {up ? "+" : ""}
      {value}% {suffix}
    </span>
  );
}

export function KpiCard({ label, value, icon, tone = "indigo", delta, goodWhenDown, suffix, hint }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 text-left">
      <div className={`h-16 w-16 rounded-xl flex items-center justify-center ${TONES[tone]}`}>{icon}</div>
      <p className="mt-5 text-slate-500">{label}</p>
      <p className="mt-1 text-4xl font-bold text-slate-900 break-words">{value}</p>
      {delta !== undefined && <Delta value={delta} goodWhenDown={goodWhenDown} suffix={suffix} />}
      {hint && <p className="mt-2 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

// Donut + legend list. rows: [{ name, value }]
export function DonutList({ rows, format = fmtShort, empty = "No data yet." }) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (!rows.length || !total) return <p className="py-10 text-center text-slate-500">{empty}</p>;
  return (
    <div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="95%" paddingAngle={2} stroke="none">
              {rows.map((r, i) => <Cell key={r.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => format(v)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-4 space-y-2.5">
        {rows.map((r, i) => (
          <li key={r.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2.5 text-slate-700 min-w-0">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="truncate">{r.name}</span>
            </span>
            <span className="font-semibold text-slate-900 shrink-0">{format(r.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function YearSelect({ years, value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value))} className={`${inputClass} !w-auto !py-2.5`}>
      {years.map((y) => <option key={y} value={y}>{y}</option>)}
    </select>
  );
}

// The dashed Panelix-style card for a "nothing here yet" table.
export const SelectBox = ({ value, onChange, children, className = "" }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} ${className}`}>
    {children}
  </select>
);
