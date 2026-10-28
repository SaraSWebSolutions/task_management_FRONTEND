import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import Layout from "../components/Layout";
import api from "../api/axios";
import toast from "react-hot-toast";
import { can } from "../utils/permissions";
import { money } from "./Projects";
import { LEAD_SOURCES, sourceLabel } from "../constants/leadSources";

const input =
  "w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand";
const primaryBtn =
  "rounded-xl bg-brand px-5 py-2.5 text-white transition hover:bg-brand-hover disabled:opacity-60";

const thisMonth = () => new Date().toISOString().slice(0, 7);
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      {children}
    </div>
  );
}

function Kpi({ label, value, hint }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

const FUNNEL = [
  { key: "followers", label: "Followers" },
  { key: "enquiries", label: "Enquiries" },
  { key: "finalized", label: "Finalized leads" },
  { key: "signed", label: "Signed" },
];

export default function ReportDashboard() {
  const canManage = can("reports.manage");
  const [month, setMonth] = useState(thisMonth());
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
      const res = await api.get("/reports/dashboard", { params: { month } });
      setData(res.data);
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
  }, [month]);

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

  if (!data || !settings)
    return (
      <Layout>
        <p className="text-center text-slate-500 mt-20">Loading...</p>
      </Layout>
    );

  const { expense: ex, required, actual, funnel, sources } = data;
  const target = data.settings.target;

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        <div className="bg-white rounded-3xl border shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Target dashboard</h1>
            <p className="text-slate-500 mt-1">Expense, target value and lead funnel</p>
          </div>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        {/* Expense and target value */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Kpi
            label="Total expense"
            value={money(ex.total)}
            hint={`Spend ${money(ex.manual)} · Demo ${money(ex.demo)} · Marketing time ${money(ex.marketingTime)}`}
          />
          <Kpi
            label={`Required revenue (+${data.settings.marginPercent}%)`}
            value={money(required.revenue)}
            hint="Total expense plus margin"
          />
          <Kpi
            label="Average value per signed deal needed"
            value={money(required.perDeal)}
            hint={`Required revenue ÷ ${target.signed} signed target`}
          />
          <Kpi
            label="Revenue achieved"
            value={money(actual.revenue)}
            hint={`${pct(actual.revenue, required.revenue)}% of required · ${actual.signed} signed · avg ${money(actual.avgDeal)}`}
          />
        </div>

        {/* Funnel */}
        <Card title="Funnel: actual vs target">
          <div className="space-y-4">
            {FUNNEL.map((f, i) => {
              const actualValue = funnel[f.key];
              const targetValue = target[f.key];
              const prev = i > 0 ? funnel[FUNNEL[i - 1].key] : null;
              return (
                <div key={f.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">
                      {f.label}
                      {prev !== null && (
                        <span className="text-slate-400 font-normal">
                          {" "}
                          · {pct(actualValue, prev)}% of {FUNNEL[i - 1].label.toLowerCase()}
                        </span>
                      )}
                    </span>
                    <span className="text-slate-600">
                      {actualValue} / {targetValue}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${Math.min(100, pct(actualValue, targetValue))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400">
            Enquiries = leads created this month. Finalized = those converted to sales or
            project. Signed = those converted to a project.
          </p>
        </Card>

        {/* By source */}
        <Card title="By source">
          <div className="overflow-x-auto">
            <table className="min-w-150 w-full text-sm">
              <thead>
                <tr className="bg-slate-100 font-semibold">
                  <th className="p-3 text-left">Source</th>
                  <th className="p-3 text-center">Followers</th>
                  <th className="p-3 text-center">Enquiries</th>
                  <th className="p-3 text-center">Finalized</th>
                  <th className="p-3 text-center">Signed</th>
                  <th className="p-3 text-center">Signed / followers</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.source} className="border-t">
                    <td className="p-3 font-medium">{sourceLabel(s.source)}</td>
                    <td className="p-3 text-center">{s.followers}</td>
                    <td className="p-3 text-center">{s.enquiries}</td>
                    <td className="p-3 text-center">{s.finalized}</td>
                    <td className="p-3 text-center">{s.signed}</td>
                    <td className="p-3 text-center">{pct(s.signed, s.followers)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Targets + followers */}
        {canManage && (
        <Card title="Targets and followers for this month">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <label className="text-sm font-medium text-slate-700">
              Margin %
              <input type="number" min="0" value={settings.marginPercent}
                onChange={(e) => setSettings((s) => ({ ...s, marginPercent: e.target.value }))}
                className={`${input} mt-2`} />
            </label>
            {FUNNEL.map((f) => (
              <label key={f.key} className="text-sm font-medium text-slate-700">
                Target {f.label.toLowerCase()}
                <input type="number" min="0" value={settings.target[f.key]}
                  onChange={setTarget(f.key)} className={`${input} mt-2`} />
              </label>
            ))}
          </div>

          <p className="text-sm font-medium text-slate-700">Followers gained</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {LEAD_SOURCES.map((s) => (
              <label key={s.value} className="text-sm text-slate-600">
                {s.label}
                <input type="number" min="0" value={settings.followers[s.value] ?? 0}
                  onChange={setFollowers(s.value)} className={`${input} mt-2`} />
              </label>
            ))}
          </div>

          <button disabled={saving} className={primaryBtn}
            onClick={() => run(() => api.put(`/reports/settings/${month}`, settings), "Targets saved")}>
            Save
          </button>
        </Card>
        )}

        {/* Expenses */}
        <Card title="Marketing spend">
          {canManage && (
          <div className="grid sm:grid-cols-[9rem_10rem_8rem_1fr_auto] gap-3">
            <input type="date" value={expense.date}
              onChange={(e) => setExpense((x) => ({ ...x, date: e.target.value }))} className={input} />
            <select value={expense.source}
              onChange={(e) => setExpense((x) => ({ ...x, source: e.target.value }))} className={input}>
              {LEAD_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <input type="number" min="0" placeholder="Amount" value={expense.amount}
              onChange={(e) => setExpense((x) => ({ ...x, amount: e.target.value }))} className={input} />
            <input placeholder="Note (membership, stall, ads...)" value={expense.note}
              onChange={(e) => setExpense((x) => ({ ...x, note: e.target.value }))} className={input} />
            <button disabled={saving} className={primaryBtn}
              onClick={() => {
                if (expense.amount === "" || Number(expense.amount) < 0)
                  return toast.error("Enter the amount");
                run(async () => {
                  await api.post("/reports/expenses", expense);
                  setExpense((x) => ({ ...x, amount: "", note: "" }));
                }, "Expense added");
              }}>
              Add
            </button>
          </div>
          )}

          {data.expenses.length > 0 && (
            <table className="w-full text-sm">
              <tbody>
                {data.expenses.map((e) => (
                  <tr key={e._id} className="border-t">
                    <td className="p-3">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="p-3">{sourceLabel(e.source)}</td>
                    <td className="p-3 text-slate-600">{e.note || "-"}</td>
                    <td className="p-3 text-right font-medium">{money(e.amount)}</td>
                    <td className="p-3 text-center w-14">
                      {canManage && <button
                        onClick={() => {
                          if (window.confirm("Delete this expense?"))
                            run(() => api.delete(`/reports/expenses/${e._id}`), "Expense deleted");
                        }}
                        className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50">
                        <Trash2 size={15} />
                      </button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </Layout>
  );
}
