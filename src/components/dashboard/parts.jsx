import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

// Tiny trend line with no axes, used inside cards
export function Spark({ data = [], color = "#7c3aed", height = 46, dataKey = "v" }) {
  if (!data.length) return <div style={{ height }} />;
  const id = `sp-${color.replace("#", "")}`;
  return (
    <div style={{ height }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DeltaPill({ value, goodWhenDown = false }) {
  if (value == null) return null;
  const up = value >= 0;
  const good = goodWhenDown ? !up : up;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${good ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
      <Icon size={12} /> {up ? "+" : ""}{value}%
    </span>
  );
}

// Card with a coloured left edge, big number and a trend line under it
export function EdgeCard({ color, icon, label, value, delta, goodWhenDown, spark, hint }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 border-l-4 shadow-sm p-5 text-left flex flex-col" style={{ borderLeftColor: color }}>
      <div className="flex items-start gap-4">
        <span className="h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center" style={{ background: `${color}18`, color }}>{icon}</span>
        <div className="min-w-0">
          <p className="text-slate-500">{label}</p>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            <DeltaPill value={delta} goodWhenDown={goodWhenDown} />
          </div>
          {hint && <p className="text-sm text-slate-400 mt-0.5">{hint}</p>}
        </div>
      </div>
      <div className="mt-3 -mx-1">{spark && <Spark data={spark} color={color} />}</div>
    </div>
  );
}

// Small progress ring with the value in the middle
export function MiniRing({ value, color = "#7c3aed", size = 46, title }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const r = (size - 6) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${title || "Progress"} ${v}%`}>
      {title && <title>{title}</title>}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f7" strokeWidth="4" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" style={{ fontSize: size * 0.24, fontWeight: 700 }} className="fill-slate-800">{Math.round(v)}%</text>
    </svg>
  );
}

export const SectionCard = ({ title, subtitle, action, children, className = "", accent }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left ${className}`}>
    <div className={`flex items-start justify-between gap-3 px-6 py-5 border-b border-slate-100 ${accent ? "border-b-2" : ""}`} style={accent ? { borderBottomColor: "#e0e7ff" } : undefined}>
      <div className="flex items-start gap-3 min-w-0">
        {accent && <span className="mt-0.5 h-6 w-1 rounded-full" style={{ background: accent }} />}
        <div className="min-w-0">
          <p className="text-lg font-bold text-slate-900">{title}</p>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

