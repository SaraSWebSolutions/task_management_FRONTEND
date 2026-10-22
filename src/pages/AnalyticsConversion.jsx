import { useState } from "react";
import { Download, Filter, Users, Briefcase, BadgeCheck } from "lucide-react";
import Layout from "../components/Layout";
import { PageHeader, Card, Spinner, EmptyState, GhostButton } from "../components/ui";
import { KpiCard } from "../components/finance/bits";
import { THEAD, TROW } from "../components/finance/helpers";
import { DateFilter, BarList, ErrorNote } from "../components/analytics/parts";
import { useAnalytics, daysAgo, localYmd } from "../components/analytics/helpers";
import { fmtMoney, fmtShort, downloadCsv } from "../utils/format";
import { homePath } from "../utils/permissions";

const SHADES = ["#7c3aed", "#8b5cf6", "#a78bfa", "#10b981"];

export default function AnalyticsConversion() {
  const [range, setRange] = useState({ from: daysAgo(29), to: localYmd() });
  const { data, error, loading } = useAnalytics("/analytics/conversion", range);

  if (!data) {
    return (
      <Layout>
        <PageHeader title="Conversion Analytics" breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Reports" }, { label: "Conversion" }]} />
        {error ? <ErrorNote message={error} /> : <Spinner />}
      </Layout>
    );
  }

  const k = data.kpis;
  const exportCsv = () =>
    downloadCsv(`conversion-${range.from}-to-${range.to}.csv`, [
      ["Stage", "Leads", "% of all leads", "% of previous stage"],
      ...data.funnel.map((f) => [f.name, f.count, f.ofTotal, f.fromPrevious]),
    ]);

  return (
    <Layout>
      <div className={`space-y-6 ${loading ? "opacity-60 transition-opacity" : ""}`}>
        <PageHeader
          title="Conversion Analytics"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Reports" }, { label: "Conversion" }]}
          actions={<GhostButton onClick={exportCsv}><Download size={18} /> Export</GhostButton>}
        />
        <p className="text-sm text-slate-500 -mt-2">Leads created in the period and how far each has got. A stage counts every lead that reached it or went further.</p>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Lead to Project" value={`${k.conversion}%`} icon={<Filter size={26} />} hint={`${k.conversionChange >= 0 ? "+" : ""}${k.conversionChange} points vs last period`} />
          <KpiCard label="Leads" value={k.leads} icon={<Users size={26} />} tone="green" delta={k.leadsChange} suffix="vs last period" hint={k.lost ? `${k.lost} lost` : undefined} />
          <KpiCard label="Open Deals" value={k.openDeals} icon={<Briefcase size={26} />} tone="cyan" hint={`${fmtShort(k.pipelineWeighted)} weighted pipeline`} />
          <KpiCard label="Customers Won" value={k.customers} icon={<BadgeCheck size={26} />} tone="amber" delta={k.customersChange} suffix="vs last period" />
        </div>

        <DateFilter from={range.from} to={range.to} onApply={(from, to) => setRange({ from, to })} />

        <Card title="Conversion Funnel">
          {data.funnel[0].count === 0 ? <EmptyState>No leads created in this period.</EmptyState> : (
            <div className="space-y-2">
              {data.funnel.map((f, i) => (
                <div key={f.name}>
                  <div className="mx-auto rounded-2xl px-6 py-4 text-white flex items-center justify-between transition-all" style={{ width: `${Math.max(f.ofTotal, 18)}%`, background: SHADES[i] }}>
                    <div><p className="font-bold">{f.name}</p><p className="text-sm opacity-90">{f.count} leads</p></div>
                    <p className="text-xl font-bold">{f.ofTotal}%</p>
                  </div>
                  {i < data.funnel.length - 1 && <p className="text-center text-sm text-slate-500 py-1.5">{data.funnel[i + 1].fromPrevious}% move to the next stage</p>}
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Conversion by Source" subtitle="Share of leads that became projects">
            <BarList rows={data.bySource.map((s) => ({ name: s.name, value: s.rate, hint: `${s.won}/${s.leads}` }))} format={(v) => `${v}%`} color="#10b981" empty="No leads in this period." />
          </Card>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100"><span className="text-lg font-semibold text-slate-900">Deal Pipeline</span><span className="ml-2 text-sm text-slate-500">all deals, right now</span></div>
            <table className="w-full text-left">
              <thead><tr className={THEAD}><th className="p-4">Stage</th><th className="p-4">Deals</th><th className="p-4">Value</th><th className="p-4">Weighted</th></tr></thead>
              <tbody>
                {data.deals.map((d) => (
                  <tr key={d.name} className={TROW}><td className="p-4 font-semibold text-slate-900">{d.name}</td><td className="p-4">{d.count}</td><td className="p-4">{fmtMoney(d.value)}</td><td className="p-4 text-slate-500">{fmtMoney(d.weighted)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {[
            ["Avg. time to win", `${k.avgCycleDays} days`, "Lead created to project created"],
            ["Deal win rate", `${k.dealWinRate}%`, "Closed won out of all closed deals"],
            ["Leads lost", k.lost, "Created in this period"],
          ].map(([label, value, hint]) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 p-6"><p className="text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold text-slate-900">{value}</p><p className="mt-1 text-sm text-slate-400">{hint}</p></div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
