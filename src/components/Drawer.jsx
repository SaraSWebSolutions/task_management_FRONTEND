// Right-side slide-over panel (used for Add / Edit forms).
// Full width on phones, ~640px on larger screens. Esc / backdrop click closes it.
import { useEffect } from "react";
import { X } from "lucide-react";

export default function Drawer({
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = "sm:max-w-[640px]",
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev || "auto";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="drawer-backdrop absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside
        className={`drawer-panel absolute right-0 top-0 h-dvh w-full ${width} bg-white shadow-2xl flex flex-col text-left`}
      >
        <header className="flex items-start justify-between gap-4 px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100">
          <div className="min-w-0">
            <div role="heading" aria-level={2} className="text-2xl font-semibold text-slate-900 truncate">
              {title}
            </div>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-8 py-6">{children}</div>

        {footer && (
          <footer className="shrink-0 border-t border-slate-100 bg-white px-5 sm:px-8 py-4 flex items-center justify-end gap-3">
            {footer}
          </footer>
        )}
      </aside>
    </div>
  );
}
