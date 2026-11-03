// Shared building blocks (Panelix-style). Re-skin = edit this file + theme tokens in index.css.
// NOTE: headings use <div role="heading"> on purpose: the project's global CSS
// styles bare h1/h2 and would override these Tailwind classes.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Loader2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { avatarColor, initials } from "../../utils/format";
import Drawer from "../Drawer";

export function PageHeader({ title, subtitle, breadcrumbs, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 text-left">
      <div>
        <div role="heading" aria-level={1} className="text-3xl font-bold text-slate-900">
          {title}
        </div>
        {breadcrumbs ? (
          <nav className="mt-1 flex flex-wrap items-center gap-2 text-slate-500">
            {breadcrumbs.map((b, i) => {
              const last = i === breadcrumbs.length - 1;
              return (
                <span key={b.label} className="flex items-center gap-2">
                  {b.to && !last ? (
                    <Link to={b.to} className="hover:text-brand">{b.label}</Link>
                  ) : (
                    <span className={last ? "text-brand" : ""}>{b.label}</span>
                  )}
                  {!last && <span>/</span>}
                </span>
              );
            })}
          </nav>
        ) : (
          subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

export function Card({ title, subtitle, action, children, className = "" }) {
  return (
    <section
      className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-6 text-left ${className}`}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
          <div>
            {title && (
              <div role="heading" aria-level={2} className="text-lg font-semibold text-slate-900">
                {title}
              </div>
            )}
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

// Card with a ruled header: icon on the left, title on the right (as in Panelix forms).
export function SectionCard({ icon, iconClass = "text-brand", title, children, className = "" }) {
  return (
    <section className={`bg-white rounded-2xl border border-slate-200 shadow-sm text-left ${className}`}>
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <span className={iconClass}>{icon}</span>
        <div role="heading" aria-level={2} className="text-lg font-semibold text-slate-900">
          {title}
        </div>
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

// Stat card with a soft colored icon tile on top.
export function StatCard({ label, value, icon, hint, tone = "indigo" }) {
  const tones = {
    indigo: { tile: "bg-indigo-50 text-indigo-500", pill: "bg-indigo-50 text-indigo-600", bar: "from-indigo-400 to-violet-400" },
    green: { tile: "bg-emerald-50 text-emerald-500", pill: "bg-emerald-50 text-emerald-600", bar: "from-emerald-400 to-teal-300" },
    red: { tile: "bg-red-50 text-red-500", pill: "bg-red-50 text-red-600", bar: "from-red-400 to-pink-300" },
    amber: { tile: "bg-amber-50 text-amber-500", pill: "bg-amber-50 text-amber-600", bar: "from-amber-400 to-orange-300" },
    cyan: { tile: "bg-cyan-50 text-cyan-500", pill: "bg-cyan-50 text-cyan-600", bar: "from-cyan-400 to-sky-300" },
  };
  const t = tones[tone] || tones.indigo;
  return (
    <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-sm p-5 pb-6 text-left transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center ${t.tile}`}>
          {icon}
        </div>
        {hint && (
          <span className={`max-w-[60%] rounded-full px-2.5 py-1 text-right text-xs font-semibold ${t.pill}`}>
            {hint}
          </span>
        )}
      </div>
      <p className="mt-4 text-3xl font-bold text-slate-900 break-words">{value}</p>
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>
      <span className={`absolute inset-x-0 bottom-0 h-1 bg-linear-to-r ${t.bar}`} />
    </div>
  );
}

// Compact stat used by dashboards.
export function StatTile({ label, value, hint, icon, tone = "text-slate-800" }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start justify-between gap-3 text-left">
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className={`text-3xl font-bold mt-2 ${tone}`}>{value}</p>
        {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      </div>
      {icon && (
        <div className="h-11 w-11 shrink-0 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
          {icon}
        </div>
      )}
    </div>
  );
}

export function Badge({ className = "", children }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

export function Avatar({ name, src, size = "h-10 w-10", text = "text-sm" }) {
  if (src) {
    return <img src={src} alt={name} className={`${size} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <div
      className={`${size} ${text} shrink-0 rounded-full text-white flex items-center justify-center font-semibold`}
      style={{ background: avatarColor(name) }}
    >
      {initials(name)}
    </div>
  );
}

// Grey pulsing block used to hold the place of content while it loads
export function Skeleton({ className = "", style }) {
  return <div style={style} className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />;
}

// Every page shows this while its data loads: a few skeleton rows instead of a spinner
export function Spinner({ label = "Loading..." }) {
  return (
    <div role="status" aria-live="polite" className="space-y-4 px-2 py-8">
      <span className="sr-only">{label}</span>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4" style={{ width: `${75 - i * 9}%` }} />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ children }) {
  return <div className="py-12 text-center text-slate-500">{children}</div>;
}

// Forms open as a right-side slide-over drawer. Pass `center` for small confirm dialogs.
export function Modal({ open, title, onClose, children, footer, wide = false, center = false }) {
  useEffect(() => {
    if (!open || !center) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, center, onClose]);

  if (!open) return null;

  if (!center) {
    return (
      <Drawer
        title={title}
        onClose={onClose}
        footer={footer}
        width={wide ? "sm:max-w-[820px]" : "sm:max-w-[600px]"}
      >
        {children}
      </Drawer>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="drawer-backdrop absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-xl text-left">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div role="heading" aria-level={3} className="text-lg font-semibold text-slate-900">
            {title}
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">{footer}</div>
        )}
      </div>
    </div>
  );
}

export const inputClass =
  "w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-slate-50 disabled:text-slate-500";

export function Field({ label, required, hint, children }) {
  return (
    <label className="block text-left">
      <span className="block text-sm font-semibold text-slate-800 mb-2">
        {label}
        {required && <span> *</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-slate-400 mt-1.5">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, color = "#6366f1", disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60"
      style={{ background: checked ? color : "#cbd5e1" }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
        style={{ left: checked ? "1.375rem" : "0.125rem" }}
      />
    </button>
  );
}

export function PrimaryButton({ className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-white font-semibold hover:bg-brand-hover disabled:opacity-60 disabled:cursor-not-allowed transition ${className}`}
    />
  );
}

export function GhostButton({ className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition ${className}`}
    />
  );
}

export function DangerButton({ className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-white font-semibold hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition ${className}`}
    />
  );
}

// "Showing 1 to 10 of 15" + page buttons. Hidden when everything fits on one page.
export function Pagination({ page, perPage, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (total === 0) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const btn =
    "h-10 min-w-10 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100">
      <p className="text-sm text-slate-500">
        Showing {from} to {to} of {total}
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          <button className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`${btn} ${n === page ? "!bg-brand !border-brand !text-white font-semibold" : ""}`}
            >
              {n}
            </button>
          ))}
          <button className={btn} disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// Search box used above CRM tables.
export function SearchBox({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative flex-1 min-w-0">
      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} pl-11`}
      />
    </div>
  );
}

// Small icon-only button for table / list rows.
export function IconButton({ tone = "default", className = "", ...props }) {
  const tones = {
    default: "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
    danger: "border-red-500 bg-red-500 text-white hover:bg-red-600",
    success: "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600",
    warn: "border-amber-500 bg-amber-500 text-white hover:bg-amber-600",
  };
  return (
    <button
      type="button"
      {...props}
      className={`h-9 w-9 shrink-0 rounded-lg border flex items-center justify-center transition disabled:opacity-60 ${tones[tone]} ${className}`}
    />
  );
}
