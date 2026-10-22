import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Download, FileText, CircleCheck, Clock, TriangleAlert, Eye, Pencil, Trash2, Printer, Banknote, Ban, Send } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import PaymentModal from "../components/finance/PaymentModal";
import { PageHeader, Badge, Spinner, EmptyState, Modal, Field, PrimaryButton, GhostButton, DangerButton, IconButton, Pagination, SearchBox, inputClass } from "../components/ui";
import { KpiCard, SelectBox } from "../components/finance/bits";
import { apiError, THEAD, TROW } from "../components/finance/helpers";
import { INVOICE_STATUSES, invoiceStatusMeta, paymentStatusMeta, SERVICE_TYPES, methodLabel } from "../constants/finance";
import { fmtDate, fmtMoney, fmtShort, downloadCsv, toDateInput } from "../utils/format";
import { can, homePath } from "../utils/permissions";

const PER_PAGE = 10;
const addDays = (d, n) => new Date(new Date(d).getTime() + n * 86400000);
const blankItem = () => ({ description: "", quantity: 1, rate: "" });

// Same maths as the server (utils/finance.js calcInvoice), used for the live preview.
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

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const printInvoice = (inv) => {
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return toast.error("Allow pop-ups to print");
  const rows = inv.items
    .map((i) => `<tr><td>${esc(i.description)}</td><td class="r">${i.quantity}</td><td class="r">${fmtMoney(i.rate)}</td><td class="r">${fmtMoney(i.quantity * i.rate)}</td></tr>`)
    .join("");
  w.document.write(`<html><head><title>${esc(inv.number)}</title><style>
    body{font-family:Arial,sans-serif;color:#0f172a;padding:40px;max-width:800px;margin:auto}
    h1{margin:0;font-size:28px} .m{color:#64748b;font-size:14px} table{width:100%;border-collapse:collapse;margin-top:24px}
    th{text-align:left;background:#f8fafc;font-size:12px;text-transform:uppercase;color:#64748b;padding:10px} td{padding:10px;border-top:1px solid #e2e8f0}
    .r{text-align:right} .t td{border:0;padding:4px 10px} .b{font-weight:bold;font-size:18px}
  </style></head><body>
    <h1>INVOICE</h1><p class="m">${esc(inv.number)}</p>
    <p><strong>Bill to:</strong> ${esc(inv.clientName)}${inv.clientGstin ? `<br/>GSTIN: ${esc(inv.clientGstin)}` : ""}</p>
    <p class="m">Issue date: ${fmtDate(inv.issueDate)} &nbsp;|&nbsp; Due date: ${fmtDate(inv.dueDate)}</p>
    <table><thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
    <table class="t" style="width:50%;margin-left:auto">
      ${inv.discount > 0 ? `<tr><td>Discount</td><td class="r">- ${fmtMoney(inv.discount)}</td></tr>` : ""}
      <tr><td>Subtotal</td><td class="r">${fmtMoney(inv.subtotal)}</td></tr>
      <tr><td>${esc(inv.taxLabel || "Tax")} (${inv.taxRate}%)</td><td class="r">${fmtMoney(inv.taxAmount)}</td></tr>
      <tr class="b"><td>Total</td><td class="r">${fmtMoney(inv.total)}</td></tr>
      <tr><td>Paid</td><td class="r">${fmtMoney(inv.paidAmount)}</td></tr>
      <tr class="b"><td>Balance due</td><td class="r">${fmtMoney(inv.balance)}</td></tr>
    </table>
    ${inv.notes ? `<p class="m" style="margin-top:32px">${esc(inv.notes)}</p>` : ""}
  </body></html>`);
  w.document.close();
  w.focus();
  w.print();
};

