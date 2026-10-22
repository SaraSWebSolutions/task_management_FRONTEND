import { useState } from "react";
import { Download, IndianRupee, ChartColumn, TrendingUp, Rocket } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Layout from "../components/Layout";
import { PageHeader, Card, Spinner, EmptyState, GhostButton } from "../components/ui";
import { KpiCard, Delta } from "../components/finance/bits";
import { moneyTick, THEAD, TROW } from "../components/finance/helpers";
import { DateFilter, ErrorNote, Pill } from "../components/analytics/parts";
import { useAnalytics, localYmd, yearStartYmd } from "../components/analytics/helpers";
import { CHART_COLORS } from "../constants/finance";
import { fmtMoney, fmtShort, downloadCsv } from "../utils/format";
import { homePath } from "../utils/permissions";

export default function AnalyticsRevenue() {
  const [range, setRange] = useState({ from: yearStartYmd(), to: localYmd() });
  const { data, error, loading } = useAnalytics("/analytics/revenue", range);

  if (!data) {
    return (
      <Layout>
        <PageHeader title="Revenue Reports" breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Reports" }, { label: "Revenue Reports" }]} />
        {error ? <ErrorNote message={error} /> : <Spinner />}
      </Layout>
    );
  }

  const k = data.kpis;
  const mc = data.monthCompare;
  const none = !k.payments && !data.breakdown.length;

  const exportCsv = () =>
    downloadCsv(`revenue-${range.from}-to-${range.to}.csv`, [
      ["Period", "Revenue"],
      ...data.overTime.map((r) => [r.label, r.amount]),
      [],
      ["Service", "This month", "Last month", "Change %"],
      ...data.breakdown.map((b) => [b.name, b.thisMonth, b.lastMonth, b.change ?? ""]),
    ]);

  return (
    <Layout>
      <div className={`space-y-6 ${loading ? "opacity-60 transition-opacity" : ""}`}>
        <PageHeader
          title="Revenue Reports"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Reports" }, { label: "Revenue Reports" }]}
          actions={<GhostButton onClick={exportCsv} disabled={none}><Download size={18} /> Export</GhostButton>}
        />
        <p className="text-sm text-slate-500 -mt-2">Revenue is money received (successful payments). Net revenue is revenue minus recorded expenses.</p>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Gross Revenue" value={fmtShort(k.gross)} icon={<IndianRupee size={26} />} delta={k.grossChange} suffix="vs last period" hint={`${k.payments} payments`} />
          <KpiCard label="Net Revenue" value={fmtShort(k.net)} icon={<ChartColumn size={26} />} tone="green" hint="After expenses" />
          <KpiCard label="Revenue Growth" value={`${k.growth}%`} icon={<TrendingUp size={26} />} tone="cyan" hint="Against the previous period of the same length" />
          <KpiCard label="Projected Annual" value={fmtShort(k.projectedAnnual)} icon={<Rocket size={26} />} tone="amber" hint="Last 90 days, scaled to a year" />
        </div>

        <DateFilter from={range.from} to={range.to} onApply={(from, to) => setRange({ from, to })} presets={false} />

        {none ? <Card><EmptyState>No payments received in this period.</EmptyState></Card> : (
          <>
            <Card title="Revenue Over Time">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.overTime}>
                    <defs><linearGradient id="rv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} /><stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={moneyTick} width={70} />
                    <Tooltip formatter={(v) => fmtMoney(v)} />
                    <Area type="monotone" dataKey="amount" name="Revenue" stroke="#7c3aed" strokeWidth={2.5} fill="url(#rv)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Revenue by Service (Stacked)">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.stacked}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={moneyTick} width={70} />
                    <Tooltip formatter={(v) => fmtMoney(v)} />
                    <Legend />
                    {data.serviceKeys.map((s, i) => <Bar key={s} dataKey={s} stackId="a" fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          <Card title="MRR / ARR Tracking" subtitle={`${data.recurring.subscribers} paying subscriptions`}>
            <div className="space-y-4">
              <div className="rounded-2xl bg-violet-50 p-5"><p className="text-xs font-semibold tracking-wider text-slate-500">MONTHLY RECURRING REVENUE</p><p className="mt-1 text-3xl font-bold text-brand">{fmtMoney(data.recurring.mrr)}</p></div>
              <div className="rounded-2xl bg-emerald-50 p-5"><p className="text-xs font-semibold tracking-wider text-slate-500">ANNUAL RECURRING REVENUE</p><p className="mt-1 text-3xl font-bold text-emerald-600">{fmtMoney(data.recurring.arr)}</p></div>
            </div>
          </Card>

          <Card title="This Month vs Last Month">
            <div className="flex items-end justify-between gap-3">
              <div><p className="text-sm text-slate-500">This Month</p><p className="text-3xl font-bold text-slate-900">{fmtMoney(mc.thisMonth)}</p></div>
              <div className="text-right"><p className="text-sm text-slate-500">Last Month</p><p className="text-2xl font-bold text-slate-400">{fmtMoney(mc.lastMonth)}</p></div>
            </div>
            <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-900">Difference</span>
              <span className={`font-bold ${mc.diff >= 0 ? "text-emerald-600" : "text-red-600"}`}>{mc.diff >= 0 ? "+" : "-"}{fmtMoney(Math.abs(mc.diff))} ({mc.change >= 0 ? "+" : ""}{mc.change}%)</span>
            </div>
            <div className="mt-4 h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-brand rounded-full" style={{ width: `${Math.min(100, mc.ofLast)}%` }} /></div>
            <p className="mt-2 text-sm text-slate-500">{mc.ofLast}% of last month&apos;s revenue</p>
          </Card>

          <Card title="Revenue Forecast" subtitle="Straight-line trend of the last 6 complete months">
            {data.forecast.length === 0 ? <p className="py-8 text-center text-slate-500">Needs at least 3 months with payments to forecast.</p> : (
              <ul className="divide-y divide-slate-100">
                {data.forecast.map((f) => (
                  <li key={f.quarter} className="flex items-center justify-between gap-3 py-3.5">
                    <p className="font-semibold text-slate-900">{f.quarter}</p>
                    <div className="text-right"><p className="font-bold text-slate-900">{fmtShort(f.amount)}</p><Pill tone={f.confidence === "High" ? "green" : f.confidence === "Medium" ? "amber" : "slate"}>{f.confidence}</Pill></div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Revenue Breakdown</div>
          {data.breakdown.length === 0 ? <EmptyState>No revenue this month or last month.</EmptyState> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-150 text-left">
                <thead><tr className={THEAD}><th className="p-4">Service</th><th className="p-4">This month</th><th className="p-4">Last month</th><th className="p-4">Change</th></tr></thead>
                <tbody>
                  {data.breakdown.map((b) => (
                    <tr key={b.name} className={TROW}>
                      <td className="p-4 font-semibold text-slate-900">{b.name}</td>
                      <td className="p-4 font-semibold">{fmtMoney(b.thisMonth)}</td>
                      <td className="p-4 text-slate-400">{fmtMoney(b.lastMonth)}</td>
                      <td className="p-4">{b.change == null ? <span className="text-slate-400">New</span> : <Delta value={b.change} suffix="" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
