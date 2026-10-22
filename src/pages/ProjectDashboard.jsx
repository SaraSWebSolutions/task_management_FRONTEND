import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FolderOpen, CircleCheck, TriangleAlert, Users, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, PieChart, Pie, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Card, StatCard, Badge, Avatar, Spinner, EmptyState, PrimaryButton, GhostButton } from "../components/ui";
import { HEALTH, pmTaskStatusMeta } from "../constants/pm";
import { priorityMeta } from "../constants/crm";
import { fmtDate, timeAgo } from "../utils/format";
import { can, homePath } from "../utils/permissions";

export default function ProjectDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/pm/dashboard");
      setData(res.data);
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  const s = data?.stats;
  const dist = (data?.distribution || []).map((d) => ({ ...d, name: pmTaskStatusMeta(d.status).label, fill: pmTaskStatusMeta(d.status).color }));

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Project Management"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Dashboard" }, { label: "Project Management" }]}
          actions={
            <>
              <GhostButton onClick={load} disabled={loading}><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</GhostButton>
              {can("projects.manage") && (
                <Link to="/projects"><PrimaryButton type="button"><Plus size={18} /> New Project</PrimaryButton></Link>
              )}
            </>
          }
        />

        {!data ? (
          <Spinner />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Active Projects" value={s.activeProjects} icon={<FolderOpen size={26} />} />
              <StatCard label="Completed Tasks" value={s.completedTasks} icon={<CircleCheck size={26} />} tone="green" />
              <StatCard label="Overdue Tasks" value={s.overdueTasks} icon={<TriangleAlert size={26} />} tone="red" />
              <StatCard label="Team Members" value={s.teamMembers} icon={<Users size={26} />} tone="indigo" />
            </div>

            <div className="grid gap-5 lg:grid-cols-5">
              <Card title="Project Progress Overview" className="lg:col-span-3" action={<Link to="/projects" className="text-sm font-semibold text-brand border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">View All</Link>}>
                {data.projectProgress.length === 0 ? (
                  <EmptyState>No projects yet.</EmptyState>
                ) : (
                  <>
                    <div style={{ height: Math.max(220, data.projectProgress.length * 44) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.projectProgress} layout="vertical" margin={{ left: 10, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} unit="%" />
                          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(v) => `${v}%`} />
                          <Bar dataKey="progress" radius={[0, 6, 6, 0]} background={{ fill: "#eef2ff", radius: 6 }}>
                            {data.projectProgress.map((p) => <Cell key={p._id} fill={HEALTH[p.health].color} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 flex flex-wrap justify-center gap-5 text-sm text-slate-600">
                      {Object.values(HEALTH).map((h) => (
                        <span key={h.label} className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: h.color }} />{h.label}</span>
                      ))}
                    </div>
                  </>
                )}
              </Card>

              <Card title="Task Distribution" className="lg:col-span-2">
                {s.totalTasks === 0 ? (
                  <EmptyState>No tasks yet.</EmptyState>
                ) : (
                  <>
                    <div className="h-52 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={dist} dataKey="count" nameKey="name" innerRadius={60} outerRadius={85} paddingAngle={2}>
                            {dist.map((d) => <Cell key={d.status} fill={d.fill} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-bold text-slate-900">{s.totalTasks}</span>
                        <span className="text-sm text-brand">Total Tasks</span>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {dist.map((d) => (
                        <div key={d.status} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
                          <span className="inline-flex items-center gap-2 text-slate-700"><span className="h-3 w-3 rounded-sm" style={{ background: d.fill }} />{d.name}</span>
                          <span className="font-semibold text-slate-900">{d.count} <span className="text-xs font-normal text-slate-400">({Math.round((d.count / s.totalTasks) * 100)}%)</span></span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card title="Upcoming Deadlines">
                {data.upcomingDeadlines.length === 0 ? (
                  <EmptyState>No open tasks with due dates.</EmptyState>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-130">
                      <thead><tr className="text-xs uppercase tracking-wider text-slate-500"><th className="py-2">Task</th><th>Project</th><th>Due</th><th>Assignee</th><th>Priority</th></tr></thead>
                      <tbody>
                        {data.upcomingDeadlines.map((t) => (
                          <tr key={t._id} className="border-t border-slate-100">
                            <td className="py-3 pr-2 font-medium text-slate-900">{t.title}</td>
                            <td className="pr-2 text-slate-500">{t.project}</td>
                            <td className={`pr-2 ${t.overdue ? "text-red-500 font-medium" : "text-slate-500"}`}>{fmtDate(t.dueDate)}</td>
                            <td className="pr-2 text-slate-500">{t.assignee || "-"}</td>
                            <td><Badge className={priorityMeta(t.priority).badge}>{priorityMeta(t.priority).label}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <Card title="Team Workload" subtitle="10 open tasks = 100% capacity">
                {data.teamWorkload.length === 0 ? (
                  <EmptyState>No assigned tasks yet.</EmptyState>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {data.teamWorkload.slice(0, 6).map((w) => {
                      const hot = w.capacity >= 90;
                      return (
                        <div key={w._id} className={`rounded-2xl border p-4 ${hot ? "border-red-200 bg-red-50/60" : "border-indigo-100 bg-indigo-50/40"}`}>
                          <div className="flex items-center gap-3">
                            <Avatar name={w.name} />
                            <div className="min-w-0"><p className="font-semibold text-slate-900 truncate">{w.name}</p><p className="text-xs text-slate-500">{w.designation}</p></div>
                          </div>
                          <div className="mt-3 flex justify-between text-sm text-slate-600"><span>Capacity</span><span className="font-semibold">{w.capacity}%</span></div>
                          <div className="mt-1 h-2 rounded-full bg-white"><div className="h-2 rounded-full" style={{ width: `${w.capacity}%`, background: hot ? "#ef4444" : w.capacity < 70 ? "#10b981" : "#6366f1" }} /></div>
                          <p className="mt-2 text-xs text-slate-500">{w.activeTasks} active tasks</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card title="Hours Logged This Week" action={<span className="text-sm font-semibold text-brand">Total: {Math.round(data.weekTotal * 10) / 10}h</span>}>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.hoursThisWeek}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" /><YAxis unit="h" /><Tooltip formatter={(v) => `${v}h`} /><Legend />
                      <Bar dataKey="billable" name="Billable" stackId="a" fill="#7c3aed" />
                      <Bar dataKey="nonBillable" name="Non-Billable" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Recent Activity">
                {data.recentActivity.length === 0 ? (
                  <EmptyState>No activity yet.</EmptyState>
                ) : (
                  <div className="space-y-4">
                    {data.recentActivity.map((a) => (
                      <div key={a._id} className="flex items-start gap-3">
                        <span className="mt-1.5 h-3 w-3 rounded-full shrink-0" style={{ background: pmTaskStatusMeta(a.status).color }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-800">
                            <span className="font-semibold">{a.who || "Someone"}</span>{" "}
                            {a.isNew ? "was given" : `has "${a.title}" in`} {a.isNew ? `"${a.title}"` : pmTaskStatusMeta(a.status).label}
                          </p>
                          <p className="text-xs text-brand">{a.project}</p>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">{timeAgo(a.at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