export default function FinanceInvoices() {
  const canManage = can("invoices.manage");
  const canPay = can("payments.manage");

  const [data, setData] = useState(null);
  const [options, setOptions] = useState({ clients: [], projects: [], taxRates: [], settings: {}, openInvoices: [] });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const [view, setView] = useState(null); // { invoice, payments }
  const [payFor, setPayFor] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    try {
      const [res, opt] = await Promise.all([api.get("/finance/invoices"), api.get("/finance/options")]);
      setData(res.data);
      setOptions(opt.data);
    } catch {
      toast.error("Failed to load invoices");
      setData({ invoices: [], stats: {} });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Tax dropdown: "none", "default", an active tax rate id, or "custom" (an old invoice's own rate)
  const taxChoices = useMemo(() => {
    const list = [{ value: "none", label: "No tax", rate: 0 }];
    if (options.settings.defaultTaxRate != null)
      list.push({ value: "default", label: "Default GST", name: "GST", rate: options.settings.defaultTaxRate });
    options.taxRates.forEach((r) => list.push({ value: r._id, label: r.region, rate: r.rate }));
    return list;
  }, [options]);

  const resolveTax = (choice, f) => {
    if (choice === "custom") return { taxLabel: f.taxLabel, taxRate: f.taxRate };
    const c = taxChoices.find((x) => x.value === choice) || taxChoices[0];
    return { taxLabel: c.value === "none" ? "" : c.name ?? c.label, taxRate: c.rate };
  };

  const openAdd = () => {
    const auto = options.settings.autoCalculateTax !== false;
    setEditing(null);
    setForm({
      client: "", clientName: "", clientGstin: "", project: "", serviceType: "OTHER",
      issueDate: toDateInput(new Date()), dueDate: toDateInput(addDays(new Date(), 15)),
      items: [blankItem()], discount: "", taxChoice: auto ? "default" : "none", taxLabel: "", taxRate: 0,
      taxInclusive: !!options.settings.taxInclusive, status: "SENT", notes: "",
    });
    setOpen(true);
  };

  const openEdit = (inv) => {
    const match = taxChoices.find((c) => (c.name ?? c.label) === inv.taxLabel && c.rate === inv.taxRate);
    setEditing(inv);
    setForm({
      client: inv.client || "", clientName: inv.clientName, clientGstin: inv.clientGstin || "", project: inv.project?._id || "",
      serviceType: inv.serviceType, issueDate: toDateInput(inv.issueDate), dueDate: toDateInput(inv.dueDate),
      items: inv.items.map((i) => ({ ...i })), discount: inv.discount || "",
      taxChoice: inv.taxRate ? (match ? match.value : "custom") : "none", taxLabel: inv.taxLabel || "", taxRate: inv.taxRate,
      taxInclusive: inv.taxInclusive, status: inv.status, notes: inv.notes || "",
    });
    setOpen(true);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setItem = (idx, k, v) => setForm((f) => ({ ...f, items: f.items.map((it, i) => (i === idx ? { ...it, [k]: v } : it)) }));

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

  const tax = form ? resolveTax(form.taxChoice, form) : { taxRate: 0 };
  const totals = form ? calc({ ...form, taxRate: tax.taxRate }) : null;

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
      if (editing) await api.put(`/finance/invoices/${editing._id}`, body);
      else await api.post("/finance/invoices", body);
      toast.success(editing ? "Invoice updated" : "Invoice created");
      setOpen(false);
      load();
    } catch (error) {
      toast.error(apiError(error, "Failed to save invoice"));
    } finally {
      setSaving(false);
    }
  };

  const openView = async (inv) => {
    try {
      const { data: r } = await api.get(`/finance/invoices/${inv._id}`);
      setView(r);
    } catch (error) {
      toast.error(apiError(error, "Failed to load invoice"));
    }
  };

  const setInvoiceStatus = async (inv, value) => {
    try {
      await api.patch(`/finance/invoices/${inv._id}/status`, { status: value });
      toast.success("Invoice updated");
      setView(null);
      load();
    } catch (error) {
      toast.error(apiError(error, "Failed to update"));
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/finance/invoices/${toDelete._id}`);
      toast.success("Invoice deleted");
      setToDelete(null);
      load();
    } catch (error) {
      toast.error(apiError(error, "Failed to delete"));
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = (data?.invoices || []).filter(
    (i) => (!q || i.number.toLowerCase().includes(q) || i.clientName.toLowerCase().includes(q)) && (!status || i.displayStatus === status),
  );
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const s = data?.stats || {};

  const exportCsv = () =>
    downloadCsv("invoices.csv", [
      ["Invoice #", "Client", "Issue date", "Due date", "Subtotal", "Tax", "Total", "Paid", "Balance", "Status"],
      ...filtered.map((i) => [i.number, i.clientName, fmtDate(i.issueDate), fmtDate(i.dueDate), i.subtotal, i.taxAmount, i.total, i.paidAmount, i.balance, i.displayStatus]),
    ]);

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Invoices"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Finance" }, { label: "Invoices" }]}
          actions={
            <>
              <GhostButton onClick={exportCsv} disabled={!filtered.length}><Download size={18} /> Export CSV</GhostButton>
              {canManage && <PrimaryButton onClick={openAdd}><Plus size={18} /> Create Invoice</PrimaryButton>}
            </>
          }
        />

        {!data ? <Spinner /> : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Total Invoiced" value={fmtShort(s.totalInvoiced)} icon={<FileText size={26} />} delta={s.invoicedChange} />
              <KpiCard label="Paid" value={fmtShort(s.paid)} icon={<CircleCheck size={26} />} tone="green" hint="Received so far" />
              <KpiCard label="Pending" value={fmtShort(s.pending)} icon={<Clock size={26} />} tone="amber" hint="Due, not yet late" />
              <KpiCard label="Overdue" value={fmtShort(s.overdue)} icon={<TriangleAlert size={26} />} tone="red" hint="Past the due date" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col lg:flex-row lg:items-center gap-4">
              <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by invoice # or client..." />
              <SelectBox value={status} onChange={(v) => { setStatus(v); setPage(1); }} className="lg:w-64">
                <option value="">All Statuses</option>
                {INVOICE_STATUSES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
              </SelectBox>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">All Invoices ({filtered.length})</div>
              {filtered.length === 0 ? <EmptyState>No invoices found.</EmptyState> : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-250 text-left">
                      <thead><tr className={THEAD}>
                        <th className="p-4">Invoice #</th><th className="p-4">Client</th><th className="p-4">Amount</th><th className="p-4">Issue Date</th><th className="p-4">Due Date</th><th className="p-4">Status</th><th className="p-4">Actions</th>
                      </tr></thead>
                      <tbody>
                        {rows.map((i) => {
                          const m = invoiceStatusMeta(i.displayStatus);
                          return (
                            <tr key={i._id} className={TROW}>
                              <td className="p-4 font-semibold text-brand">{i.number}</td>
                              <td className="p-4 font-medium text-slate-900">{i.clientName}</td>
                              <td className="p-4 font-bold">{fmtMoney(i.total)}{i.balance > 0 && i.paidAmount > 0 && <span className="block text-xs font-normal text-slate-400">{fmtMoney(i.balance)} due</span>}</td>
                              <td className="p-4 text-slate-600 whitespace-nowrap">{fmtDate(i.issueDate)}</td>
                              <td className="p-4 text-slate-600 whitespace-nowrap">{fmtDate(i.dueDate)}</td>
                              <td className="p-4"><Badge className={m.badge}>{m.label}</Badge></td>
                              <td className="p-4"><div className="flex gap-2">
                                <IconButton onClick={() => openView(i)} aria-label="View"><Eye size={15} /></IconButton>
                                {canManage && i.status !== "CANCELLED" && <IconButton onClick={() => openEdit(i)} aria-label="Edit"><Pencil size={15} /></IconButton>}
                                {canManage && <IconButton tone="danger" onClick={() => setToDelete(i)} aria-label="Delete"><Trash2 size={15} /></IconButton>}
                              </div></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={page} perPage={PER_PAGE} total={filtered.length} onChange={setPage} />
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create / edit */}
      <Modal
        open={open}
        wide
        title={editing ? `Edit ${editing.number}` : "Create Invoice"}
        onClose={() => setOpen(false)}
        footer={<><GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton><PrimaryButton disabled={saving} onClick={save}>{editing ? "Save Changes" : "Create Invoice"}</PrimaryButton></>}
      >
        {form && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Client">
                <select value={form.client} onChange={pickClient} className={inputClass}>
                  <option value="">Other (type a name)</option>
                  {options.clients.map((c) => <option key={c._id} value={c._id}>{c.companyName}</option>)}
                </select>
              </Field>
              <Field label="Bill to name" required><input value={form.clientName} onChange={set("clientName")} className={inputClass} /></Field>
              <Field label="Client GSTIN"><input value={form.clientGstin} onChange={set("clientGstin")} className={inputClass} /></Field>
              <Field label="Project">
                <select value={form.project} onChange={pickProject} className={inputClass}>
                  <option value="">No project</option>
                  {options.projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Service type">
                <select value={form.serviceType} onChange={set("serviceType")} className={inputClass}>
                  {SERVICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Invoice status">
                <select value={form.status} onChange={set("status")} className={inputClass}>
                  <option value="SENT">Sent</option><option value="DRAFT">Draft</option>
                </select>
              </Field>
              <Field label="Issue date" required><input type="date" value={form.issueDate} onChange={set("issueDate")} className={inputClass} /></Field>
              <Field label="Due date" required><input type="date" value={form.dueDate} onChange={set("dueDate")} className={inputClass} /></Field>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800 mb-2">Line items *</p>
              <div className="space-y-3">
                {form.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                    <input value={it.description} onChange={(e) => setItem(idx, "description", e.target.value)} placeholder="Description" className={`${inputClass} col-span-12 sm:col-span-6`} />
                    <input type="number" min="0" value={it.quantity} onChange={(e) => setItem(idx, "quantity", e.target.value)} placeholder="Qty" className={`${inputClass} col-span-4 sm:col-span-2`} />
                    <input type="number" min="0" value={it.rate} onChange={(e) => setItem(idx, "rate", e.target.value)} placeholder="Rate" className={`${inputClass} col-span-6 sm:col-span-3`} />
                    <IconButton tone="danger" className="col-span-2 sm:col-span-1" disabled={form.items.length === 1} onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))} aria-label="Remove item"><Trash2 size={15} /></IconButton>
                  </div>
                ))}
              </div>
              <GhostButton className="mt-3 !py-2" onClick={() => setForm((f) => ({ ...f, items: [...f.items, blankItem()] }))}><Plus size={16} /> Add item</GhostButton>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Discount (₹)"><input type="number" min="0" value={form.discount} onChange={set("discount")} placeholder="0" className={inputClass} /></Field>
              <Field label="Tax">
                <select value={form.taxChoice} onChange={set("taxChoice")} className={inputClass}>
                  {taxChoices.map((c) => <option key={c.value} value={c.value}>{c.value === "none" ? c.label : `${c.label} (${c.rate}%)`}</option>)}
                  {form.taxChoice === "custom" && <option value="custom">{form.taxLabel || "Tax"} ({form.taxRate}%)</option>}
                </select>
              </Field>
            </div>
            <label className="flex items-center gap-3 text-slate-700 font-medium">
              <input type="checkbox" checked={form.taxInclusive} onChange={(e) => setForm((f) => ({ ...f, taxInclusive: e.target.checked }))} /> Item prices already include tax
            </label>

            <div className="rounded-xl bg-slate-50 p-4 ml-auto sm:w-80 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{fmtMoney(totals.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Tax ({tax.taxRate}%)</span><span>{fmtMoney(totals.taxAmount)}</span></div>
              <div className="flex justify-between text-lg font-bold pt-1.5 border-t border-slate-200"><span>Total</span><span>{fmtMoney(totals.total)}</span></div>
            </div>

            <Field label="Notes"><textarea rows={2} value={form.notes} onChange={set("notes")} placeholder="Payment terms, bank details..." className={inputClass} /></Field>
          </div>
        )}
      </Modal>

      {/* View */}
      <Modal
        open={!!view}
        wide
        title={view ? `Invoice ${view.invoice.number}` : ""}
        onClose={() => setView(null)}
        footer={view && (
          <>
            {canManage && view.invoice.status === "DRAFT" && <GhostButton onClick={() => setInvoiceStatus(view.invoice, "SENT")}><Send size={16} /> Mark as sent</GhostButton>}
            {canManage && view.invoice.status !== "CANCELLED" && view.invoice.paidAmount === 0 && <GhostButton onClick={() => setInvoiceStatus(view.invoice, "CANCELLED")}><Ban size={16} /> Cancel invoice</GhostButton>}
            {canManage && view.invoice.status === "CANCELLED" && <GhostButton onClick={() => setInvoiceStatus(view.invoice, "SENT")}>Reopen</GhostButton>}
            <GhostButton onClick={() => printInvoice(view.invoice)}><Printer size={16} /> Print</GhostButton>
            {canPay && view.invoice.balance > 0 && view.invoice.status === "SENT" && (
              <PrimaryButton onClick={() => { setPayFor(view.invoice._id); setView(null); }}><Banknote size={16} /> Record payment</PrimaryButton>
            )}
          </>
        )}
      >
        {view && (() => {
          const inv = view.invoice;
          const m = invoiceStatusMeta(inv.displayStatus);
          return (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-bold text-slate-900">{inv.clientName}</p>
                  {inv.clientGstin && <p className="text-sm text-slate-500">GSTIN {inv.clientGstin}</p>}
                  {inv.project?.name && <p className="text-sm text-slate-500">Project: {inv.project.name}</p>}
                </div>
                <div className="text-right text-sm text-slate-500">
                  <Badge className={m.badge}>{m.label}</Badge>
                  <p className="mt-2">Issued {fmtDate(inv.issueDate)}</p>
                  <p>Due {fmtDate(inv.dueDate)}</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead><tr className={THEAD}><th className="p-3">Description</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Rate</th><th className="p-3 text-right">Amount</th></tr></thead>
                  <tbody>
                    {inv.items.map((i, idx) => (
                      <tr key={idx} className={TROW}><td className="p-3">{i.description}</td><td className="p-3 text-right">{i.quantity}</td><td className="p-3 text-right">{fmtMoney(i.rate)}</td><td className="p-3 text-right">{fmtMoney(i.quantity * i.rate)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="ml-auto sm:w-72 space-y-1.5 text-sm">
                {inv.discount > 0 && <div className="flex justify-between"><span className="text-slate-500">Discount</span><span>- {fmtMoney(inv.discount)}</span></div>}
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{fmtMoney(inv.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{inv.taxLabel || "Tax"} ({inv.taxRate}%)</span><span>{fmtMoney(inv.taxAmount)}</span></div>
                <div className="flex justify-between text-base font-bold pt-1.5 border-t border-slate-200"><span>Total</span><span>{fmtMoney(inv.total)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Paid</span><span className="text-emerald-600">{fmtMoney(inv.paidAmount)}</span></div>
                <div className="flex justify-between font-bold"><span>Balance due</span><span>{fmtMoney(inv.balance)}</span></div>
              </div>

              {view.payments.length > 0 && (
                <div>
                  <p className="font-semibold text-slate-900 mb-2">Payments</p>
                  <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {view.payments.map((p) => (
                      <li key={p._id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                        <span><strong>{p.number}</strong> · {fmtDate(p.date)} · {methodLabel(p.method)}</span>
                        <span className="flex items-center gap-3"><Badge className={paymentStatusMeta(p.status).badge}>{paymentStatusMeta(p.status).label}</Badge><strong>{fmtMoney(p.amount)}</strong></span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {inv.notes && <p className="text-sm text-slate-500 whitespace-pre-wrap">{inv.notes}</p>}
            </div>
          );
        })()}
      </Modal>

      <PaymentModal open={!!payFor} invoiceId={payFor || ""} onClose={() => setPayFor(null)} onSaved={load} openInvoices={options.openInvoices} />

      <Modal
        open={!!toDelete}
        title="Delete invoice"
        onClose={() => setToDelete(null)}
        footer={<><GhostButton onClick={() => setToDelete(null)}>Cancel</GhostButton><DangerButton onClick={remove}>Delete</DangerButton></>}
      >
        <p className="text-slate-600">Delete invoice <strong>{toDelete?.number}</strong> for {toDelete?.clientName}? If it already has payments, cancel it instead.</p>
      </Modal>
    </Layout>
  );
}
