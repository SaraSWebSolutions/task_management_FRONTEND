// Create / edit an invoice on one page, laid out like a Refrens invoice.
// New invoices first ask: with tax (SWS0001(26-27)) or without tax (001).
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Printer, ReceiptText, FileText } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Spinner, PrimaryButton, GhostButton } from "../components/ui";
import { docInput, MiniField, PartyBox, LineItems, TotalsBox, AddBlock, CustomFields, LogoBox, Section } from "../components/billing/DocParts";
import { apiError } from "../components/finance/helpers";
import { SERVICE_TYPES } from "../constants/finance";
import { fmtMoney, toDateInput } from "../utils/format";
import { printInvoiceDoc } from "../utils/billingDoc";
import { homePath } from "../utils/permissions";
import logo from "../assets/logo.png";

const addDays = (d, n) => new Date(new Date(d).getTime() + n * 86400000);
const blankItem = () => ({ type: "SERVICE", product: "", hsn: "", uom: "", description: "", quantity: 1, rate: "" });

// Same maths as the server (utils/finance.js calcInvoice)
const calc = ({ items, discount, taxRate, taxInclusive }) => {
  const gross = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.rate) || 0), 0);
  const after = Math.max(0, gross - (Number(discount) || 0));
  const r = Number(taxRate) || 0;
  if (taxInclusive) {
    const subtotal = r ? after / (1 + r / 100) : after;
    return { gross, subtotal, taxAmount: after - subtotal, total: after };
  }
  const taxAmount = (after * r) / 100;
  return { gross, subtotal: after, taxAmount, total: after + taxAmount };
};

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);

  const [options, setOptions] = useState({ clients: [], projects: [], taxRates: [], products: [], settings: {}, openInvoices: [] });
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [nextNo, setNextNo] = useState("");

  // Tax dropdown: "none", "default", an active tax rate id, or "custom" (a rate that came from a product / old invoice)
  const taxChoices = useMemo(() => {
    const list = [{ value: "none", label: "No tax", rate: 0 }];
    if (options.settings.defaultTaxRate != null)
      list.push({ value: "default", label: "Default GST", name: "GST", rate: options.settings.defaultTaxRate });
    options.taxRates.forEach((r) => list.push({ value: r._id, label: r.region, rate: r.rate }));
    return list;
  }, [options]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const opt = (await api.get("/finance/options")).data;
        if (cancelled) return;
        setOptions(opt);

        if (!editing) {
          setForm({
            withTax: null, // asked first
            client: "", clientName: "", clientGstin: "", project: "", serviceType: "OTHER",
            issueDate: toDateInput(new Date()), dueDate: toDateInput(addDays(new Date(), 15)),
            items: [blankItem()], customFields: [], logo: "",
            discount: "", taxChoice: "none", taxLabel: "", taxRate: 0,
            taxInclusive: !!opt.settings.taxInclusive, status: "SENT", notes: "",
          });
          return;
        }

        const { invoice: inv } = (await api.get(`/finance/invoices/${id}`)).data;
        if (cancelled) return;
        setSaved(inv);
        const choices = [
          { value: "default", name: "GST", label: "Default GST", rate: opt.settings.defaultTaxRate },
          ...opt.taxRates.map((r) => ({ value: r._id, label: r.region, rate: r.rate })),
        ];
        const match = choices.find((c) => (c.name ?? c.label) === inv.taxLabel && c.rate === inv.taxRate);
        setForm({
          withTax: inv.withTax !== false,
          client: inv.client || "", clientName: inv.clientName, clientGstin: inv.clientGstin || "", project: inv.project?._id || "",
          serviceType: inv.serviceType, issueDate: toDateInput(inv.issueDate), dueDate: toDateInput(inv.dueDate),
          items: inv.items.map((i) => ({ ...blankItem(), ...i, product: i.product || "" })), customFields: inv.customFields || [], logo: inv.logo || "",
          discount: inv.discount || "",
          taxChoice: inv.taxRate ? (match ? match.value : "custom") : "none", taxLabel: inv.taxLabel || "", taxRate: inv.taxRate,
          taxInclusive: inv.taxInclusive, status: inv.status, notes: inv.notes || "",
        });
      } catch (error) {
        toast.error(apiError(error, "Failed to load invoice"));
        navigate("/finance/invoices");
      }
    })();
    return () => { cancelled = true; };
  }, [id, editing, navigate]);

  // Shows which number the invoice will get
  const kind = form?.withTax;
  const issueDate = form?.issueDate;
  useEffect(() => {
    if (kind === null || kind === undefined) return;
    let cancelled = false;
    api
      .get("/finance/invoices/next-number", { params: { withTax: kind, date: issueDate } })
      .then((r) => !cancelled && setNextNo(r.data.number))
      .catch(() => !cancelled && setNextNo(""));
    return () => { cancelled = true; };
  }, [kind, issueDate]);

  const resolveTax = (choice, f) => {
    if (!f.withTax) return { taxLabel: "", taxRate: 0 };
    if (choice === "custom") return { taxLabel: f.taxLabel, taxRate: f.taxRate };
    const c = taxChoices.find((x) => x.value === choice) || taxChoices[0];
    return { taxLabel: c.value === "none" ? "" : c.name ?? c.label, taxRate: c.rate };
  };

  if (!form) return <Layout><Spinner /></Layout>;

  const crumbs = (last) => [{ label: "Home", to: homePath() }, { label: "Finance" }, { label: "Invoices", to: "/finance/invoices" }, { label: last }];

  // ---- step 1: with tax or without tax
  if (form.withTax === null) {
    const choose = (withTax) =>
      setForm((f) => ({
        ...f,
        withTax,
        taxChoice: withTax && options.settings.autoCalculateTax !== false && options.settings.defaultTaxRate != null ? "default" : "none",
      }));
    return (
      <Layout>
        <div className="space-y-6 pb-12">
          <PageHeader title="Create Invoice" breadcrumbs={crumbs("Create Invoice")} />
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Is this invoice with tax or without tax?</h2>
            <p className="mt-1 text-sm text-slate-500">The invoice number depends on this choice.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button type="button" onClick={() => choose(true)} className="rounded-2xl border-2 border-slate-200 p-6 text-left transition hover:border-brand hover:bg-violet-50/50">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-brand"><ReceiptText size={22} /></span>
                <p className="mt-3 text-lg font-bold text-slate-900">With Tax</p>
                <p className="mt-1 text-sm text-slate-500">GST / tax invoice with HSN, tax lines and a financial year number.</p>
                <p className="mt-3 text-sm font-semibold text-brand">e.g. SWS0001(26-27)</p>
              </button>
              <button type="button" onClick={() => choose(false)} className="rounded-2xl border-2 border-slate-200 p-6 text-left transition hover:border-brand hover:bg-violet-50/50">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><FileText size={22} /></span>
                <p className="mt-3 text-lg font-bold text-slate-900">Without Tax</p>
                <p className="mt-1 text-sm text-slate-500">Simple invoice, no tax added. Plain running number.</p>
                <p className="mt-3 text-sm font-semibold text-slate-600">e.g. 001</p>
              </button>
            </div>
            <div className="mt-6"><GhostButton onClick={() => navigate("/finance/invoices")}>Cancel</GhostButton></div>
          </div>
        </div>
      </Layout>
    );
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setItem = (idx, k, v) => setForm((f) => ({ ...f, items: f.items.map((it, i) => (i === idx ? { ...it, [k]: v } : it)) }));

  const products = options.products || [];
  const pickProduct = (idx, p) =>
    setForm((f) => {
      const next = { ...f, items: f.items.map((it, i) => (i === idx ? { ...it, description: p.name, product: p._id, type: p.type || "SERVICE", hsn: p.hsn || "", uom: p.uom || "", rate: p.price } : it)) };
      // a product with its own tax % sets the invoice tax (one tax for the whole invoice)
      if (f.withTax && p.taxPercent > 0) {
        const hit = taxChoices.find((c) => c.value !== "none" && c.rate === p.taxPercent);
        return hit ? { ...next, taxChoice: hit.value } : { ...next, taxChoice: "custom", taxLabel: "GST", taxRate: p.taxPercent };
      }
      return next;
    });

  const pickClient = (e) => {
    const c = options.clients.find((x) => x._id === e.target.value);
    setForm((f) => ({ ...f, client: e.target.value, clientName: c ? c.companyName : f.clientName, clientGstin: c ? c.gstNumber || "" : f.clientGstin, serviceType: c?.basicType || f.serviceType }));
  };

  // Picking the project fills in the client it belongs to (matched by name)
  const pickProject = (e) => {
    const p = options.projects.find((x) => x._id === e.target.value);
    const c = p?.clientName && options.clients.find((x) => x.companyName.trim().toLowerCase() === p.clientName.trim().toLowerCase());
    setForm((f) => {
      if (!p || f.client) return { ...f, project: e.target.value };
      if (c) return { ...f, project: p._id, client: c._id, clientName: c.companyName, clientGstin: c.gstNumber || "", serviceType: c.basicType || f.serviceType };
      return { ...f, project: p._id, clientName: f.clientName || p.clientName || "" };
    });
  };

  const tax = resolveTax(form.taxChoice, form);
  const totals = calc({ ...form, taxRate: tax.taxRate, taxInclusive: form.withTax && form.taxInclusive });

  const save = async () => {
    if (!form.clientName.trim()) return toast.error("Select a client or enter a name");
    if (!form.dueDate) return toast.error("Due date is required");
    const items = form.items.filter((i) => i.description.trim());
    if (!items.length) return toast.error("Add at least one line item");
    if (items.some((i) => !(Number(i.quantity) > 0))) return toast.error("Quantity must be more than 0");
    try {
      setSaving(true);
      const { taxChoice, ...rest } = form;
      void taxChoice;
      const body = { ...rest, ...tax, items, discount: Number(form.discount) || 0 };
      if (editing) await api.put(`/finance/invoices/${id}`, body);
      else await api.post("/finance/invoices", body);
      toast.success(editing ? "Invoice updated" : "Invoice created");
      return true;
    } catch (error) {
      toast.error(apiError(error, "Failed to save invoice"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    if (await save()) navigate("/finance/invoices");
  };

  const switched = editing && saved && (saved.withTax !== false) !== form.withTax;
  const numberShown = editing && !switched ? saved?.number : nextNo || "On save";

  const onPrint = () => {
    const items = form.items.filter((i) => i.description.trim());
    if (!form.clientName.trim() || !items.length) return toast.error("Add the client and at least one item first");
    const paid = saved?.paidAmount || 0;
    const ok = printInvoiceDoc(
      {
        number: numberShown, withTax: form.withTax, issueDate: form.issueDate, dueDate: form.dueDate,
        clientName: form.clientName, clientGstin: form.clientGstin,
        project: options.projects.find((p) => p._id === form.project),
        items, customFields: form.customFields, logo: form.logo,
        discount: Number(form.discount) || 0, taxLabel: tax.taxLabel, taxRate: tax.taxRate, taxInclusive: form.withTax && form.taxInclusive,
        subtotal: totals.subtotal, taxAmount: totals.taxAmount, total: totals.total,
        paidAmount: paid, balance: Math.max(0, totals.total - paid), notes: form.notes,
      },
      { name: options.settings.companyName, gstin: options.settings.gstin, logo: new URL(logo, window.location.origin).href },
    );
    if (!ok) toast.error("Allow pop-ups to print");
  };

  const title = editing ? `Edit ${saved?.number || "Invoice"}` : "Create Invoice";

  const toggle = (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
      {[[true, "With Tax"], [false, "Without Tax"]].map(([v, label]) => (
        <button
          key={label}
          type="button"
          onClick={() => setForm((f) => ({ ...f, withTax: v, taxChoice: v && f.taxChoice === "none" && options.settings.autoCalculateTax !== false && options.settings.defaultTaxRate != null ? "default" : f.taxChoice }))}
          className={`rounded-md px-3 py-1.5 transition ${form.withTax === v ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-50"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-4 pb-12">
        <PageHeader title={title} breadcrumbs={crumbs(title)} actions={toggle} />

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* title, dates, logo */}
          <Section className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0 flex-1 text-left">
              <p className="text-2xl font-bold text-brand">{form.withTax ? "Tax Invoice" : "Invoice"}</p>
              <div className="mt-3 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                <MiniField label="Invoice No"><input readOnly value={numberShown} className={`${docInput} !bg-slate-50 font-semibold`} /></MiniField>
                <MiniField label="Invoice Date" required><input type="date" value={form.issueDate} onChange={set("issueDate")} className={docInput} /></MiniField>
                <MiniField label="Due Date" required><input type="date" value={form.dueDate} onChange={set("dueDate")} className={docInput} /></MiniField>
              </div>
              {switched && <p className="mt-2 text-xs text-amber-600">The invoice gets a new {form.withTax ? "tax invoice" : "plain"} number when you save.</p>}
              <div className="mt-3"><CustomFields fields={form.customFields} onChange={(v) => setForm((f) => ({ ...f, customFields: v }))} /></div>
            </div>
            <LogoBox value={form.logo} defaultLogo={logo} onChange={(v) => setForm((f) => ({ ...f, logo: v }))} />
          </Section>

          {/* billed by / to */}
          <Section className="grid gap-4 md:grid-cols-2">
            <PartyBox title="Billed By (Your details)">
              <p className="font-bold text-slate-900">{options.settings.companyName || "SaraS Web Solutions"}</p>
              {form.withTax && options.settings.gstin && <p className="mt-1 text-sm text-slate-500">GSTIN: {options.settings.gstin}</p>}
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <MiniField label="Service type">
                  <select value={form.serviceType} onChange={set("serviceType")} className={docInput}>
                    {SERVICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </MiniField>
                <MiniField label="Status">
                  <select value={form.status} onChange={set("status")} className={docInput} disabled={form.status === "CANCELLED"}>
                    <option value="SENT">Sent</option><option value="DRAFT">Draft</option>
                    {form.status === "CANCELLED" && <option value="CANCELLED">Cancelled</option>}
                  </select>
                </MiniField>
              </div>
            </PartyBox>

            <PartyBox title="Billed To (Client's details)">
              <div className="grid grid-cols-2 gap-2.5">
                <MiniField label="Client">
                  <select value={form.client} onChange={pickClient} className={docInput}>
                    <option value="">Other (type a name)</option>
                    {options.clients.map((c) => <option key={c._id} value={c._id}>{c.companyName}</option>)}
                  </select>
                </MiniField>
                <MiniField label="Bill to name" required><input value={form.clientName} onChange={set("clientName")} className={docInput} /></MiniField>
                {form.withTax && <MiniField label="Client GSTIN"><input value={form.clientGstin} onChange={set("clientGstin")} className={docInput} /></MiniField>}
                <MiniField label="Project">
                  <select value={form.project} onChange={pickProject} className={docInput}>
                    <option value="">No project</option>
                    {options.projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </MiniField>
              </div>
            </PartyBox>
          </Section>

          {/* items */}
          <Section>
            <LineItems
              items={form.items}
              qtyKey="quantity"
              onChange={setItem}
              onAdd={() => setForm((f) => ({ ...f, items: [...f.items, blankItem()] }))}
              onRemove={(idx) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}
              products={products}
              onPickProduct={pickProduct}
            />
          </Section>

          {/* notes + totals */}
          <Section className="grid items-start gap-6 md:grid-cols-2">
            <AddBlock label="Add Notes" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} rows={3} placeholder="Payment terms, bank details..." />
            <div className="space-y-3">
              <TotalsBox
                total={totals.total}
                rows={[
                  ["Amount", fmtMoney(totals.gross)],
                  ["Discount (₹)", <input key="d" type="number" min="0" value={form.discount} onChange={set("discount")} placeholder="0" className={`${docInput} !w-28 text-right`} />],
                  ...(form.withTax
                    ? [
                        ["Tax", (
                          <select key="t" value={form.taxChoice} onChange={set("taxChoice")} className={`${docInput} !w-40`}>
                            {taxChoices.map((c) => <option key={c.value} value={c.value}>{c.value === "none" ? c.label : `${c.label} (${c.rate}%)`}</option>)}
                            {form.taxChoice === "custom" && <option value="custom">{form.taxLabel || "Tax"} ({form.taxRate}%)</option>}
                          </select>
                        )],
                        ...(tax.taxRate > 0 ? [[`${tax.taxLabel || "Tax"} (${tax.taxRate}%)`, fmtMoney(totals.taxAmount)]] : []),
                      ]
                    : []),
                ]}
              />
              {form.withTax && (
                <label className="flex items-center justify-end gap-2 text-xs font-medium text-slate-600">
                  <input type="checkbox" checked={form.taxInclusive} onChange={(e) => setForm((f) => ({ ...f, taxInclusive: e.target.checked }))} />
                  Item prices already include tax
                </label>
              )}
            </div>
          </Section>

          {/* actions */}
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 sm:px-6">
            <PrimaryButton disabled={saving} onClick={onSave} className="!py-2"><Save size={16} /> {editing ? "Save Changes" : "Save Invoice"}</PrimaryButton>
            <GhostButton disabled={saving} onClick={onPrint} className="!py-2"><Printer size={16} /> Print / PDF</GhostButton>
            <GhostButton disabled={saving} onClick={() => navigate("/finance/invoices")} className="!py-2">Cancel</GhostButton>
          </div>
        </div>
      </div>
    </Layout>
  );
}
