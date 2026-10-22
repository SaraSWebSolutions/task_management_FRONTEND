import { useCallback, useEffect, useState } from "react";
import { Plus, Download, Banknote, PieChart as PieIcon, TriangleAlert, ShieldCheck, Pencil, Trash2, FileText, Wallet, Upload } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Card, Badge, Spinner, EmptyState, Modal, Field, PrimaryButton, GhostButton, DangerButton, IconButton, Pagination, SearchBox, inputClass } from "../components/ui";
import { KpiCard, DonutList, YearSelect, SelectBox } from "../components/finance/bits";
import { moneyTick, apiError, THEAD, TROW } from "../components/finance/helpers";
import { EXPENSE_CATEGORIES, EXPENSE_STATUSES, expenseStatusMeta } from "../constants/finance";
import { fmtDate, fmtMoney, fmtShort, downloadCsv, toDateInput } from "../utils/format";
import { can, homePath } from "../utils/permissions";

const PER_PAGE = 10;
const MAX_FILE = 5 * 1024 * 1024;
const empty = { date: toDateInput(new Date()), category: "", description: "", amount: "", taxAmount: "", status: "PENDING", receipt: "", receiptName: "" };

export default function FinanceExpenses() {
  const canManage = can("expenses.manage");

  const [year, setYear] = useState(null);
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budgets, setBudgets] = useState({});

  const load = useCallback(async () => {
    try {
      const res = await api.get("/finance/expenses", { params: year ? { year } : {} });
      setData(res.data);
    } catch {
      toast.error("Failed to load expenses");
      setData({ expenses: [], stats: {}, categories: [], monthly: [], years: [] });
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openAdd = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (e) => {
    setEditing(e);
    setForm({ date: toDateInput(e.date), category: e.category, description: e.description, amount: e.amount, taxAmount: e.taxAmount || "", status: e.status, receipt: "", receiptName: e.receiptName || "" });
    setOpen(true);
  };

  const pickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE) { toast.error("File is too large (max 5 MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, receipt: reader.result, receiptName: file.name }));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.date) return toast.error("Select a date");
    if (!form.category) return toast.error("Select a category");
    if (!form.description.trim()) return toast.error("Enter a description");
    if (!(Number(form.amount) > 0)) return toast.error("Enter a valid amount");
    try {
      setSaving(true);
      const body = { ...form, amount: Number(form.amount), taxAmount: Number(form.taxAmount) || 0 };
      if (!body.receipt) { delete body.receipt; delete body.receiptName; }
      if (editing) await api.put(`/finance/expenses/${editing._id}`, body);
      else await api.post("/finance/expenses", body);
      toast.success(editing ? "Expense updated" : "Expense added");
      setOpen(false);
      load();
    } catch (error) {
      toast.error(apiError(error, "Failed to save expense"));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (e, value) => {
    try {
      await api.patch(`/finance/expenses/${e._id}/status`, { status: value });
      load();
    } catch (error) {
      toast.error(apiError(error, "Failed to update status"));
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/finance/expenses/${toDelete._id}`);
      toast.success("Expense deleted");
      setToDelete(null);
      load();
    } catch (error) {
      toast.error(apiError(error, "Failed to delete"));
    }
  };

  const viewReceipt = async (e) => {
    try {
      const { data: r } = await api.get(`/finance/expenses/${e._id}/receipt`);
      const a = document.createElement("a");
      a.href = r.receipt;
      a.target = "_blank";
      a.download = r.receiptName || "receipt";
      a.rel = "noopener";
      a.click();
    } catch (error) {
      toast.error(apiError(error, "Receipt not available"));
    }
  };

  const openBudgets = () => {
    setBudgets(Object.fromEntries(data.categories.map((c) => [c.category, c.monthly || ""])));
    setBudgetOpen(true);
  };

  const saveBudgets = async () => {
    try {
      setSaving(true);
      await api.put("/finance/expenses/budgets", { budgets });
      toast.success("Budgets saved");
      setBudgetOpen(false);
      load();
    } catch (error) {
      toast.error(apiError(error, "Failed to save budgets"));
    } finally {
      setSaving(false);
    }
  };

  const q = search.trim().toLowerCase();
  const all = data?.expenses || [];
  const filtered = all.filter(
    (e) => (!q || e.description.toLowerCase().includes(q)) && (!category || e.category === category) && (!status || e.status === status),
  );
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const filteredTotal = filtered.filter((e) => e.status !== "REJECTED").reduce((s, e) => s + e.amount, 0);
  const s = data?.stats || {};

  const exportCsv = () =>
    downloadCsv("expenses.csv", [
      ["Date", "Category", "Description", "Amount", "GST paid", "Status"],
      ...filtered.map((e) => [fmtDate(e.date), e.category, e.description, e.amount, e.taxAmount || 0, e.status]),
    ]);

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Expenses"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Finance" }, { label: "Expenses" }]}
          actions={
            <>
              {data && <YearSelect years={data.years} value={data.year} onChange={setYear} />}
              <GhostButton onClick={exportCsv} disabled={!filtered.length}><Download size={18} /> Export</GhostButton>
              {canManage && <GhostButton onClick={openBudgets} disabled={!data}><Wallet size={18} /> Budgets</GhostButton>}
              {canManage && <PrimaryButton onClick={openAdd}><Plus size={18} /> Add Expense</PrimaryButton>}
            </>
          }
        />

        {!data ? <Spinner /> : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label={`Total Expenses (${data.year})`} value={fmtShort(s.total)} icon={<Banknote size={26} />} delta={s.totalChange} goodWhenDown suffix="vs last year" />
              <KpiCard label="Budget Used" value={s.hasBudget ? `${s.budgetUsed}%` : "-"} icon={<PieIcon size={26} />} tone="amber" hint={s.hasBudget ? "Year to date vs monthly budgets" : "Set monthly budgets to track this"} />
              <KpiCard label="Over Budget" value={s.hasBudget ? fmtShort(s.overBudget) : "-"} icon={<TriangleAlert size={26} />} tone="red" hint="Categories above their budget" />
              <KpiCard label="Savings" value={s.hasBudget ? fmtShort(s.savings) : "-"} icon={<ShieldCheck size={26} />} tone="green" hint={s.pending ? `${fmtShort(s.pending)} still pending approval` : undefined} />
            </div>

            <div className="grid gap-5 lg:grid-cols-5">
              <Card className="lg:col-span-2" title="Expense Categories">
                <DonutList rows={data.categories.filter((c) => c.actual > 0).map((c) => ({ name: c.category, value: c.actual }))} empty="No expenses in this year." />
              </Card>
              <Card className="lg:col-span-3" title="Budget vs Actual (Monthly)">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthly}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={moneyTick} width={70} />
                      <Tooltip formatter={(v) => fmtMoney(v)} />
                      <Legend />
                      <Bar dataKey="actual" name="Actual" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                      {s.hasBudget && <Bar dataKey="budget" name="Budget" fill="#e2e8f0" radius={[4, 4, 0, 0]} />}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col lg:flex-row lg:items-center gap-4">
              <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search expenses..." />
              <SelectBox value={category} onChange={(v) => { setCategory(v); setPage(1); }} className="lg:w-60">
                <option value="">All Categories</option>
                {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </SelectBox>
              <SelectBox value={status} onChange={(v) => { setStatus(v); setPage(1); }} className="lg:w-52">
                <option value="">All Statuses</option>
                {EXPENSE_STATUSES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
              </SelectBox>
              <p className="text-slate-500 whitespace-nowrap">Total: <strong className="text-slate-900">{fmtMoney(filteredTotal)}</strong></p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Expense Records ({filtered.length})</div>
              {filtered.length === 0 ? <EmptyState>No expenses found.</EmptyState> : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-225 text-left">
                      <thead><tr className={THEAD}>
                        <th className="p-4">Date</th><th className="p-4">Category</th><th className="p-4">Description</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Receipt</th>{canManage && <th className="p-4" />}
                      </tr></thead>
                      <tbody>
                        {rows.map((e) => (
                          <tr key={e._id} className={TROW}>
                            <td className="p-4 text-slate-600 whitespace-nowrap">{fmtDate(e.date)}</td>
                            <td className="p-4"><Badge className="bg-cyan-50 text-cyan-700">{e.category}</Badge></td>
                            <td className="p-4 font-medium text-slate-900">{e.description}</td>
                            <td className="p-4 font-semibold">{fmtMoney(e.amount)}{e.taxAmount > 0 && <span className="block text-xs font-normal text-slate-400">incl. GST {fmtMoney(e.taxAmount)}</span>}</td>
                            <td className="p-4">
                              {canManage ? (
                                <select value={e.status} onChange={(ev) => changeStatus(e, ev.target.value)} className={`rounded-md px-2.5 py-1 text-xs font-medium border-0 outline-none cursor-pointer ${expenseStatusMeta(e.status).badge}`}>
                                  {EXPENSE_STATUSES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
                                </select>
                              ) : <Badge className={expenseStatusMeta(e.status).badge}>{expenseStatusMeta(e.status).label}</Badge>}
                            </td>
                            <td className="p-4">
                              {e.hasReceipt ? <GhostButton className="!px-3 !py-1.5 text-sm" onClick={() => viewReceipt(e)}><FileText size={14} /> View</GhostButton> : <span className="text-slate-400">-</span>}
                            </td>
                            {canManage && (
                              <td className="p-4"><div className="flex gap-2">
                                <IconButton onClick={() => openEdit(e)} aria-label="Edit"><Pencil size={15} /></IconButton>
                                <IconButton tone="danger" onClick={() => setToDelete(e)} aria-label="Delete"><Trash2 size={15} /></IconButton>
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
        title={editing ? "Edit Expense" : "Add New Expense"}
        onClose={() => setOpen(false)}
        footer={<><GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton><PrimaryButton disabled={saving} onClick={save}>{editing ? "Save Changes" : "Add Expense"}</PrimaryButton></>}
      >
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Date" required><input type="date" value={form.date} onChange={set("date")} className={inputClass} /></Field>
            <Field label="Category" required>
              <select value={form.category} onChange={set("category")} className={inputClass}>
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description" required><input value={form.description} onChange={set("description")} placeholder="Expense description" className={inputClass} /></Field>
          <div className="grid sm:grid-cols-3 gap-5">
            <Field label="Amount (₹)" required hint="Total paid"><input type="number" min="0" step="0.01" value={form.amount} onChange={set("amount")} placeholder="0.00" className={inputClass} /></Field>
            <Field label="GST included (₹)" hint="Counted as tax credit"><input type="number" min="0" step="0.01" value={form.taxAmount} onChange={set("taxAmount")} placeholder="0.00" className={inputClass} /></Field>
            <Field label="Status">
              <select value={form.status} onChange={set("status")} className={inputClass}>
                {EXPENSE_STATUSES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Receipt" hint="Image or PDF, max 5 MB">
            <label className={`${inputClass} flex items-center gap-3 cursor-pointer`}>
              <Upload size={18} className="text-slate-400" />
              <span className="truncate text-slate-600">{form.receiptName || "Choose file"}</span>
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={pickFile} />
            </label>
          </Field>
        </div>
      </Modal>

      <Modal
        open={budgetOpen}
        title="Monthly Budgets"
        onClose={() => setBudgetOpen(false)}
        footer={<><GhostButton onClick={() => setBudgetOpen(false)}>Cancel</GhostButton><PrimaryButton disabled={saving} onClick={saveBudgets}>Save Budgets</PrimaryButton></>}
      >
        <p className="text-sm text-slate-500 mb-4">Amount you plan to spend per month in each category. Leave empty for no budget.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {EXPENSE_CATEGORIES.map((c) => (
            <Field key={c} label={c}>
              <input type="number" min="0" value={budgets[c] ?? ""} onChange={(e) => setBudgets((b) => ({ ...b, [c]: e.target.value }))} placeholder="0" className={inputClass} />
            </Field>
          ))}
        </div>
      </Modal>

      <Modal
        open={!!toDelete}
        title="Delete expense"
        onClose={() => setToDelete(null)}
        footer={<><GhostButton onClick={() => setToDelete(null)}>Cancel</GhostButton><DangerButton onClick={remove}>Delete</DangerButton></>}
      >
        <p className="text-slate-600">Delete <strong>{toDelete?.description}</strong> ({fmtMoney(toDelete?.amount)})?</p>
      </Modal>
    </Layout>
  );
}
