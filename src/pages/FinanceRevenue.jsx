import { useEffect, useMemo, useState } from "react";
import { IndianRupee, CalendarDays, ChartColumn, TrendingUp, Download } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Card, Spinner, EmptyState, GhostButton, SearchBox } from "../components/ui";
import { KpiCard, DonutList, YearSelect, Delta } from "../components/finance/bits";
import { moneyTick, THEAD, TROW } from "../components/finance/helpers";
import { fmtMoney, fmtShort, downloadCsv } from "../utils/format";
import { homePath } from "../utils/permissions";

export default function FinanceRevenue() {
  const [year, setYear] = useState(null);
  const [data, setData] = useState(null);
  const [view, setView] = useState("monthly");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/finance/revenue", { params: year ? { year } : {} })
      .then((r) => setData(r.data))
      .catch(() => {
        toast.error("Failed to load revenue");
        setData({ stats: {}, monthly: [], yearly: [], byService: [], bySource: [], topClients: [], quarters: [], monthlyBreakdown: [], years: [] });
      });
  }, [year]);

  const q = search.trim().toLowerCase();
  const rows = useMemo(
    () => (data?.monthlyBreakdown || []).filter((r) => !q || r.month.toLowerCase().includes(q)),
    [data, q],
  );

  const exportCsv = () =>
    downloadCsv(`revenue-${data.year}.csv`, [
      ["Month", "Revenue", "Expenses", "Net", "Growth %"],
      ...data.monthlyBreakdown.map((r) => [r.month, r.revenue, r.expenses, r.net, r.growth ?? ""]),
    ]);

  const s = data?.stats || {};
  const trend = view === "monthly" ? data?.monthly : data?.yearly;
  const noRevenue = data && !s.total && !data.yearly?.some((y) => y.thisYear);

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Revenue"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Finance" }, { label: "Revenue" }]}
          actions={
            <>
              {data && <YearSelect years={data.years} value={data.year} onChange={setYear} />}
              <GhostButton onClick={exportCsv} disabled={!data}><Download size={18} /> Export</GhostButton>
            </>
          }
        />

        {!data ? <Spinner /> : (
          <>
            <p className="text-sm text-slate-500 -mt-2">
              Revenue is the money actually received: successful payments, counted on the payment date.
            </p>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label={`Total Revenue (${data.year})`} value={fmtShort(s.total)} icon={<IndianRupee size={26} />} delta={s.totalChange} suffix="vs last year" hint={`${s.payments || 0} payments`} />
              <KpiCard label="This Month" value={fmtShort(s.monthRevenue)} icon={<CalendarDays size={26} />} tone="green" delta={data.year === new Date().getFullYear() ? s.monthChange : undefined} suffix="vs last month" />
              <KpiCard label="Daily Average" value={fmtShort(s.dailyAverage)} icon={<ChartColumn size={26} />} tone="cyan" delta={data.year === new Date().getFullYear() ? s.dailyChange : undefined} suffix="vs last month" />
              <KpiCard label="Growth Rate" value={`${s.growthRate || 0}%`} icon={<TrendingUp size={26} />} tone="amber" hint="Year to date vs same period last year" />
            </div>

            {noRevenue ? (
              <Card><EmptyState>No payments recorded yet. Create an invoice and record a payment to see revenue here.</EmptyState></Card>
            ) : (
              <>
                <div className="grid gap-5 lg:grid-cols-3">
                  <Card
                    className="lg:col-span-2"
                    title="Revenue Trend"
                    action={
                      <div className="inline-flex rounded-xl border border-slate-200 p-1">
                        {["monthly", "yearly"].map((v) => (
                          <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize ${view === v ? "bg-brand text-white" : "text-slate-600"}`}>{v}</button>
                        ))}
                      </div>
                    }
                  >
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trend}>
                          <defs>
                            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={moneyTick} width={70} />
                          <Tooltip formatter={(v) => fmtMoney(v)} />
                          <Legend />
                          {view === "monthly" && <Area type="monotone" dataKey="lastYear" name="Last Year" stroke="#94a3b8" strokeDasharray="5 5" fill="none" />}
                          <Area type="monotone" dataKey="thisYear" name={view === "monthly" ? "This Year" : "Revenue"} stroke="#7c3aed" strokeWidth={2.5} fill="url(#rev)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card title="Revenue by Service">
                    <DonutList rows={data.byService.map((r) => ({ name: r.name, value: r.amount }))} />
                  </Card>
                </div>

                <div className="grid gap-5 lg:grid-cols-5">
                  <Card className="lg:col-span-3" title="Revenue by Lead Source" subtitle="From the lead linked to the project of each invoice">
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.bySource} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" tickFormatter={moneyTick} />
                          <YAxis type="category" dataKey="name" width={130} />
                          <Tooltip formatter={(v) => fmtMoney(v)} />
                          <Bar dataKey="amount" name="Revenue" fill="#7c3aed" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card className="lg:col-span-2" title="Top Clients">
                    {data.topClients.length === 0 ? <EmptyState>No data.</EmptyState> : (
                      <ul className="divide-y divide-slate-100">
                        {data.topClients.map((c) => (
                          <li key={c.name} className="flex items-center justify-between gap-3 py-3.5">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{c.name}</p>
                              <p className="text-sm text-slate-500">{fmtMoney(c.amount)}</p>
                            </div>
                            {c.change != null && <Delta value={c.change} suffix="" />}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </div>

                <Card title="Year-over-Year Comparison">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {data.quarters.map((qt) => (
                      <div key={qt.quarter} className="rounded-2xl border border-slate-200 p-5">
                        <p className="text-slate-500">{qt.quarter} Revenue</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">{fmtShort(qt.amount)}</p>
                        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                          <span>Last year: {fmtShort(qt.lastYear)}</span>
                          {qt.change != null && (
                            <span className={`font-semibold ${qt.change >= 0 ? "text-emerald-600" : "text-red-600"}`}>{qt.change >= 0 ? "+" : ""}{qt.change}%</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
                    <span className="text-lg font-semibold text-slate-900">Monthly Breakdown</span>
                    <div className="sm:w-72"><SearchBox value={search} onChange={setSearch} placeholder="Search month..." /></div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-175 text-left">
                      <thead>
                        <tr className={THEAD}>
                          <th className="p-4">Month</th><th className="p-4">Revenue</th><th className="p-4">Expenses</th><th className="p-4">Net</th><th className="p-4">Growth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.month} className={TROW}>
                            <td className="p-4 font-semibold text-slate-900">{r.month}</td>
                            <td className="p-4">{fmtMoney(r.revenue)}</td>
                            <td className="p-4 text-slate-500">{fmtMoney(r.expenses)}</td>
                            <td className={`p-4 font-semibold ${r.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmtMoney(r.net)}</td>
                            <td className="p-4">{r.growth == null ? "-" : <span className={r.growth >= 0 ? "text-emerald-600" : "text-red-600"}>{r.growth >= 0 ? "+" : ""}{r.growth}%</span>}</td>
                          </tr>
                        ))}
                        {rows.length === 0 && <tr><td colSpan={5}><EmptyState>No month matches.</EmptyState></td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
