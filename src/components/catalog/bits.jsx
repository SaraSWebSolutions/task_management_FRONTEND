import { avatarColor, initials } from "../../utils/format";

export const PRODUCT_STATUS = {
  ACTIVE: { label: "Active", badge: "bg-emerald-100 text-emerald-700" },
  INACTIVE: { label: "Inactive", badge: "bg-slate-200 text-slate-600" },
  DRAFT: { label: "Draft", badge: "bg-amber-100 text-amber-700" },
};

export const statusBadge = (s) =>
  PRODUCT_STATUS[s] || { label: s || "-", badge: "bg-slate-100 text-slate-600" };

// Product picture, or a colored tile with the product's initials (like "PWH")
export function ProductThumb({ product, className = "", text = "text-4xl" }) {
  const src = product?.images?.[0];
  if (src) {
    return <img src={src} alt={product.name} className={`object-cover ${className}`} />;
  }
  const name = product?.name || "";
  const letters = name.split(/\s+/).filter(Boolean).slice(0, 3).map((w) => w[0].toUpperCase()).join("");
  return (
    <div
      className={`flex items-center justify-center font-bold text-white ${text} ${className}`}
      style={{ background: avatarColor(name) }}
      aria-label={name}
    >
      {letters || initials(name)}
    </div>
  );
}

export const margin = (price, cost) => {
  const p = Number(price) || 0;
  const profit = p - (Number(cost) || 0);
  return { profit, pct: p ? (profit / p) * 100 : 0 };
};

// Small stat box used at the top of the Products / Categories pages
export function MiniStat({ label, value, icon, tone = "indigo" }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-500",
    green: "bg-emerald-50 text-emerald-500",
    amber: "bg-amber-50 text-amber-500",
    cyan: "bg-cyan-50 text-cyan-500",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left">
      <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${tones[tone] || tones.indigo}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-tight text-slate-900">{value}</p>
        <p className="truncate text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// Compact input styling used inside the product form
export const compactInput =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

export const withTax = (price, taxPercent) =>
  Math.round((Number(price) || 0) * (1 + (Number(taxPercent) || 0) / 100) * 100) / 100;
