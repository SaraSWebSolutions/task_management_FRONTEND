import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Download, FileText, CircleCheck, Clock, TriangleAlert, Eye, Pencil, Trash2, Printer, Banknote, Ban, Send } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import PaymentModal from "../components/finance/PaymentModal";
import { PageHeader, Badge, Spinner, EmptyState, Modal, PrimaryButton, GhostButton, DangerButton, IconButton, Pagination, SearchBox } from "../components/ui";
import { KpiCard, SelectBox } from "../components/finance/bits";
import { apiError, THEAD, TROW } from "../components/finance/helpers";
import { INVOICE_STATUSES, invoiceStatusMeta, paymentStatusMeta, methodLabel } from "../constants/finance";
import { fmtDate, fmtMoney, fmtShort, downloadCsv } from "../utils/format";
import { printInvoiceDoc } from "../utils/billingDoc";
import logo from "../assets/logo.png";
import { can, homePath } from "../utils/permissions";

const PER_PAGE = 10;
const printInvoice = (inv, settings = {}) => {
  const ok = printInvoiceDoc(inv, {
    name: settings.companyName,
    gstin: settings.gstin,
    logo: new URL(logo, window.location.origin).href,
  });
  if (!ok) toast.error("Allow pop-ups to print");
};

export default function FinanceInvoices() {
  const navigate = useNavigate();
  const canManage = can("invoices.manage");
  const canPay = can("payments.manage");

  const [data, setData] = useState(null);
  const [options, setOptions] = useState({ clients: [], projects: [], taxRates: [], settings: {}, openInvoices: [] });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

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
              {canManage && <PrimaryButton onClick={() => navigate("/finance/invoices/new")}><Plus size={18} /> Create Invoice</PrimaryButton>}
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
                                {canManage && i.status !== "CANCELLED" && <IconButton onClick={() => navigate(`/finance/invoices/${i._id}/edit`)} aria-label="Edit"><Pencil size={15} /></IconButton>}
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
            <GhostButton onClick={() => printInvoice(view.invoice, options.settings)}><Printer size={16} /> Print</GhostButton>
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

      <Modal center
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
