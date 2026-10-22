import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Users,
  UserPlus,
  Hourglass,
  Trophy,
  Percent,
  CalendarClock,
  MapPin,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import {
  PageHeader,
  Card,
  StatTile,
  Badge,
  Avatar,
  Spinner,
  EmptyState,
  PrimaryButton,
} from "../components/ui";
import { statusMeta, SOURCE_COLORS } from "../constants/crm";
import { sourceLabel } from "../constants/leadSources";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

export default function CrmDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get("/crm/dashboard")
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled)
          toast.error(err?.response?.data?.message || "Failed to load CRM data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const header = (
    <PageHeader
      title="CRM Dashboard"
      subtitle="Lead pipeline, sources and conversion at a glance"
      actions={
        <PrimaryButton onClick={() => navigate("/add-lead")}>
          <Plus size={18} /> Add Lead
        </PrimaryButton>
      }
    />
  );

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 text-left">
          {header}
          <Spinner label="Loading CRM data..." />
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="space-y-6 text-left">
          {header}
          <EmptyState>Could not load the dashboard. Please try again.</EmptyState>
        </div>
      </Layout>
    );
  }

  const { kpis, pipeline, sources, trend, recentLeads, upcomingDemos, topAssignees } =
    data;

  const pipelineMax = Math.max(...pipeline.map((p) => p.count), 1);
  const sourceData = sources.map((s) => ({
    name: sourceLabel(s.source),
    key: s.source,
    value: s.count,
  }));
  const trendData = trend.map((t) => ({ ...t, label: `${t.month}` }));

  return (
    <Layout>
      <div className="space-y-6 text-left">
        {header}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatTile
            label="Total leads"
            value={kpis.totalLeads}
            icon={<Users size={20} />}
          />
          <StatTile
            label="New this month"
            value={kpis.newThisMonth}
            tone="text-blue-600"
            icon={<UserPlus size={20} />}
          />
          <StatTile
            label="Active pipeline"
            value={kpis.activePipeline}
            hint="New, demo or quotation stage"
            tone="text-amber-600"
            icon={<Hourglass size={20} />}
          />
          <StatTile
            label="Converted"
            value={kpis.converted}
            hint={`${kpis.lost} lost`}
            tone="text-emerald-600"
            icon={<Trophy size={20} />}
          />
          <StatTile
            label="Conversion rate"
            value={`${kpis.conversionRate}%`}
            hint={`Win rate ${kpis.winRate}% of closed`}
            icon={<Percent size={20} />}
          />
        </div>

        {/* Trend + sources */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card
            title="Leads over time"
            subtitle="Last 6 months"
            className="xl:col-span-2"
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gConv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    name="New leads"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#gLeads)"
                  />
                  <Area
                    type="monotone"
                    dataKey="converted"
                    name="Converted"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#gConv)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Lead sources" subtitle="Where leads come from">
            {sourceData.length === 0 ? (
              <EmptyState>No leads yet.</EmptyState>
            ) : (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {sourceData.map((s) => (
                          <Cell
                            key={s.key}
                            fill={SOURCE_COLORS[s.key] || "#94a3b8"}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-2 space-y-2">
                  {sources.map((s) => (
                    <li
                      key={s.source}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2 text-slate-600">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            background: SOURCE_COLORS[s.source] || "#94a3b8",
                          }}
                        />
                        {sourceLabel(s.source)}
                      </span>
                      <span className="text-slate-500">
                        <b className="text-slate-800">{s.count}</b> · {s.converted}{" "}
                        converted
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>

        {/* Pipeline + demos + assignees */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card title="Pipeline" subtitle="Leads by stage" className="xl:col-span-1">
            <ul className="space-y-4">
              {pipeline.map((p) => {
                const meta = statusMeta(p.status);
                return (
                  <li key={p.status}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-slate-600">{meta.label}</span>
                      <span className="font-semibold text-slate-800">{p.count}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(p.count / pipelineMax) * 100}%`,
                          background: meta.color,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card title="Upcoming demos" subtitle="Next scheduled">
            {upcomingDemos.length === 0 ? (
              <EmptyState>No upcoming demos.</EmptyState>
            ) : (
              <ul className="space-y-3">
                {upcomingDemos.map((d) => (
                  <li key={d._id}>
                    <Link
                      to={`/leads/${d._id}`}
                      className="flex gap-3 rounded-2xl border border-slate-100 p-3 hover:bg-slate-50"
                    >
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <CalendarClock size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">
                          {d.name}
                          {d.company ? ` · ${d.company}` : ""}
                        </p>
                        <p className="text-sm text-slate-500">
                          {fmtDateTime(d.demoDate)} ·{" "}
                          {d.demoType === "OFFLINE" ? "Offline" : "Online"}
                        </p>
                        {d.location && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                            <MapPin size={12} /> {d.location}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Top performers" subtitle="By assigned leads">
            {topAssignees.length === 0 ? (
              <EmptyState>No assigned leads yet.</EmptyState>
            ) : (
              <ul className="space-y-3">
                {topAssignees.map((a) => (
                  <li key={a._id} className="flex items-center gap-3">
                    <Avatar name={a.name} size="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 truncate">
                        {a.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {a.leads} leads · {a.converted} converted
                      </p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">
                      {a.conversionRate}%
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Recent leads */}
        <Card
          title="Recent leads"
          action={
            <Link
              to="/leads"
              className="text-sm font-medium text-brand hover:underline"
            >
              View all
            </Link>
          }
        >
          {recentLeads.length === 0 ? (
            <EmptyState>No leads yet.</EmptyState>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="text-sm text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-3 text-left font-medium">Lead</th>
                    <th className="px-5 py-3 text-left font-medium">Source</th>
                    <th className="px-5 py-3 text-left font-medium">Request</th>
                    <th className="px-5 py-3 text-left font-medium">Assigned to</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3 text-left font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((l) => {
                    const meta = statusMeta(l.status);
                    return (
                      <tr
                        key={l._id}
                        onClick={() => navigate(`/leads/${l._id}`)}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-800">{l.name}</p>
                          <p className="text-sm text-slate-500">
                            {l.company || l.email}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {sourceLabel(l.source)}
                        </td>
                        <td className="px-5 py-3 text-slate-600 capitalize">
                          {l.requestType?.toLowerCase()}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {l.assignedTo?.name || "-"}
                        </td>
                        <td className="px-5 py-3">
                          <Badge className={meta.badge}>{meta.label}</Badge>
                        </td>
                        <td className="px-5 py-3 text-slate-500 text-sm">
                          {fmtDate(l.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
