import { useState } from "react";
import { Download, Users, UserPlus, Zap, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Layout from "../components/Layout";
import { PageHeader, Card, Spinner, EmptyState, GhostButton, Avatar } from "../components/ui";
import { KpiCard, DonutList } from "../components/finance/bits";
import { THEAD, TROW } from "../components/finance/helpers";
import { DateFilter, Segmented, ErrorNote, Pill } from "../components/analytics/parts";
import { useAnalytics, daysAgo, localYmd } from "../components/analytics/helpers";
import { timeAgo, downloadCsv } from "../utils/format";
import { homePath } from "../utils/permissions";

export default function AnalyticsUsers() {
  const [range, setRange] = useState({ from: daysAgo(29), to: localYmd() });
  const [view, setView] = useState("monthly");
  const { data, error, loading } = useAnalytics("/analytics/users", range);

  if (!data) {
    return (
      <Layout>
        <PageHeader title="Team Reports" breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Reports" }, { label: "User Reports" }]} />
        {error ? <ErrorNote message={error} /> : <Spinner />}
      </Layout>
    );
  }

  const k = data.kpis;
  const exportCsv = () =>
    downloadCsv(`team-${range.from}-to-${range.to}.csv`, [
      ["Name", "Designation", "Tasks done", "Daily tasks done", "Hours", "Open tasks", "Overdue"],
      ...data.workload.map((u) => [u.name, u.designation, u.tasksDone, u.dailyDone, u.hours, u.openTasks, u.overdue]),
    ]);

  return (
    <Layout>
      <div className={`space-y-6 ${loading ? "opacity-60 transition-opacity" : ""}`}>
        <PageHeader
          title="Team Reports"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Reports" }, { label: "User Reports" }]}
          actions={<GhostButton onClick={exportCsv}><Download size={18} /> Export</GhostButton>}
        />
        <p className="text-sm text-slate-500 -mt-2">Your team&apos;s headcount, output and workload. Salary and bank details are never used here.</p>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total Team" value={k.total} icon={<Users size={26} />} hint={k.inactive ? `${k.inactive} inactive` : "Everyone is active"} />
          <KpiCard label="New Members" value={k.newUsers} icon={<UserPlus size={26} />} tone="green" delta={k.newChange} suffix="vs last period" />
          <KpiCard label="Project Tasks Done" value={k.tasksDone} icon={<Zap size={26} />} tone="cyan" hint="Completed in the period" />
          <KpiCard label="Hours Logged" value={`${k.hours}h`} icon={<Clock size={26} />} tone="amber" hint="From time tracking" />
        </div>

        <DateFilter from={range.from} to={range.to} onApply={(from, to) => setRange({ from, to })} />

        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2" title="Team Growth" action={<Segmented value={view} onChange={setView} options={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" }]} />}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.growth[view]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" name="Team size" stroke="#7c3aed" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="joined" name="Joined" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card title="By Designation"><DonutList rows={data.byDesignation.map((d) => ({ name: d.name, value: d.count }))} format={(v) => v} /></Card>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Top Members by Activity</div>
          {data.topUsers.every((u) => !u.activity && !u.hours) ? <EmptyState>No completed tasks or logged hours in this period.</EmptyState> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-175 text-left">
                <thead><tr className={THEAD}><th className="p-4">Member</th><th className="p-4">Tasks done</th><th className="p-4">Daily tasks</th><th className="p-4">Hours</th><th className="p-4">Last active</th></tr></thead>
                <tbody>
                  {data.topUsers.filter((u) => u.activity || u.hours).map((u) => (
                    <tr key={u._id} className={TROW}>
                      <td className="p-4"><div className="flex items-center gap-3"><Avatar name={u.name} /><div><p className="font-semibold text-slate-900">{u.name}</p><p className="text-sm text-slate-500">{u.designation}</p></div></div></td>
                      <td className="p-4 font-bold">{u.tasksDone}</td><td className="p-4">{u.dailyDone}</td><td className="p-4">{u.hours}h</td>
                      <td className="p-4 text-slate-500">{u.lastActive ? timeAgo(u.lastActive) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Workload Right Now</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-137.5 text-left">
              <thead><tr className={THEAD}><th className="p-4">Member</th><th className="p-4">Open tasks</th><th className="p-4">Overdue</th></tr></thead>
              <tbody>
                {data.workload.map((u) => (
                  <tr key={u._id} className={TROW}>
                    <td className="p-4 font-semibold text-slate-900">{u.name}</td>
                    <td className="p-4">{u.openTasks}</td>
                    <td className="p-4">{u.overdue ? <Pill tone="red">{u.overdue} overdue</Pill> : <span className="text-slate-400">-</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
