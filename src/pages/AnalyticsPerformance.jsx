import { useState } from "react";
import { Download, RefreshCw, Target, Timer, TriangleAlert, Clock } from "lucide-react";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Layout from "../components/Layout";
import { PageHeader, Card, Spinner, EmptyState, GhostButton, PrimaryButton } from "../components/ui";
import { KpiCard } from "../components/finance/bits";
import { THEAD, TROW } from "../components/finance/helpers";
import { Segmented, Ring, ErrorNote, Pill } from "../components/analytics/parts";
import { useAnalytics } from "../components/analytics/helpers";
import { fmtDate, downloadCsv } from "../utils/format";
import { homePath } from "../utils/permissions";

const RING_COLORS = ["#10b981", "#7c3aed", "#06b6d4", "#f59e0b"];
const HEALTH = { OK: ["green", "On track"], WARNING: ["amber", "Warning"], CRITICAL: ["red", "Critical"] };

export default function AnalyticsPerformance() {
  const [days, setDays] = useState(30);
  const [tick, setTick] = useState(0);
  const { data, error, loading } = useAnalytics("/analytics/performance", { days, tick });

  if (!data) {
    return (
      <Layout>
        <PageHeader title="Performance Analytics" breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Reports" }, { label: "Performance" }]} />
        {error ? <ErrorNote message={error} /> : <Spinner />}
      </Layout>
    );
  }

  const k = data.kpis;
  const sign = (n) => `${n >= 0 ? "+" : ""}${n}`;
  const exportCsv = () =>
    downloadCsv(`performance-${days}d.csv`, [
      ["Project", "Status", "Progress %", "Overdue tasks", "Logged hours", "Planned hours"],
      ...data.health.map((p) => [p.name, p.status, p.progress, p.overdue, p.loggedHours, p.plannedHours]),
    ]);

  return (
    <Layout>
      <div className={`space-y-6 ${loading ? "opacity-60 transition-opacity" : ""}`}>
        <PageHeader
          title="Performance Analytics"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Reports" }, { label: "Performance" }]}
          actions={
            <>
              <GhostButton onClick={() => setTick((t) => t + 1)}><RefreshCw size={18} /> Refresh</GhostButton>
              <PrimaryButton onClick={exportCsv}><Download size={18} /> Export</PrimaryButton>
            </>
          }
        />
        <div className="flex flex-wrap items-center justify-between gap-3 -mt-2">
          <p className="text-sm text-slate-500">How well the team delivers on project tasks and logs its time.</p>
          <Segmented value={days} onChange={setDays} options={[{ value: 7, label: "7d" }, { value: 30, label: "30d" }, { value: 90, label: "90d" }]} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Task Completion" value={`${k.completionRate}%`} icon={<Target size={26} />} hint={`${sign(k.completionChange)} points vs last period`} />
          <KpiCard label="On-time Delivery" value={`${k.onTimeRate}%`} icon={<Timer size={26} />} tone="green" hint={`${sign(k.onTimeChange)} points vs last period`} />
          <KpiCard label="Overdue Tasks" value={k.overdue} icon={<TriangleAlert size={26} />} tone="red" hint="Open and past the due date" />
          <KpiCard label="Hours Logged" value={`${k.hours}h`} icon={<Clock size={26} />} tone="cyan" delta={k.hoursChange} suffix="vs last period" hint={`${k.tasksDone} tasks done`} />
        </div>

        <Card title="Performance Scores" subtitle="Out of 100, for the selected period">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 py-2">
            {data.scores.map((s, i) => <Ring key={s.name} label={s.name} value={s.value} color={RING_COLORS[i]} />)}
          </div>
        </Card>

        <Card title="Performance Timeline">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.timeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" interval="preserveStartEnd" minTickGap={24} />
                <YAxis yAxisId="a" allowDecimals={false} />
                <YAxis yAxisId="h" orientation="right" />
                <Tooltip />
                <Legend />
                <Area yAxisId="a" type="monotone" dataKey="done" name="Tasks completed" stroke="#7c3aed" fill="#7c3aed22" strokeWidth={2.5} />
                <Line yAxisId="h" type="monotone" dataKey="hours" name="Hours logged" stroke="#10b981" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Project Health</div>
          {data.health.length === 0 ? <EmptyState>No running projects.</EmptyState> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-200 text-left">
                <thead><tr className={THEAD}><th className="p-4">Project</th><th className="p-4">Progress</th><th className="p-4">Overdue</th><th className="p-4">Hours (logged / planned)</th><th className="p-4">Health</th></tr></thead>
                <tbody>
                  {data.health.map((p) => (
                    <tr key={p._id} className={TROW}>
                      <td className="p-4 font-semibold text-slate-900">{p.name}<span className="block text-xs font-normal text-slate-400">{p.tasks} tasks</span></td>
                      <td className="p-4 min-w-40"><div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-brand" style={{ width: `${p.progress}%` }} /></div><span className="text-xs text-slate-500">{p.progress}%</span></td>
                      <td className="p-4">{p.overdue || "-"}</td>
                      <td className="p-4">{p.loggedHours}h / {p.plannedHours ? `${p.plannedHours}h` : "-"}</td>
                      <td className="p-4"><Pill tone={HEALTH[p.status][0]}>{HEALTH[p.status][1]}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Most Overdue Tasks</div>
            {data.overdueTasks.length === 0 ? <EmptyState>Nothing is overdue.</EmptyState> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-137.5 text-left">
                  <thead><tr className={THEAD}><th className="p-4">Task</th><th className="p-4">Assignee</th><th className="p-4">Due</th><th className="p-4">Late by</th></tr></thead>
                  <tbody>
                    {data.overdueTasks.map((t) => (
                      <tr key={t._id} className={TROW}>
                        <td className="p-4"><p className="font-semibold text-slate-900">{t.title}</p><p className="text-xs text-slate-400">{t.project}</p></td>
                        <td className="p-4 text-slate-600">{t.assignee || "Unassigned"}</td>
                        <td className="p-4 whitespace-nowrap">{fmtDate(t.dueDate)}</td>
                        <td className="p-4"><Pill tone={t.daysLate > 7 ? "red" : "amber"}>{t.daysLate}d</Pill></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Team Performance</div>
            {data.team.length === 0 ? <EmptyState>No completed tasks or hours in this period.</EmptyState> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-112.5 text-left">
                  <thead><tr className={THEAD}><th className="p-4">Member</th><th className="p-4">Done</th><th className="p-4">On time</th><th className="p-4">Hours</th></tr></thead>
                  <tbody>
                    {data.team.map((u) => (
                      <tr key={u._id} className={TROW}>
                        <td className="p-4 font-semibold text-slate-900">{u.name}</td><td className="p-4">{u.done}</td>
                        <td className={`p-4 font-semibold ${u.onTime >= 80 ? "text-emerald-600" : u.onTime >= 50 ? "text-amber-600" : "text-red-600"}`}>{u.done ? `${u.onTime}%` : "-"}</td>
                        <td className="p-4">{u.hours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
