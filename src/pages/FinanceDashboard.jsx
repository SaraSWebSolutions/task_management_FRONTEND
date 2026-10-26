import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, Download, IndianRupee, Banknote, ChartColumn, FileText, ArrowDownLeft, ArrowUpRight, TrendingUp, CircleCheck, TriangleAlert, Landmark, CreditCard, Smartphone, Wallet } from "lucide-react";
import { ComposedChart, Line, Area, BarChart, Bar, Cell, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import Layout from "../components/Layout";
import api from "../api/axios";
import { Spinner, EmptyState, Badge, GhostButton, PrimaryButton } from "../components/ui";
import { SectionCard, Spark, MiniRing, DeltaPill } from "../components/dashboard/parts";
import { apiError, moneyTick } from "../components/finance/helpers";
import { CHART_COLORS, EXPENSE_CATEGORIES } from "../constants/finance";
import { fmtMoney, fmtShort, fmtDate, downloadCsv } from "../utils/format";
import { can } from "../utils/permissions";

const METHOD = { UPI: [Smartphone, "UPI"], BANK_TRANSFER: [Landmark, "Bank Transfer"], CARD: [CreditCard, "Card"], CASH: [Wallet, "Cash"], CHEQUE: [FileText, "Cheque"], OTHER: [Banknote, "Other"] };
const catColor = (c) => CHART_COLORS[Math.max(0, EXPENSE_CATEGORIES.indexOf(c)) % CHART_COLORS.length];

const Tabs = ({ value, onChange, options }) => (
  <div className="flex gap-2">{options.map(([k, l]) => <button key={k} onClick={() => onChange(k)} className={`px-4 py-1.5 rounded-lg border text-sm font-semibold ${value === k ? "bg-brand text-white border-brand" : "border-indigo-100 bg-indigo-50/40 text-indigo-700 hover:bg-indigo-50"}`}>{l}</button>)}</div>
);

export default function FinanceDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("monthly");
  const [quarter, setQuarter] = useState(null);
  const [spin, setSpin] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.get("/finance/dashboard");
      setData(d);
      setError("");
    } catch (e) {
      setError(apiError(e, "Failed to load the finance dashboard"));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => { setSpin(true); await load(); setSpin(false); };

  const wf = useMemo(() => {
    if (!data?.waterfall.length) return null;
    const q = data.waterfall.find((w) => w.quarter === (quarter ?? data.waterfall.at(-1).quarter)) || data.waterfall.at(-1);
    const s = q.steps;
    // each bar floats from where the last one ended
    const steps = [
      { name: "Revenue", delta: s.revenue, kind: "in" },
      { name: "GST collected", delta: -s.gst, kind: "out" },
      { name: "Team time", delta: -s.team, kind: "out" },
      { name: "Expenses", delta: -s.expenses, kind: "out" },
      { name: "GST credit", delta: s.credit, kind: "in" },
    ];
    let run = 0;
    const bars = steps.map((st) => {
      const from = run; run += st.delta;
      return { ...st, base: Math.min(from, run), size: Math.abs(st.delta), end: run };
    });
    bars.push({ name: "Net profit", delta: run, kind: "total", base: Math.min(0, run), size: Math.abs(run), end: run });
    return { quarter: q.quarter, bars, net: s.net };
  }, [data, quarter]);

  const exportReport = () => {
    const k = data.kpis;
    downloadCsv(`finance-dashboard-${data.year}.csv`, [
      ["Item", "This year (INR)", "Same time last year (INR)", "Change %"],
      ["Revenue received", k.revenue.value, k.revenue.prev, k.revenue.change],
      ["Expenses (incl. team time)", k.expenses.value, k.expenses.prev, k.expenses.change],
      ["Net profit (after GST)", k.net.value, k.net.prev, k.net.change],
      ["Pending invoices", k.pending.value, "", ""],
      [],
      ["Indicator", "Value", "Guide"],
      ...data.indicators.map((i) => [i.label, i.value == null ? "" : `${i.value}${i.unit}`, i.guide]),
    ]);
  };

  const Head = (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="text-left"><h1 className="text-3xl font-bold text-slate-900">Finance Dashboard</h1><p className="mt-1 text-slate-500">Home / Dashboard / <span className="text-brand">Finance</span></p></div>
      <div className="flex gap-3">
        <GhostButton onClick={refresh} disabled={spin}><RefreshCw size={18} className={spin ? "animate-spin" : ""} /> Refresh</GhostButton>
        <PrimaryButton onClick={exportReport} disabled={!data}><Download size={18} /> Export Report</PrimaryButton>
      </div>
    </div>
  );

  if (!data) return <Layout><div className="space-y-6">{Head}{error ? <SectionCard title="Something went wrong"><p className="text-slate-600">{error}</p></SectionCard> : <Spinner />}</div></Layout>;

  const k = data.kpis;
  const empty = !k.revenue.value && !k.expenses.value && !k.pending.value;
  const trend = data.trend[view];
  const cf = data.cashflow;
  const margin = (v) => `${v}%`;

  const kpis = [
    { label: "Total Revenue", value: k.revenue.value, prev: k.revenue.prev, change: k.revenue.change, ring: k.revenue.ring, color: "#6366f1", tint: "bg-indigo-50 text-indigo-500", icon: <IndianRupee size={22} />, ringTitle: "Share of invoiced money collected" },
    { label: "Total Expenses", value: k.expenses.value, prev: k.expenses.prev, change: k.expenses.change, bad: true, ring: k.expenses.ring, color: "#ef4444", tint: "bg-red-50 text-red-500", icon: <Banknote size={22} />, ringTitle: "Expenses as a share of revenue" },
    { label: "Net Profit", value: k.net.value, prev: k.net.prev, change: k.net.change, ring: k.net.ring, color: "#10b981", tint: "bg-emerald-50 text-emerald-500", icon: <ChartColumn size={22} />, ringTitle: "Net profit margin" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {Head}
        <p className="text-sm text-slate-500 -mt-3 text-left">Year {data.year} so far, compared with the same time last year. Revenue is money received. Net profit is after GST owed, team time and expenses.</p>

        {empty ? <SectionCard title="No finance data yet"><EmptyState>Raise an invoice and record a payment, or add an expense, and this dashboard fills in.</EmptyState></SectionCard> : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((c) => (
                <div key={c.label} className="bg-white rounded-2xl border border-slate-200 p-6 text-left">
                  <div className="flex items-start justify-between"><span className={`h-14 w-14 rounded-2xl flex items-center justify-center ${c.tint}`}>{c.icon}</span><MiniRing value={c.ring} color={c.color} title={c.ringTitle} /></div>
                  <p className="mt-5 text-4xl font-bold text-slate-900">{fmtShort(c.value)}</p>
                  <p className="text-slate-500">{c.label}</p>
                  <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex items-center justify-between text-sm"><span className="text-slate-400">Last period: {fmtShort(c.prev)}</span><DeltaPill value={c.change} goodWhenDown={c.bad} /></div>
                </div>
              ))}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-left">
                <div className="flex items-start justify-between"><span className="h-14 w-14 rounded-2xl flex items-center justify-center bg-violet-50 text-violet-500"><FileText size={22} /></span><MiniRing value={k.pending.ring} color="#8b5cf6" title="Pending invoices as a share of invoiced money" /></div>
                <p className="mt-5 text-4xl font-bold text-slate-900">{fmtShort(k.pending.value)}</p>
                <p className="text-slate-500">Pending Invoices</p>
                <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex items-center justify-between text-sm"><span className="text-slate-400">{k.pending.invoices} open</span><span className={k.pending.overdue ? "font-semibold text-red-600" : "text-slate-400"}>{k.pending.overdue} overdue</span></div>
              </div>
            </div>
            <p className="text-xs text-slate-400 -mt-3 text-left">The small rings show: revenue = invoiced money collected, expenses = share of revenue, profit = margin, pending = share of invoiced money still unpaid.</p>

            <div className="grid gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <SectionCard accent="#4f46e5" title="Revenue & Profit Trend" action={<Tabs value={view} onChange={setView} options={[["monthly", "Monthly"], ["quarterly", "Quarterly"], ["yearly", "Yearly"]]} />}>
                  <div className="h-80"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" /><YAxis yAxisId="a" tickFormatter={moneyTick} width={64} /><YAxis yAxisId="m" orientation="right" tickFormatter={margin} width={48} />
                    <Tooltip formatter={(v, n) => (n === "Profit margin" ? `${v}%` : fmtMoney(v))} /><Legend />
                    <Area yAxisId="a" type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" fill="#6366f122" strokeWidth={2.5} />
                    <Line yAxisId="m" type="monotone" dataKey="margin" name="Profit margin" stroke="#4338ca" strokeWidth={2.5} dot />
                  </ComposedChart></ResponsiveContainer></div>
                </SectionCard>
              </div>

              <div className="space-y-5">
                {[
                  ["Total Inflow", cf.inflow, "#10b981", "bg-emerald-50 text-emerald-500", <ArrowDownLeft key="i" size={18} />, "border-emerald-200", cf.daily.map((x) => ({ v: x.inflow }))],
                  ["Total Outflow", cf.outflow, "#ef4444", "bg-red-50 text-red-500", <ArrowUpRight key="o" size={18} />, "border-red-200", cf.daily.map((x) => ({ v: x.outflow }))],
                  ["Net Cash Flow", cf.net, "#6366f1", "bg-indigo-50 text-indigo-500", <TrendingUp key="n" size={18} />, "border-indigo-200", cf.daily.map((x) => ({ v: x.net }))],
                ].map(([label, value, color, tint, icon, border, spark]) => (
                  <div key={label} className={`bg-white rounded-2xl border ${border} p-5 text-left`}>
                    <div className="flex items-center justify-between"><div><p className="flex items-center gap-3 text-slate-500"><span className={`h-9 w-9 rounded-lg flex items-center justify-center ${tint}`}>{icon}</span>{label}</p><p className="mt-3 text-3xl font-bold" style={{ color }}>{value < 0 ? "-" : ""}{fmtShort(Math.abs(value))}</p></div><div className="w-28"><Spark data={spark} color={color} height={52} /></div></div>
                    <p className="mt-1 text-xs text-slate-400">This month</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <SectionCard accent="#4f46e5" title="Income Waterfall" action={data.waterfall.length > 1 ? <Tabs value={wf?.quarter} onChange={setQuarter} options={data.waterfall.map((w) => [w.quarter, `Q${w.quarter}`])} /> : <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-600">Q{wf?.quarter} {data.year}</span>}>
                {wf && (
                  <div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={wf.bars} margin={{ top: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" interval={0} tick={{ fontSize: 12 }} /><YAxis tickFormatter={moneyTick} width={64} />
                    <ReferenceLine y={0} stroke="#cbd5e1" />
                    <Tooltip cursor={false} formatter={(v, n, p) => [`${p.payload.delta < 0 ? "-" : ""}${fmtMoney(p.payload.size)}`, p.payload.name]} labelFormatter={() => ""} />
                    <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
                    <Bar dataKey="size" stackId="w" radius={[6, 6, 6, 6]} isAnimationActive={false}>
                      {wf.bars.map((b) => <Cell key={b.name} fill={b.kind === "in" ? "#10b981" : b.kind === "out" ? "#ef4444" : "#6366f1"} />)}
                    </Bar>
                  </BarChart></ResponsiveContainer></div>
                )}
                <p className="mt-2 text-xs text-slate-400">Green adds, red takes away. GST collected belongs to the government, and GST you paid on expenses comes back as a credit.</p>
              </SectionCard>

              <SectionCard accent="#7c3aed" title="Budget Allocation" subtitle="Your monthly budgets">
                {!data.budget.hasBudget ? <EmptyState>No budgets set. Add monthly budgets on the Expenses page.</EmptyState> : (
                  <div>
                    <div className="relative h-56"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.budget.allocation} dataKey="amount" nameKey="category" innerRadius="64%" outerRadius="95%" paddingAngle={2} stroke="none">{data.budget.allocation.map((a) => <Cell key={a.category} fill={catColor(a.category)} />)}</Pie><Tooltip formatter={(v) => fmtMoney(v)} /></PieChart></ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><p className="text-3xl font-bold text-indigo-700">{fmtShort(data.budget.monthly)}</p><p className="text-sm text-slate-500">Per month</p></div></div>
                    <ul className="mt-4 space-y-2.5">{data.budget.allocation.slice(0, 4).map((a) => <li key={a.category} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5"><span className="h-3 w-3 rounded-sm" style={{ background: catColor(a.category) }} /><span className="flex-1 font-medium text-slate-700">{a.category}</span><span className="font-bold text-slate-900">{a.percent}%</span></li>)}</ul>
                  </div>
                )}
              </SectionCard>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <SectionCard accent="#6366f1" title="Budget vs Actual" subtitle="Year to date">
                {data.budget.rows.length === 0 ? <EmptyState>No expenses or budgets yet.</EmptyState> : (
                  <>
                    <div style={{ height: Math.max(220, data.budget.rows.length * 52) }}><ResponsiveContainer width="100%" height="100%"><BarChart data={data.budget.rows.slice(0, 8)} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={moneyTick} /><YAxis type="category" dataKey="category" width={120} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v) => fmtMoney(v)} /><Legend />
                      <Bar dataKey="budget" name="Budget" fill="#c4b5fd" radius={[0, 4, 4, 0]} /><Bar dataKey="spent" name="Spent" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart></ResponsiveContainer></div>
                    <div className="mt-4 flex flex-wrap gap-2">{data.budget.rows.filter((r) => r.used != null).slice(0, 6).map((r) => <span key={r.category} className={`rounded-full border px-3 py-1 text-sm font-medium ${r.used > 100 ? "border-red-200 bg-red-50 text-red-600" : "border-indigo-100 bg-indigo-50 text-indigo-700"}`}>{r.category}: {r.used}%</span>)}</div>
                  </>
                )}
              </SectionCard>

              <SectionCard accent="#7c3aed" title="Expense Breakdown" subtitle="By category, this year">
                {data.expenseBreakdown.rows.length === 0 ? <EmptyState>No expenses recorded this year.</EmptyState> : (
                  <div>
                    <div className="relative h-56"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.expenseBreakdown.rows} dataKey="amount" nameKey="category" innerRadius="64%" outerRadius="95%" paddingAngle={2} stroke="none">{data.expenseBreakdown.rows.map((a) => <Cell key={a.category} fill={catColor(a.category)} />)}</Pie><Tooltip formatter={(v) => fmtMoney(v)} /></PieChart></ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><p className="text-3xl font-bold text-indigo-700">{fmtShort(data.expenseBreakdown.total)}</p><p className="text-sm text-slate-500">Total Expenses</p></div></div>
                    <ul className="mt-4 space-y-2.5">{data.expenseBreakdown.rows.slice(0, 4).map((a) => <li key={a.category} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5"><span className="h-3 w-3 rounded-sm" style={{ background: catColor(a.category) }} /><span className="flex-1 font-medium text-slate-700">{a.category}</span><span className="font-bold text-slate-900">{fmtShort(a.amount)}</span><span className="text-sm text-slate-400">({a.percent}%)</span></li>)}</ul>
                  </div>
                )}
              </SectionCard>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <SectionCard accent="#4f46e5" title="Recent Transactions" action={can("payments.view") ? <Link to="/finance/payments"><GhostButton className="!py-2">View All</GhostButton></Link> : null}>
                {data.recent.length === 0 ? <EmptyState>No transactions yet.</EmptyState> : (
                  <ul className="divide-y divide-slate-100 -my-3">{data.recent.map((t, i) => (
                    <li key={i} className="flex items-center gap-4 py-4">
                      <span className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center ${t.kind === "in" ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"}`}>{t.kind === "in" ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}</span>
                      <div className="min-w-0 flex-1"><p className="font-bold text-slate-900 truncate">{t.title}</p><p className="text-sm text-slate-400">{fmtDate(t.at)} · {t.sub}</p></div>
                      <div className="text-right"><p className={`font-bold ${t.kind === "in" ? "text-emerald-600" : "text-red-500"}`}>{t.kind === "in" ? "+" : "-"}{fmtMoney(t.amount)}</p><Badge className={t.status === "Pending" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>{t.status}</Badge></div>
                    </li>
                  ))}</ul>
                )}
              </SectionCard>

              <div className="space-y-6">
                <SectionCard accent="#6366f1" title="Financial Progress" subtitle="Where you stand this year">
                  <ul className="space-y-4">{data.progress.map((p) => {
                    const good = p.lowerIsBetter ? p.value <= 10 : true;
                    return (
                      <li key={p.label} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between"><p className="font-bold text-slate-900">{p.label}</p><p className={`font-bold ${good ? "text-emerald-600" : "text-red-600"}`}>{p.value}%</p></div><p className="text-sm text-slate-400">{p.detail}</p><div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${p.value}%`, background: good ? "linear-gradient(90deg,#6366f1,#10b981)" : "#ef4444" }} /></div></li>
                    );
                  })}</ul>
                </SectionCard>

                {data.methods.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 text-left">
                    <p className="text-xs font-bold tracking-widest text-indigo-700">PAYMENT METHODS</p>
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">{data.methods.map((m) => { const [Icon, label] = METHOD[m.method] || METHOD.OTHER; return (
                      <div key={m.method} className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 text-center"><Icon size={19} className="mx-auto text-indigo-500" /><p className="mt-2 text-xl font-bold text-slate-900">{fmtShort(m.amount)}</p><p className="text-sm text-slate-500">{label}</p></div>
                    ); })}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <SectionCard accent="#4f46e5" title="Financial Health Indicators" subtitle="Guides are common rules of thumb, not set by your accountant">
                <div className="grid gap-4 sm:grid-cols-3">{data.indicators.map((i) => (
                  <div key={i.key} className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 text-left" title={i.note}>
                    <div className="flex items-start justify-between gap-2"><p className="text-xs font-bold tracking-wider text-indigo-700 uppercase">{i.label}</p>{i.ok === true && <CircleCheck size={19} className="text-emerald-500 shrink-0" />}{i.ok === false && <TriangleAlert size={19} className="text-amber-500 shrink-0" />}</div>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{i.value == null ? "-" : `${i.value}${i.unit}`}</p>
                    <p className="mt-2 text-sm text-indigo-600">Guide: {i.guide}</p>
                    <p className="text-sm text-slate-500">{i.note}</p>
                  </div>
                ))}</div>
              </SectionCard>

              <SectionCard title="Accounts Summary" accent="#10b981">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5"><p className="flex items-center gap-3 font-bold text-slate-900"><span className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><ArrowDownLeft size={18} /></span>Accounts Receivable<span className="text-sm font-normal text-slate-500">Money owed to you</span></p><p className="mt-3 text-4xl font-bold text-emerald-600">{fmtMoney(data.accounts.receivable.amount)}</p><div className="mt-3 flex gap-3 text-sm"><span className="rounded-lg bg-white px-3 py-1.5">Invoices: <strong>{data.accounts.receivable.invoices}</strong></span><span className="rounded-lg bg-white px-3 py-1.5">Overdue: <strong className="text-red-600">{data.accounts.receivable.overdue}</strong></span></div></div>
                  <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5"><p className="flex items-center gap-3 font-bold text-slate-900"><span className="h-10 w-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center"><ArrowUpRight size={18} /></span>Accounts Payable<span className="text-sm font-normal text-slate-500">Approved, not yet paid</span></p><p className="mt-3 text-4xl font-bold text-red-500">{fmtMoney(data.accounts.payable.amount)}</p><div className="mt-3 flex gap-3 text-sm"><span className="rounded-lg bg-white px-3 py-1.5">Bills: <strong>{data.accounts.payable.bills}</strong></span><span className="rounded-lg bg-white px-3 py-1.5">Awaiting approval: <strong className="text-amber-600">{data.accounts.payable.pendingApproval}</strong></span></div></div>
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 text-center"><p className="text-xs font-bold tracking-widest text-indigo-700">NET POSITION</p><p className={`mt-2 text-4xl font-bold ${data.accounts.net >= 0 ? "text-indigo-700" : "text-red-600"}`}>{data.accounts.net >= 0 ? "+" : "-"}{fmtMoney(Math.abs(data.accounts.net))}</p><p className="text-sm text-slate-500">Receivable minus payable</p></div>
                </div>
              </SectionCard>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
