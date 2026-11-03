import { useEffect, useState } from "react";
import { Trash2, Target, TrendingUp, Flag, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Card, Spinner, EmptyState, Field, inputClass, PrimaryButton, IconButton } from "../components/ui";
import { KpiCard } from "../components/finance/bits";
import { THEAD, TROW, moneyTick } from "../components/finance/helpers";
import { Segmented } from "../components/analytics/parts";
import { can, homePath } from "../utils/permissions";
import { fmtMoney, fmtShort, fmtDate } from "../utils/format";
import { LEAD_SOURCES, sourceLabel } from "../constants/leadSources";

const thisMonth = () => new Date().toISOString().slice(0, 7);
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

// Sources shown on this dashboard (old "Event" leads are counted as Other)
const DASH_SOURCES = ["META", "BNI", "JUSTDIAL", "INDIAMART", "OTHER"];

const FUNNEL = [
  { key: "followers", label: "Followers" },
  { key: "enquiries", label: "Enquiries" },
  { key: "finalized", label: "Finalized leads" },
  { key: "signed", label: "Signed" },
];

const selectClass = `${inputClass} w-auto`;

export default function ReportDashboard() {
  const canManage = can("reports.manage");
  const [month, setMonth] = useState(thisMonth());
  const [view, setView] = useState("monthly"); // monthly | yearly
  const [bizType, setBizType] = useState("PRODUCT"); // PRODUCT | SERVICE
  const [config, setConfig] = useState({ yearlyTarget: "", website: "", crm: "" });
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expense, setExpense] = useState({
    date: new Date().toISOString().slice(0, 10),
    source: "META",
    amount: "",
    note: "",
  });

  const load = async () => {
    try {
      const res = await api.get("/reports/dashboard", { params: { month, view } });
      setData(res.data);
      const svc = Object.fromEntries(res.data.pricing.services.map((x) => [x.key, x.price]));
      setConfig({
        yearlyTarget: res.data.target.yearly,
        website: svc.website ?? 0,
        crm: svc.crm ?? 0,
      });
      const s = res.data.settings;
      setSettings({
        marginPercent: s.marginPercent,
        target: { ...s.target },
        followers: { ...s.followers },
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load dashboard");
    }
  };

  useEffect(() => {
    if (month) load();
  }, [month, view]);

  const run = async (fn, success) => {
    try {
      setSaving(true);
      await fn();
      toast.success(success);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const setTarget = (k) => (e) =>
    setSettings((s) => ({ ...s, target: { ...s.target, [k]: e.target.value } }));
  const setFollowers = (k) => (e) =>
    setSettings((s) => ({ ...s, followers: { ...s.followers, [k]: e.target.value } }));

  const crumbs = [{ label: "Home", to: homePath() }, { label: "Reports" }, { label: "Target Dashboard" }];

  if (!data || !settings)
    return (
      <Layout>
        <PageHeader title="Target Dashboard" breadcrumbs={crumbs} />
        <Spinner />
      </Layout>
    );

  const { expense: ex, required, actual, funnel, sources, target: tgt, pricing } = data;
  const target = data.settings.target;
  const yearly = view === "yearly";
  const periodName = yearly ? data.year : data.month;
  const vsText = yearly ? "vs last year" : "vs last month";
  const remaining = Math.max(0, tgt.period - actual.revenue);
  const sourceRows = Object.fromEntries(sources.map((s) => [s.source, s]));
  const revChange = actual.prevRevenue > 0
    ? Math.round(((actual.revenue - actual.prevRevenue) / actual.prevRevenue) * 100)
    : undefined;

  const chartData = DASH_SOURCES.map((key) => ({
    name: sourceLabel(key),
    current: sourceRows[key]?.revenue || 0,
    previous: sourceRows[key]?.prevRevenue || 0,
  }));

  // Items we can sell, with the price that matches the selected view
  const sellItems =
    bizType === "PRODUCT"
      ? pricing.products.map((p) => ({
          key: p.id,
          name: `${p.name} plan`,
          price: yearly ? p.yearlyPrice : p.monthlyPrice,
          unit: yearly ? "/ year" : "/ month",
        }))
      : pricing.services.map((s) => ({ key: s.key, name: s.name, price: s.price, unit: "per project" }));

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        <PageHeader title="Target Dashboard" breadcrumbs={crumbs} />
        <p className="text-sm text-slate-500 -mt-2">
          Yearly target, monthly split, source wise revenue and lead funnel. Changes compare with the previous {yearly ? "year" : "month"}.
        </p>

        {/* View + period filter */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col lg:flex-row lg:items-end gap-4">
          <div>
            <span className="block text-sm font-semibold text-slate-800 mb-1.5">View</span>
            <Segmented
              value={view}
              onChange={setView}
              options={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" }]}
            />
          </div>
          <label className="block">
            <span className="block text-sm font-semibold text-slate-800 mb-1.5">{yearly ? "Year" : "Month"}</span>
            {yearly ? (
              <input
                type="number"
                min="2000"
                max="2100"
                value={data.year}
                onChange={(e) => {
                  const y = e.target.value;
                  if (/^\d{4}$/.test(y)) setMonth(`${y}-${month.slice(5)}`);
                }}
                className={selectClass}
              />
            ) : (
              <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className={selectClass} />
            )}
          </label>
        </div>

        {/* Target value */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label={yearly ? `Yearly Target (${data.year})` : `Monthly Target (${data.month})`}
            value={fmtShort(tgt.period)}
            icon={<Target size={26} />}
            hint={yearly ? `Monthly split ${fmtMoney(tgt.monthly)}` : `Yearly ${fmtMoney(tgt.yearly)} ÷ 12`}
          />
          <KpiCard
            label="Revenue Achieved"
            value={fmtShort(actual.revenue)}
            icon={<TrendingUp size={26} />}
            tone="green"
            delta={revChange}
            suffix={vsText}
            hint={`${pct(actual.revenue, tgt.period)}% of target · ${actual.signed} signed`}
          />
          <KpiCard
            label="Remaining to Target"
            value={fmtShort(remaining)}
            icon={<Flag size={26} />}
            tone="amber"
            hint={tgt.period > 0 && remaining === 0 ? "Target reached 🎉" : "Target minus achieved"}
          />
          <KpiCard
            label={`Required Revenue (+${data.settings.marginPercent}%)`}
            value={fmtShort(required.revenue)}
            icon={<Wallet size={26} />}
            tone="cyan"
            hint={`Expense ${fmtMoney(ex.total)} · Spend ${fmtShort(ex.manual)} · Demo ${fmtShort(ex.demo)} · Time ${fmtShort(ex.marketingTime)}`}
          />
        </div>

        {/* Revenue by source */}
        <Card title={`Revenue by Source · ${periodName}`} subtitle="Red = earned less than the previous period, green = earned more.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {DASH_SOURCES.map((key) => {
              const r = sourceRows[key] || { revenue: 0, prevRevenue: 0, trend: "SAME", changePercent: null };
              const down = r.trend === "DOWN";
              const up = r.trend === "UP";
              return (
                <div
                  key={key}
                  className={`rounded-2xl border p-4 text-left ${
                    down ? "border-red-200 bg-red-50" : up ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-600">{sourceLabel(key)}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{fmtShort(r.revenue)}</p>
                  <p className="text-xs text-slate-500 mt-1">{data.prevLabel}: {fmtShort(r.prevRevenue)}</p>
                  {(down || up) && (
                    <p className={`text-xs font-semibold mt-2 ${down ? "text-red-600" : "text-emerald-600"}`}>
                      {down ? "▼" : "▲"} {r.changePercent !== null ? `${Math.abs(r.changePercent)}% ` : ""}
                      {down ? "lower" : "higher"} {vsText}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="h-72 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={moneyTick} width={70} />
                <Tooltip formatter={(v) => fmtMoney(v)} />
                <Legend />
                <Bar dataKey="previous" name={data.prevLabel} fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="current" name={periodName} fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Revenue = value of projects created from leads of that source.
          </p>
        </Card>

        {/* What we need to sell */}
        <Card
          title="Deals Needed to Reach the Target"
          subtitle={`Remaining target ${fmtMoney(remaining)}`}
          action={
            <select value={bizType} onChange={(e) => setBizType(e.target.value)} className={selectClass}>
              <option value="PRODUCT">Product (software plans)</option>
              <option value="SERVICE">Service (website / CRM)</option>
            </select>
          }
        >
          {sellItems.length === 0 ? (
            <EmptyState>No plans added yet. Add them in Finance → Plans.</EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sellItems.map((it) => (
                <div key={it.key} className="rounded-2xl border border-slate-200 p-4 text-left">
                  <p className="text-sm font-semibold text-slate-600">{it.name}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {fmtMoney(it.price)} <span className="text-xs font-normal text-slate-400">{it.unit}</span>
                  </p>
                  <p className="mt-3 inline-flex rounded-md bg-violet-50 px-2.5 py-1 text-sm font-medium text-brand">
                    {tgt.period <= 0
                      ? "Set the yearly target first"
                      : it.price <= 0
                        ? "Set the price first"
                        : remaining === 0
                          ? "Target reached"
                          : `${Math.ceil(remaining / it.price)} sales needed`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Funnel */}
        <Card title="Funnel: Actual vs Target">
          <div className="space-y-5">
            {FUNNEL.map((f, i) => {
              const actualValue = funnel[f.key];
              const targetValue = target[f.key] * tgt.funnelFactor;
              const prev = i > 0 ? funnel[FUNNEL[i - 1].key] : null;
              return (
                <div key={f.key}>
                  <div className="flex justify-between gap-3 text-sm mb-1.5">
                    <span className="font-medium text-slate-700">
                      {f.label}
                      {prev !== null && (
                        <span className="ml-2 text-slate-400 font-normal">
                          {pct(actualValue, prev)}% of {FUNNEL[i - 1].label.toLowerCase()}
                        </span>
                      )}
                    </span>
                    <span className="text-slate-500">{actualValue} / {targetValue}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${Math.min(100, pct(actualValue, targetValue))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Enquiries = leads created in this {yearly ? "year" : "month"}. Finalized = those converted to sales or
            project. Signed = those converted to a project.
          </p>
        </Card>

        {/* By source table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <span className="text-lg font-semibold text-slate-900">By Source</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-175 text-left">
              <thead>
                <tr className={THEAD}>
                  <th className="p-4">Source</th>
                  <th className="p-4">Followers</th>
                  <th className="p-4">Enquiries</th>
                  <th className="p-4">Finalized</th>
                  <th className="p-4">Signed</th>
                  <th className="p-4">Signed / Followers</th>
                  <th className="p-4 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {DASH_SOURCES.map((key) => sourceRows[key]).filter(Boolean).map((s) => (
                  <tr key={s.source} className={TROW}>
                    <td className="p-4 font-semibold text-slate-900">{sourceLabel(s.source)}</td>
                    <td className="p-4">{s.followers}</td>
                    <td className="p-4">{s.enquiries}</td>
                    <td className="p-4">{s.finalized}</td>
                    <td className="p-4">{s.signed}</td>
                    <td className="p-4">{pct(s.signed, s.followers)}%</td>
                    <td className="p-4 text-right font-semibold">{fmtMoney(s.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Yearly target + service prices */}
        {canManage && (
          <Card title={`Yearly Target and Service Prices · ${data.year}`}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Yearly target (₹)" hint={`Monthly = ${fmtMoney((Number(config.yearlyTarget) || 0) / 12)}`}>
                <input type="number" min="0" value={config.yearlyTarget} placeholder="e.g. 5000000"
                  onChange={(e) => setConfig((c) => ({ ...c, yearlyTarget: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Website price (₹)">
                <input type="number" min="0" value={config.website}
                  onChange={(e) => setConfig((c) => ({ ...c, website: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="CRM price (₹)">
                <input type="number" min="0" value={config.crm}
                  onChange={(e) => setConfig((c) => ({ ...c, crm: e.target.value }))} className={inputClass} />
              </Field>
            </div>
            <p className="text-xs text-slate-400 mt-3">Product prices (Basic / Premium) are taken from Finance → Plans.</p>
            <PrimaryButton className="mt-4" disabled={saving}
              onClick={() =>
                run(() => api.put("/reports/config", {
                  year: data.year,
                  yearlyTarget: config.yearlyTarget,
                  services: { website: config.website, crm: config.crm },
                }), "Target saved")
              }>
              Save Target
            </PrimaryButton>
          </Card>
        )}

        {/* Monthly targets + followers */}
        {canManage && !yearly && (
          <Card title="Targets and Followers for this Month">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="Margin %">
                <input type="number" min="0" value={settings.marginPercent}
                  onChange={(e) => setSettings((s) => ({ ...s, marginPercent: e.target.value }))} className={inputClass} />
              </Field>
              {FUNNEL.map((f) => (
                <Field key={f.key} label={`Target ${f.label.toLowerCase()}`}>
                  <input type="number" min="0" value={settings.target[f.key]}
                    onChange={setTarget(f.key)} className={inputClass} />
                </Field>
              ))}
            </div>

            <p className="text-sm font-semibold text-slate-800 mt-6 mb-3 text-left">Followers gained</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {DASH_SOURCES.map((key) => (
                <Field key={key} label={sourceLabel(key)}>
                  <input type="number" min="0" value={settings.followers[key] ?? 0}
                    onChange={setFollowers(key)} className={inputClass} />
                </Field>
              ))}
            </div>

            <PrimaryButton className="mt-5" disabled={saving}
              onClick={() => run(() => api.put(`/reports/settings/${month}`, settings), "Targets saved")}>
              Save
            </PrimaryButton>
          </Card>
        )}

        {/* Expenses */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <span className="text-lg font-semibold text-slate-900">Marketing Spend · {periodName}</span>
          </div>

          {canManage && (
            <div className="grid gap-3 p-6 sm:grid-cols-[10rem_10rem_9rem_1fr_auto] border-b border-slate-100">
              <input type="date" value={expense.date}
                onChange={(e) => setExpense((x) => ({ ...x, date: e.target.value }))} className={inputClass} />
              <select value={expense.source}
                onChange={(e) => setExpense((x) => ({ ...x, source: e.target.value }))} className={inputClass}>
                {LEAD_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <input type="number" min="0" placeholder="Amount" value={expense.amount}
                onChange={(e) => setExpense((x) => ({ ...x, amount: e.target.value }))} className={inputClass} />
              <input placeholder="Note (membership, stall, ads...)" value={expense.note}
                onChange={(e) => setExpense((x) => ({ ...x, note: e.target.value }))} className={inputClass} />
              <PrimaryButton disabled={saving}
                onClick={() => {
                  if (expense.amount === "" || Number(expense.amount) < 0)
                    return toast.error("Enter the amount");
                  run(async () => {
                    await api.post("/reports/expenses", expense);
                    setExpense((x) => ({ ...x, amount: "", note: "" }));
                  }, "Expense added");
                }}>
                Add
              </PrimaryButton>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-left">
              <thead>
                <tr className={THEAD}>
                  <th className="p-4">Date</th>
                  <th className="p-4">Source</th>
                  <th className="p-4">Note</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {data.expenses.map((e) => (
                  <tr key={e._id} className={TROW}>
                    <td className="p-4">{fmtDate(e.date)}</td>
                    <td className="p-4">{sourceLabel(e.source)}</td>
                    <td className="p-4 text-slate-600">{e.note || "-"}</td>
                    <td className="p-4 text-right font-semibold">{fmtMoney(e.amount)}</td>
                    <td className="p-4">
                      {canManage && (
                        <IconButton
                          tone="danger"
                          aria-label="Delete expense"
                          onClick={() => {
                            if (window.confirm("Delete this expense?"))
                              run(() => api.delete(`/reports/expenses/${e._id}`), "Expense deleted");
                          }}
                        >
                          <Trash2 size={15} />
                        </IconButton>
                      )}
                    </td>
                  </tr>
                ))}
                {!data.expenses.length && (
                  <tr><td colSpan={5}><EmptyState>No marketing spend in this period.</EmptyState></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
