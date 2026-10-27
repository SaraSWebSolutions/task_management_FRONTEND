import { useCallback, useEffect, useState } from "react";
import { Plus, Download, Users, CirclePlay, CircleX, IndianRupee, Pencil, Trash2, Filter } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Card, Badge, Spinner, EmptyState, Modal, Field, PrimaryButton, GhostButton, DangerButton, IconButton, Pagination, SearchBox, inputClass } from "../components/ui";
import { KpiCard, DonutList, SelectBox } from "../components/finance/bits";
import { apiError, THEAD, TROW } from "../components/finance/helpers";
import { SUBSCRIPTION_STATUSES, subscriptionStatusMeta } from "../constants/finance";
import { fmtDate, fmtMoney, fmtShort, downloadCsv, toDateInput } from "../utils/format";
import { can, homePath } from "../utils/permissions";

const PER_PAGE = 10;
const blank = () => ({ client: "", customerName: "", plan: "", planName: "", amount: "", billingCycle: "MONTHLY", startDate: toDateInput(new Date()), nextBilling: "", status: "ACTIVE", notes: "" });

export default function FinanceSubscriptions() {
  const canManage = can("subscriptions.manage");

  const [data, setData] = useState(null);
  const [options, setOptions] = useState({ clients: [], plans: [], settings: {} });
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank());
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    try {
      const [res, opt] = await Promise.all([api.get("/finance/subscriptions"), api.get("/finance/options")]);
      setData(res.data);
      setOptions(opt.data);
    } catch {
      toast.error("Failed to load subscriptions");
      setData({ subscriptions: [], stats: {}, growth: [], planDistribution: [], churn: {} });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // price of the chosen plan for the chosen billing cycle
  const planPrice = (p, cycle) => (cycle === "YEARLY"
    ? p.yearlyPrice ?? Math.round(p.monthlyPrice * 12 * (1 - (options.settings.yearlyDiscount || 0) / 100) * 100) / 100
    : p.monthlyPrice);

  const choosePlan = (planId, cycle = form.billingCycle) => {
    const p = options.plans.find((x) => x._id === planId);
    setForm((f) => ({ ...f, plan: planId, billingCycle: cycle, planName: p ? p.name : f.planName, amount: p ? planPrice(p, cycle) : f.amount }));
  };

  const chooseClient = (e) => {
    const c = options.clients.find((x) => x._id === e.target.value);
    setForm((f) => ({ ...f, client: e.target.value, customerName: c ? c.companyName : f.customerName }));
  };

  const openAdd = () => { setEditing(null); setForm(blank()); setOpen(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({ client: s.client || "", customerName: s.customerName, plan: s.plan || "", planName: s.planName, amount: s.amount, billingCycle: s.billingCycle, startDate: toDateInput(s.startDate), nextBilling: toDateInput(s.nextBilling), status: s.status, notes: s.notes || "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.customerName.trim()) return toast.error("Customer is required");
    if (!form.planName.trim()) return toast.error("Select a plan or type a plan name");
    if (form.amount === "" || !(Number(form.amount) >= 0)) return toast.error("Enter the amount");
    try {
      setSaving(true);
      const body = { ...form, amount: Number(form.amount) };
      if (editing) await api.put(`/finance/subscriptions/${editing._id}`, body);
      else await api.post("/finance/subscriptions", body);
      toast.success(editing ? "Subscription updated" : "Subscription added");
      setOpen(false);
      load();
    } catch (error) {
      toast.error(apiError(error, "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (s, value) => {
    try {
      await api.patch(`/finance/subscriptions/${s._id}/status`, { status: value });
      load();
    } catch (error) {
      toast.error(apiError(error, "Failed to update"));
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/finance/subscriptions/${toDelete._id}`);
      toast.success("Subscription deleted");
      setToDelete(null);
      load();
    } catch (error) {
      toast.error(apiError(error, "Failed to delete"));
    }
  };

  const clear = () => { setSearch(""); setPlan(""); setStatus(""); setPage(1); };

  const q = search.trim().toLowerCase();
  const all = data?.subscriptions || [];
  const planNames = [...new Set(all.map((s) => s.planName))];
  const filtered = all.filter((s) => (!q || s.customerName.toLowerCase().includes(q)) && (!plan || s.planName === plan) && (!status || s.status === status));
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const s = data?.stats || {};
  const c = data?.churn || {};

  const exportCsv = () =>
    downloadCsv("subscriptions.csv", [
      ["Customer", "Plan", "Amount", "Billing", "Start", "Next billing", "Status"],
      ...filtered.map((x) => [x.customerName, x.planName, x.amount, x.billingCycle, fmtDate(x.startDate), fmtDate(x.nextBilling), x.status]),
    ]);

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Subscriptions"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Finance" }, { label: "Subscriptions" }]}
          actions={
            <>
              <GhostButton onClick={exportCsv} disabled={!filtered.length}><Download size={18} /> Export</GhostButton>
              {canManage && <PrimaryButton onClick={openAdd}><Plus size={18} /> Add Subscription</PrimaryButton>}
            </>
          }
        />

        {!data ? <Spinner /> : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Active Subscriptions" value={s.active ?? 0} icon={<Users size={26} />} hint={`${s.activeNew || 0} new this month`} />
              <KpiCard label="Trial Users" value={s.trial ?? 0} icon={<CirclePlay size={26} />} tone="amber" />
              <KpiCard label="Cancelled" value={s.cancelled ?? 0} icon={<CircleX size={26} />} tone="red" hint={s.pastDue ? `${s.pastDue} past due` : undefined} />
              <KpiCard label="MRR" value={fmtShort(s.mrr)} icon={<IndianRupee size={26} />} tone="green" delta={s.mrrChange} hint={undefined} />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <Card className="lg:col-span-2" title="Subscription Growth" subtitle="Last 8 months">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.growth}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="active" name="Active" stroke="#7c3aed" strokeWidth={2.5} />
                      <Line type="monotone" dataKey="churned" name="Churned" stroke="#ef4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="new" name="New" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card title="Plan Distribution">
                <DonutList rows={data.planDistribution.map((p) => ({ name: p.name, value: p.count }))} format={(v) => v} />
              </Card>
            </div>

            <Card title="Churn Rate Analysis">
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.growth}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis unit="%" />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Line type="monotone" dataKey="churnRate" name="Churn rate" stroke="#ef4444" strokeWidth={2.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-slate-500">Current Churn Rate</p>
                    <p className="mt-1 text-4xl font-bold text-red-500">{c.current || 0}%</p>
                    <p className={`mt-1 text-sm ${c.change <= 0 ? "text-emerald-600" : "text-red-600"}`}>{c.change > 0 ? "+" : ""}{c.change || 0}% vs last month</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-slate-500">Avg. Lifetime</p>
                    <p className="mt-1 text-4xl font-bold text-slate-900">{c.avgLifetimeMonths || 0} mo</p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col lg:flex-row lg:items-center gap-4">
              <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search customer..." />
              <SelectBox value={plan} onChange={(v) => { setPlan(v); setPage(1); }} className="lg:w-56">
                <option value="">All Plans</option>
                {planNames.map((n) => <option key={n}>{n}</option>)}
              </SelectBox>
              <SelectBox value={status} onChange={(v) => { setStatus(v); setPage(1); }} className="lg:w-56">
                <option value="">All Statuses</option>
                {SUBSCRIPTION_STATUSES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
              </SelectBox>
              <GhostButton onClick={clear}><Filter size={16} /> Clear</GhostButton>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">All Subscriptions ({filtered.length})</div>
              {filtered.length === 0 ? <EmptyState>No subscriptions found.</EmptyState> : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-250 text-left">
                      <thead><tr className={THEAD}>
                        <th className="p-4">Customer</th><th className="p-4">Plan</th><th className="p-4">Amount</th><th className="p-4">Billing Cycle</th><th className="p-4">Start Date</th><th className="p-4">Next Billing</th><th className="p-4">Status</th>{canManage && <th className="p-4" />}
                      </tr></thead>
                      <tbody>
                        {rows.map((x) => (
                          <tr key={x._id} className={TROW}>
                            <td className="p-4 font-semibold text-slate-900">{x.customerName}</td>
                            <td className="p-4"><Badge className="bg-violet-100 text-violet-700">{x.planName}</Badge></td>
                            <td className="p-4 font-semibold">{fmtMoney(x.amount)}<span className="text-slate-400 font-normal">/{x.billingCycle === "YEARLY" ? "yr" : "mo"}</span></td>
                            <td className="p-4 text-slate-600">{x.billingCycle === "YEARLY" ? "Yearly" : "Monthly"}</td>
                            <td className="p-4 text-slate-600 whitespace-nowrap">{fmtDate(x.startDate)}</td>
                            <td className="p-4 text-slate-600 whitespace-nowrap">{x.status === "CANCELLED" ? "-" : fmtDate(x.nextBilling)}</td>
                            <td className="p-4">
                              {canManage ? (
                                <select value={x.status} onChange={(e) => changeStatus(x, e.target.value)} className={`rounded-md px-2.5 py-1 text-xs font-medium border-0 outline-none cursor-pointer ${subscriptionStatusMeta(x.status).badge}`}>
                                  {SUBSCRIPTION_STATUSES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
                                </select>
                              ) : <Badge className={subscriptionStatusMeta(x.status).badge}>{subscriptionStatusMeta(x.status).label}</Badge>}
                            </td>
                            {canManage && (
                              <td className="p-4"><div className="flex gap-2">
                                <IconButton onClick={() => openEdit(x)} aria-label="Edit"><Pencil size={15} /></IconButton>
                                <IconButton tone="danger" onClick={() => setToDelete(x)} aria-label="Delete"><Trash2 size={15} /></IconButton>
                              </div></td>
                            )}
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

      <Modal
        open={open}
        title={editing ? "Edit Subscription" : "Add Subscription"}
        onClose={() => setOpen(false)}
        footer={<><GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton><PrimaryButton disabled={saving} onClick={save}>{editing ? "Save Changes" : "Add Subscription"}</PrimaryButton></>}
      >
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Client">
              <select value={form.client} onChange={chooseClient} className={inputClass}>
                <option value="">Other (type a name)</option>
                {options.clients.map((cl) => <option key={cl._id} value={cl._id}>{cl.companyName}</option>)}
              </select>
            </Field>
            <Field label="Customer name" required><input value={form.customerName} onChange={set("customerName")} className={inputClass} /></Field>
            <Field label="Plan" required hint={options.plans.length ? undefined : "No plans yet. Add them in Plans & Pricing."}>
              <select value={form.plan} onChange={(e) => choosePlan(e.target.value)} className={inputClass}>
                <option value="">{options.plans.length ? "Select plan" : "Custom plan"}</option>
                {options.plans.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </Field>
            {!form.plan && <Field label="Plan name" required><input value={form.planName} onChange={set("planName")} className={inputClass} /></Field>}
            <Field label="Billing cycle">
              <select value={form.billingCycle} onChange={(e) => (form.plan ? choosePlan(form.plan, e.target.value) : set("billingCycle")(e))} className={inputClass}>
                <option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option>
              </select>
            </Field>
            <Field label="Amount per cycle (₹)" required><input type="number" min="0" value={form.amount} onChange={set("amount")} className={inputClass} /></Field>
            <Field label="Start date" required><input type="date" value={form.startDate} onChange={set("startDate")} className={inputClass} /></Field>
            <Field label="Next billing" hint="Leave empty to calculate it"><input type="date" value={form.nextBilling} onChange={set("nextBilling")} className={inputClass} /></Field>
            <Field label="Status">
              <select value={form.status} onChange={set("status")} className={inputClass}>
                {SUBSCRIPTION_STATUSES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes"><textarea rows={2} value={form.notes} onChange={set("notes")} className={inputClass} /></Field>
        </div>
      </Modal>

      <Modal center
        open={!!toDelete}
        title="Delete subscription"
        onClose={() => setToDelete(null)}
        footer={<><GhostButton onClick={() => setToDelete(null)}>Cancel</GhostButton><DangerButton onClick={remove}>Delete</DangerButton></>}
      >
        <p className="text-slate-600">Delete the <strong>{toDelete?.planName}</strong> subscription of {toDelete?.customerName}? To keep it in churn numbers, set it to Cancelled instead.</p>
      </Modal>
    </Layout>
  );
}
