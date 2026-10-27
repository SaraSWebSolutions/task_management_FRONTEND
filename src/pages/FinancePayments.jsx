import { useCallback, useEffect, useState } from "react";
import { Download, Plus, Banknote, CircleCheck, CircleX, RotateCcw, Trash2, Filter } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import PaymentModal from "../components/finance/PaymentModal";
import { PageHeader, Card, Badge, Spinner, EmptyState, Modal, PrimaryButton, GhostButton, DangerButton, IconButton, Pagination, SearchBox } from "../components/ui";
import { KpiCard, DonutList, SelectBox } from "../components/finance/bits";
import { moneyTick, apiError, THEAD, TROW } from "../components/finance/helpers";
import { PAYMENT_METHODS, PAYMENT_STATUSES, paymentStatusMeta, methodLabel } from "../constants/finance";
import { fmtDate, fmtMoney, fmtShort, downloadCsv } from "../utils/format";
import { can, homePath } from "../utils/permissions";

const PER_PAGE = 10;

export default function FinancePayments() {
  const canManage = can("payments.manage");

  const [data, setData] = useState(null);
  const [options, setOptions] = useState({ openInvoices: [] });
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    try {
      const [res, opt] = await Promise.all([api.get("/finance/payments"), api.get("/finance/options")]);
      setData(res.data);
      setOptions(opt.data);
    } catch {
      toast.error("Failed to load payments");
      setData({ payments: [], stats: {}, trend: [], methods: [] });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (p, value) => {
    try {
      await api.patch(`/finance/payments/${p._id}/status`, { status: value });
      toast.success("Payment updated");
      load();
    } catch (error) {
      toast.error(apiError(error, "Failed to update"));
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/finance/payments/${toDelete._id}`);
      toast.success("Payment deleted");
      setToDelete(null);
      load();
    } catch (error) {
      toast.error(apiError(error, "Failed to delete"));
    }
  };

  const clear = () => { setSearch(""); setMethod(""); setStatus(""); setPage(1); };

  const q = search.trim().toLowerCase();
  const filtered = (data?.payments || []).filter(
    (p) =>
      (!q || [p.number, p.customerName, p.reference, p.invoice?.number].some((v) => v?.toLowerCase().includes(q))) &&
      (!method || p.method === method) &&
      (!status || p.status === status),
  );
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const s = data?.stats || {};

  const exportCsv = () =>
    downloadCsv("payments.csv", [
      ["Payment ID", "Customer", "Invoice", "Amount", "Method", "Date", "Status", "Reference"],
      ...filtered.map((p) => [p.number, p.customerName, p.invoice?.number, p.amount, methodLabel(p.method), fmtDate(p.date), p.status, p.reference]),
    ]);

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Payments"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Finance" }, { label: "Payments" }]}
          actions={
            <>
              <GhostButton onClick={exportCsv} disabled={!filtered.length}><Download size={18} /> Export</GhostButton>
              {canManage && <PrimaryButton onClick={() => setOpen(true)}><Plus size={18} /> Record Payment</PrimaryButton>}
            </>
          }
        />

        {!data ? <Spinner /> : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Total Payments" value={fmtShort(s.total)} icon={<Banknote size={26} />} delta={s.totalChange} />
              <KpiCard label="Successful" value={fmtShort(s.successful)} icon={<CircleCheck size={26} />} tone="green" delta={s.successfulChange} />
              <KpiCard label="Failed" value={fmtShort(s.failed)} icon={<CircleX size={26} />} tone="red" delta={s.failedChange} goodWhenDown />
              <KpiCard label="Refunded" value={fmtShort(s.refunded)} icon={<RotateCcw size={26} />} tone="amber" delta={s.refundedChange} goodWhenDown />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <Card className="lg:col-span-2" title="Payment Trends" subtitle="Last 30 days, successful payments">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" interval={4} />
                      <YAxis yAxisId="a" tickFormatter={moneyTick} width={70} />
                      <YAxis yAxisId="c" orientation="right" allowDecimals={false} />
                      <Tooltip formatter={(v, n) => (n === "Amount (₹)" ? fmtMoney(v) : v)} />
                      <Legend />
                      <Line yAxisId="a" type="monotone" dataKey="amount" name="Amount (₹)" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
                      <Line yAxisId="c" type="monotone" dataKey="count" name="Transactions" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card title="Payment Methods">
                <DonutList rows={data.methods.map((m) => ({ name: methodLabel(m.method), value: m.amount }))} />
              </Card>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col lg:flex-row lg:items-center gap-4">
              <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search payments..." />
              <SelectBox value={method} onChange={(v) => { setMethod(v); setPage(1); }} className="lg:w-56">
                <option value="">All Methods</option>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </SelectBox>
              <SelectBox value={status} onChange={(v) => { setStatus(v); setPage(1); }} className="lg:w-56">
                <option value="">All Statuses</option>
                {PAYMENT_STATUSES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
              </SelectBox>
              <GhostButton onClick={clear}><Filter size={16} /> Clear</GhostButton>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Payment Transactions ({filtered.length})</div>
              {filtered.length === 0 ? <EmptyState>No payments found.</EmptyState> : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-250 text-left">
                      <thead><tr className={THEAD}>
                        <th className="p-4">Payment ID</th><th className="p-4">Customer</th><th className="p-4">Amount</th><th className="p-4">Method</th><th className="p-4">Date</th><th className="p-4">Status</th><th className="p-4">Reference</th>{canManage && <th className="p-4" />}
                      </tr></thead>
                      <tbody>
                        {rows.map((p) => (
                          <tr key={p._id} className={TROW}>
                            <td className="p-4 font-semibold text-brand">{p.number}</td>
                            <td className="p-4"><p className="font-semibold text-slate-900">{p.customerName}</p>{p.invoice && <p className="text-sm text-slate-500">{p.invoice.number}</p>}</td>
                            <td className="p-4 font-bold text-slate-900">{fmtMoney(p.amount)}</td>
                            <td className="p-4 text-slate-600">{methodLabel(p.method)}</td>
                            <td className="p-4 text-slate-600 whitespace-nowrap">{fmtDate(p.date)}</td>
                            <td className="p-4">
                              {canManage ? (
                                <select value={p.status} onChange={(e) => changeStatus(p, e.target.value)} className={`rounded-md px-2.5 py-1 text-xs font-medium border-0 outline-none cursor-pointer ${paymentStatusMeta(p.status).badge}`}>
                                  {PAYMENT_STATUSES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
                                </select>
                              ) : <Badge className={paymentStatusMeta(p.status).badge}>{paymentStatusMeta(p.status).label}</Badge>}
                            </td>
                            <td className="p-4 font-mono text-xs text-pink-600">{p.reference || "-"}</td>
                            {canManage && <td className="p-4"><IconButton tone="danger" onClick={() => setToDelete(p)} aria-label="Delete"><Trash2 size={15} /></IconButton></td>}
                          </tr>
                        ))}
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

      <PaymentModal open={open} onClose={() => setOpen(false)} onSaved={load} openInvoices={options.openInvoices} />

      <Modal center
        open={!!toDelete}
        title="Delete payment"
        onClose={() => setToDelete(null)}
        footer={<><GhostButton onClick={() => setToDelete(null)}>Cancel</GhostButton><DangerButton onClick={remove}>Delete</DangerButton></>}
      >
        <p className="text-slate-600">Delete payment <strong>{toDelete?.number}</strong> of {fmtMoney(toDelete?.amount)}? The linked invoice balance will be updated.</p>
      </Modal>
    </Layout>
  );
}
