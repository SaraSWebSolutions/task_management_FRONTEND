import { useState } from "react";
import { Download, ShoppingCart, Receipt, Handshake, Undo2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Layout from "../components/Layout";
import { PageHeader, Card, Spinner, EmptyState, GhostButton, SearchBox } from "../components/ui";
import { KpiCard } from "../components/finance/bits";
import { moneyTick, THEAD, TROW } from "../components/finance/helpers";
import { DateFilter, BarList, ErrorNote } from "../components/analytics/parts";
import { useAnalytics, daysAgo, localYmd } from "../components/analytics/helpers";
import { fmtMoney, fmtShort, fmtDate, downloadCsv } from "../utils/format";
import { homePath } from "../utils/permissions";

export default function AnalyticsSales() {
  const [range, setRange] = useState({ from: daysAgo(29), to: localYmd() });
  const [search, setSearch] = useState("");
  const { data, error, loading } = useAnalytics("/analytics/sales", range);

  if (!data) {
    return (
      <Layout>
        <PageHeader title="Sales Reports" breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Reports" }, { label: "Sales Reports" }]} />
        {error ? <ErrorNote message={error} /> : <Spinner />}
      </Layout>
    );
  }

  const k = data.kpis;
  const q = search.trim().toLowerCase();
  const clients = data.topClients.filter((c) => !q || c.name.toLowerCase().includes(q));
  const none = !k.invoices && !data.topClients.length;

  const exportCsv = () =>
    downloadCsv(`sales-${range.from}-to-${range.to}.csv`, [
      ["Client", "Invoices", "Sales", "% of total", "Change vs previous"],
      ...data.topClients.map((c) => [c.name, c.invoices, c.amount, c.percent, c.change ?? ""]),
    ]);

  return (
    <Layout>
      <div className={`space-y-6 ${loading ? "opacity-60 transition-opacity" : ""}`}>
        <PageHeader
          title="Sales Reports"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Reports" }, { label: "Sales Reports" }]}
          actions={<GhostButton onClick={exportCsv} disabled={none}><Download size={18} /> Download CSV</GhostButton>}
        />
        <p className="text-sm text-slate-500 -mt-2">Sales means invoices raised in the period (tax included). Changes compare with the previous period of the same length.</p>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total Sales" value={fmtShort(k.totalSales)} icon={<ShoppingCart size={26} />} delta={k.salesChange} suffix="vs last period" hint={`${k.invoices} invoices`} />
          <KpiCard label="Avg Invoice Value" value={fmtShort(k.avgInvoice)} icon={<Receipt size={26} />} tone="cyan" delta={k.avgChange} suffix="vs last period" />
          <KpiCard label="Deals Won" value={k.dealsWon} icon={<Handshake size={26} />} tone="green" delta={k.dealsWonChange} suffix="vs last period" hint={`Worth ${fmtShort(k.dealsWonValue)}`} />
          <KpiCard label="Refunds" value={fmtShort(k.refunded)} icon={<Undo2 size={26} />} tone="amber" delta={k.refundedChange} goodWhenDown suffix="vs last period" />
        </div>

        <DateFilter from={range.from} to={range.to} onApply={(from, to) => setRange({ from, to })} />

        {none ? <Card><EmptyState>No invoices in this period.</EmptyState></Card> : (
          <>
            <Card title={`Sales Trend (${data.range.days} days)`}>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" interval="preserveStartEnd" minTickGap={24} />
                    <YAxis yAxisId="a" tickFormatter={moneyTick} width={70} />
                    <YAxis yAxisId="c" orientation="right" allowDecimals={false} />
                    <Tooltip formatter={(v, n) => (n === "Sales (₹)" ? fmtMoney(v) : v)} />
                    <Legend />
                    <Line yAxisId="a" type="monotone" dataKey="amount" name="Sales (₹)" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
                    <Line yAxisId="c" type="monotone" dataKey="count" name="Invoices" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="grid gap-5 lg:grid-cols-5">
              <Card className="lg:col-span-3" title="Sales by Service">
                <BarList rows={data.byService.map((s) => ({ name: s.name, value: s.amount, hint: `${s.percent}%` }))} format={fmtShort} />
              </Card>
              <Card className="lg:col-span-2" title="Sales by Lead Source">
                <ul className="divide-y divide-slate-100">
                  {data.bySource.map((s) => (
                    <li key={s.name} className="flex items-center justify-between gap-3 py-3.5">
                      <div><p className="font-semibold text-slate-900">{s.name}</p><p className="text-sm text-slate-500">{s.percent}% of total</p></div>
                      <p className="font-bold text-slate-900">{fmtMoney(s.amount)}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
                <span className="text-lg font-semibold text-slate-900">Top Clients</span>
                <div className="sm:w-72"><SearchBox value={search} onChange={setSearch} placeholder="Search clients..." /></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-175 text-left">
                  <thead><tr className={THEAD}><th className="p-4">#</th><th className="p-4">Client</th><th className="p-4">Invoices</th><th className="p-4">Sales</th><th className="p-4">Growth</th></tr></thead>
                  <tbody>
                    {clients.map((c, i) => (
                      <tr key={c.name} className={TROW}>
                        <td className="p-4"><span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-violet-50 text-brand text-sm font-semibold">{i + 1}</span></td>
                        <td className="p-4 font-semibold text-slate-900">{c.name}</td>
                        <td className="p-4">{c.invoices}</td>
                        <td className="p-4 font-semibold">{fmtMoney(c.amount)}</td>
                        <td className="p-4">{c.change == null ? <span className="text-slate-400">New</span> : <span className={c.change >= 0 ? "text-emerald-600" : "text-red-600"}>{c.change >= 0 ? "+" : ""}{c.change}%</span>}</td>
                      </tr>
                    ))}
                    {!clients.length && <tr><td colSpan={5}><EmptyState>No client matches.</EmptyState></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-slate-400">Period: {fmtDate(data.range.from)} to {fmtDate(data.range.to)}</p>
          </>
        )}
      </div>
    </Layout>
  );
}
