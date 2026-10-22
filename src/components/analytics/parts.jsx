import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Card, PrimaryButton, inputClass } from "../ui";

// Start / end date + Apply (same as the Panelix filter bar). Presets are optional.
export function DateFilter({ from, to, onApply, presets = true }) {
  const [a, setA] = useState(from);
  const [b, setB] = useState(to);
  const ymd = (d) => {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  };
  const preset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    setA(ymd(start)); setB(ymd(end));
    onApply(ymd(start), ymd(end));
  };
  const invalid = !a || !b || b < a;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col lg:flex-row lg:items-end gap-4">
      <label className="block">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-1.5"><CalendarDays size={15} /> Start Date</span>
        <input type="date" value={a} onChange={(e) => setA(e.target.value)} className={inputClass} />
      </label>
      <label className="block">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-1.5"><CalendarDays size={15} /> End Date</span>
        <input type="date" value={b} onChange={(e) => setB(e.target.value)} className={inputClass} />
      </label>
      <PrimaryButton disabled={invalid} onClick={() => onApply(a, b)}>Apply Filter</PrimaryButton>
      {presets && (
        <div className="flex gap-2 lg:ml-auto">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => preset(d)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">{d}d</button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-white">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${value === o.value ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-50"}`}>{o.label}</button>
      ))}
    </div>
  );
}

// Score out of 100 drawn as a ring
export function Ring({ value, label, color = "#7c3aed" }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center text-center">
      <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label={`${label} ${v}%`}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#eef2f7" strokeWidth="12" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} transform="rotate(-90 70 70)" />
        <text x="70" y="68" textAnchor="middle" className="fill-slate-900" style={{ fontSize: 30, fontWeight: 700 }}>{v}</text>
        <text x="70" y="90" textAnchor="middle" className="fill-slate-400" style={{ fontSize: 13 }}>/ 100</text>
      </svg>
      <p className="mt-2 font-semibold text-slate-800">{label}</p>
    </div>
  );
}

// Horizontal bars: rows [{ name, value, hint }]
export function BarList({ rows, color = "#7c3aed", format = (v) => v, empty = "No data in this period." }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="py-8 text-center text-slate-500">{empty}</p>;
  return (
    <ul className="space-y-4">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="flex justify-between gap-3 text-sm mb-1.5">
            <span className="font-medium text-slate-700">{r.name}</span>
            <span className="text-slate-500">{format(r.value)}{r.hint ? <span className="ml-2 text-slate-400">{r.hint}</span> : null}</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: color }} /></div>
        </li>
      ))}
    </ul>
  );
}

export function ErrorNote({ message }) {
  return <Card><p className="py-8 text-center text-slate-600">{message}</p></Card>;
}

export const Pill = ({ tone = "slate", children }) => {
  const tones = { green: "bg-emerald-100 text-emerald-700", amber: "bg-amber-100 text-amber-700", red: "bg-red-100 text-red-700", slate: "bg-slate-100 text-slate-600", violet: "bg-violet-100 text-violet-700" };
  return <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
};
