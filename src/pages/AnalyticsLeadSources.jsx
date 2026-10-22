import { useState } from "react";
import { Download, Users, Trophy, Percent, IndianRupee } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Layout from "../components/Layout";
import { PageHeader, Card, Spinner, EmptyState, GhostButton } from "../components/ui";
import { KpiCard, DonutList } from "../components/finance/bits";
import { THEAD, TROW } from "../components/finance/helpers";
import { DateFilter, BarList, ErrorNote } from "../components/analytics/parts";
import { useAnalytics, daysAgo, localYmd } from "../components/analytics/helpers";
import { fmtMoney, fmtShort, downloadCsv } from "../utils/format";
import { homePath } from "../utils/permissions";

export default function AnalyticsLeadSources() {
  const [range, setRange] = useState({ from: daysAgo(29), to: localYmd() });
  const { data, error, loading } = useAnalytics("/analytics/lead-sources", range);

  if (!data) {
    return (
      <Layout>
        <PageHeader title="Lead Source Analytics" breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Reports" }, { label: "Lead Sources" }]} />
        {error ? <ErrorNote message={error} /> : <Spinner />}
      </Layout>
    );
  }

  const k = data.kpis;
  const exportCsv = () =>
    downloadCsv(`lead-sources-${range.from}-to-${range.to}.csv`, [
      ["Source", "Leads", "Won", "Conversion %", "Expected value", "Spend"],
      ...data.sources.map((s) => [s.name, s.leads, s.won, s.conversion, s.value, s.spend]),
    ]);

  return (
    <Layout>
      <div className={`space-y-6 ${loading ? "opacity-60 transition-opacity" : ""}`}>
        <PageHeader
          title="Lead Source Analytics"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Reports" }, { label: "Lead Sources" }]}
          actions={<GhostButton onClick={exportCsv} disabled={!data.sources.length}><Download size={18} /> Export</GhostButton>}
        />
        <p className="text-sm text-slate-500 -mt-2">Where your leads come from (BNI, events, Meta, IndiaMART) and which source turns into projects. Spend includes offline demo expenses and marketing time cost.</p>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="New Leads" value={k.leads} icon={<Users size={26} />} delta={k.leadsChange} suffix="vs last period" />
          <KpiCard label="Won (Projects)" value={k.won} icon={<Trophy size={26} />} tone="green" delta={k.wonChange} suffix="vs last period" />
          <KpiCard label="Lead to Project" value={`${k.conversion}%`} icon={<Percent size={26} />} tone="cyan" hint={`${k.conversionChange >= 0 ? "+" : ""}${k.conversionChange} points vs last period`} />
          <KpiCard label="Cost per Lead" value={fmtShort(k.costPerLead)} icon={<IndianRupee size={26} />} tone="amber" hint={k.won ? `${fmtShort(k.costPerWin)} per project won` : `${fmtShort(k.spend)} total spend`} />
        </div>

        <DateFilter from={range.from} to={range.to} onApply={(from, to) => setRange({ from, to })} />

        {!data.sources.length ? <Card><EmptyState>No leads created in this period.</EmptyState></Card> : (
          <>
            <Card title="Leads Over Time">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" interval="preserveStartEnd" minTickGap={24} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="leads" name="Leads" stroke="#7c3aed" fill="#7c3aed22" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="won" name="Won" stroke="#10b981" fill="#10b98122" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="grid gap-5 lg:grid-cols-5">
              <Card className="lg:col-span-2" title="Lead Sources"><DonutList rows={data.sources.map((s) => ({ name: s.name, value: s.leads }))} format={(v) => v} /></Card>
              <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Source Performance</div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-137.5 text-left">
                    <thead><tr className={THEAD}><th className="p-4">Source</th><th className="p-4">Leads</th><th className="p-4">Won</th><th className="p-4">Conv.</th><th className="p-4">Spend</th></tr></thead>
                    <tbody>
                      {data.sources.map((s) => (
                        <tr key={s.name} className={TROW}>
                          <td className="p-4 font-semibold text-slate-900">{s.name}<span className="block text-xs font-normal text-slate-400">{fmtMoney(s.value)} expected</span></td>
                          <td className="p-4">{s.leads}</td><td className="p-4">{s.won}</td>
                          <td className={`p-4 font-semibold ${s.conversion >= 20 ? "text-emerald-600" : s.conversion >= 10 ? "text-amber-600" : "text-slate-600"}`}>{s.conversion}%</td>
                          <td className="p-4">{fmtMoney(s.spend)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card title="Request Type"><BarList rows={data.requestTypes.map((r) => ({ name: r.name, value: r.count }))} /></Card>
              <Card title="Where Leads Are Now"><BarList rows={data.statuses.map((r) => ({ name: r.name, value: r.count }))} color="#06b6d4" /></Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
