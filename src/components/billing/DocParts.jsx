// Building blocks of the Refrens style quotation / invoice editor
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, X, Pencil, ImagePlus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { IconButton } from "../ui";
import { amountInWords, fmtMoney, UOMS } from "../../utils/billingDoc";
import { shrinkImage } from "../../utils/image";

export const docInput =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-slate-50";

export function MiniField({ label, required, children, className = "" }) {
  return (
    <label className={`block text-left ${className}`}>
      <span className="block text-xs font-semibold text-slate-500 mb-1">
        {label}{required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

// Coloured box: "Quotation By" / "Billed To" ...
export function PartyBox({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-left">
      <p className="text-xs font-bold uppercase tracking-wider text-brand">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

// Item name box: type to search the product list (dropdown) or just type any name
function ItemPicker({ value, products, onType, onPick }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const ref = useRef(null);

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ left: r.left, top: r.bottom + 4, width: Math.max(r.width, 300) });
    setOpen(true);
  };

  // the list is fixed on screen, so close it when the page moves
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const q = value.trim().toLowerCase();
  const list = (products || [])
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
    .slice(0, 30);

  return (
    <div ref={ref} className="relative">
      <input
        value={value}
        onChange={(e) => { onType(e.target.value); if (!open) show(); }}
        onFocus={show}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Item name - pick a product or type"
        className={docInput}
      />
      {open && pos && products?.length > 0 && (
        <div style={{ position: "fixed", left: pos.left, top: pos.top, width: pos.width, zIndex: 60 }} className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {list.length === 0 ? (
            <p className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400"><Search size={14} /> No product found. Keep typing to use it as a name.</p>
          ) : (
            list.map((p) => (
              <button key={p._id || p.label} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(p); setOpen(false); }} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-violet-50">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-800">{p.name}</span>
                  <span className="block truncate text-xs text-slate-400">{p.type === "SERVICE" ? "Service" : "Product"}{p.sku ? ` · ${p.sku}` : ""}{p.hsn ? ` · HSN ${p.hsn}` : ""}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-brand">{fmtMoney(p.price)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const COLS = "lg:grid-cols-[1.75rem_6rem_minmax(0,1fr)_5.5rem_5rem_4.5rem_6.5rem_6.5rem_2rem]";

const Lbl = ({ children }) => <span className="mb-1 block text-[11px] font-semibold text-slate-400 lg:hidden">{children}</span>;

// Item table: # | Type | Item name | HSN/SAC | UOM | Qty | Price | Amount | remove
// Wide screens: one row per item. Phones / tablets: each item becomes a small card.
// qtyKey is "qty" for quotations and "quantity" for invoices.
// products: [{ _id, name, sku, type, hsn, uom, price, taxPercent }]
export function LineItems({ items, qtyKey, onChange, onAdd, onRemove, products, onPickProduct }) {
  return (
    <div className="text-left">
      <div className={`hidden lg:grid ${COLS} gap-2 rounded-lg bg-slate-100 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500`}>
        <span>#</span><span>Type</span><span>Item name</span><span>HSN/SAC</span><span>UOM</span><span className="text-right">Qty</span><span className="text-right">Price</span><span className="text-right">Amount</span><span />
      </div>

      <div className="mt-2 space-y-2">
        {items.map((it, n) => (
          <div key={n} className={`grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-3 lg:items-end lg:rounded-none lg:border-0 lg:border-b lg:border-slate-100 lg:px-3 lg:py-2 ${COLS}`}>
            <span className="hidden self-center text-sm text-slate-400 lg:block">{n + 1}</span>
            <div>
              <Lbl>Type</Lbl>
              <select value={it.type || "SERVICE"} onChange={(e) => onChange(n, "type", e.target.value)} className={docInput}>
                <option value="PRODUCT">Product</option>
                <option value="SERVICE">Service</option>
              </select>
            </div>
            <div className="col-span-2 lg:col-span-1 order-first lg:order-none">
              <Lbl>Item {n + 1}</Lbl>
              <ItemPicker value={it.description} products={products} onType={(v) => onChange(n, "description", v)} onPick={(p) => onPickProduct(n, p)} />
            </div>
            <div>
              <Lbl>HSN/SAC</Lbl>
              <input value={it.hsn || ""} onChange={(e) => onChange(n, "hsn", e.target.value)} placeholder="HSN" className={docInput} />
            </div>
            <div>
              <Lbl>UOM</Lbl>
              <select value={it.uom || ""} onChange={(e) => onChange(n, "uom", e.target.value)} className={docInput}>
                <option value="">-</option>
                {it.uom && !UOMS.includes(it.uom) && <option value={it.uom}>{it.uom}</option>}
                {UOMS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <Lbl>Qty</Lbl>
              <input type="number" min="0" value={it[qtyKey]} onChange={(e) => onChange(n, qtyKey, e.target.value)} className={`${docInput} text-right`} />
            </div>
            <div>
              <Lbl>Price</Lbl>
              <input type="number" min="0" value={it.rate} onChange={(e) => onChange(n, "rate", e.target.value)} placeholder="0.00" className={`${docInput} text-right`} />
            </div>
            <div className="flex items-center justify-between lg:justify-end lg:self-center">
              <Lbl>Amount</Lbl>
              <span className="text-sm font-bold text-slate-800">{fmtMoney((Number(it[qtyKey]) || 0) * (Number(it.rate) || 0))}</span>
            </div>
            <div className="flex justify-end lg:self-center">
              <IconButton tone="danger" className="!h-8 !w-8" disabled={items.length === 1} onClick={() => onRemove(n)} aria-label="Remove item"><Trash2 size={14} /></IconButton>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={onAdd} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand px-3 py-1.5 text-sm font-semibold text-brand hover:bg-violet-50">
        <Plus size={15} /> Add New Line
      </button>
    </div>
  );
}

// "+ Add Custom Fields": extra label / value lines (PO number, Place of supply ...)
export function CustomFields({ fields, onChange }) {
  const set = (i, k, v) => onChange(fields.map((f, n) => (n === i ? { ...f, [k]: v } : f)));
  return (
    <div className="space-y-2 text-left">
      {fields.map((f, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={f.label} onChange={(e) => set(i, "label", e.target.value)} placeholder="Field name" className={`${docInput} !w-40`} />
          <input value={f.value} onChange={(e) => set(i, "value", e.target.value)} placeholder="Value" className={`${docInput} !w-56`} />
          <button type="button" onClick={() => onChange(fields.filter((_, n) => n !== i))} aria-label="Remove field" className="text-slate-400 hover:text-red-500"><X size={16} /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...fields, { label: "", value: "" }])} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
        <Plus size={15} /> Add Custom Fields
      </button>
    </div>
  );
}

// Logo box with Remove / change. value: "" = default logo, "none" = hidden, else a data URL
export function LogoBox({ value, defaultLogo, onChange }) {
  const shown = value === "none" ? "" : value || defaultLogo;
  const pick = async (file) => {
    if (!file) return;
    try {
      onChange(await shrinkImage(file, 500));
    } catch (e) {
      toast.error(e.message);
    }
  };
  return (
    <div className="w-44 shrink-0 rounded-xl border border-slate-200 bg-white p-3 text-center">
      {shown ? (
        <img src={shown} alt="Logo" className="mx-auto h-16 max-w-full object-contain" />
      ) : (
        <div className="flex h-16 items-center justify-center text-xs text-slate-400">No logo</div>
      )}
      <div className="mt-2 flex items-center justify-center gap-4 text-sm font-medium">
        {shown && (
          <button type="button" onClick={() => onChange("none")} className="inline-flex items-center gap-1 text-slate-600 hover:text-red-500"><X size={14} /> Remove</button>
        )}
        <label className="inline-flex cursor-pointer items-center gap-1 text-brand hover:underline">
          {shown ? <Pencil size={14} /> : <ImagePlus size={14} />} {shown ? "change" : "Add logo"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      </div>
    </div>
  );
}

// rows: [[label, node|string, strong?]]
export function TotalsBox({ rows, total }) {
  return (
    <div className="w-full sm:w-80 ml-auto space-y-2 text-sm text-left">
      {rows.map(([label, value], i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <span className="text-slate-500">{label}</span>
          <span className="font-medium text-slate-800">{value}</span>
        </div>
      ))}
      <div className="flex items-center justify-between border-t-2 border-brand pt-2 text-base font-bold text-slate-900">
        <span>Total (INR)</span><span>{fmtMoney(total)}</span>
      </div>
      <p className="text-xs text-slate-500"><b className="text-slate-700">In words:</b> {amountInWords(total)}</p>
    </div>
  );
}

// "Add Notes" / "Add Terms" dashed button that opens a text box
export function AddBlock({ label, value, onChange, rows = 3, placeholder }) {
  const [open, setOpen] = useState(false);
  const shown = open || Boolean(value);
  if (!shown) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-500 hover:border-brand hover:text-brand">
        <Plus size={15} /> {label}
      </button>
    );
  }
  return (
    <div className="text-left">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{label.replace(/^Add /, "")}</span>
        <button type="button" onClick={() => { onChange(""); setOpen(false); }} aria-label="Remove" className="text-slate-400 hover:text-red-500"><X size={14} /></button>
      </div>
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={docInput} />
    </div>
  );
}

// A block of the document: padding + a thin line under it
export function Section({ children, className = "" }) {
  return <div className={`border-b border-slate-100 p-5 sm:p-6 last:border-b-0 ${className}`}>{children}</div>;
}
