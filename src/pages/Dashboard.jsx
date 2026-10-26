import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RefreshCw, Download, ArrowUpRight, IndianRupee, Users, FolderKanban, ListTodo, Clock, CalendarDays, Plus, FileText, UserPlus, Mail, Settings, ChartColumn, TriangleAlert } from "lucide-react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { Spinner, EmptyState, Badge, PrimaryButton, GhostButton } from "../components/ui";
import { EdgeCard, DeltaPill, SectionCard } from "../components/dashboard/parts";
import { apiError, THEAD, TROW, moneyTick } from "../components/finance/helpers";
import { invoiceStatusMeta, CHART_COLORS } from "../constants/finance";
import { typeMeta } from "../constants/notifications";
import { fmtMoney, fmtShort, fmtDate, timeAgo, downloadCsv } from "../utils/format";
import { can, getUser } from "../utils/permissions";

const QUARTERS = { Q1: [0, 3], Q2: [3, 6], Q3: [6, 9], Q4: [9, 12], Year: [0, 12] };
const DOT = { green: "bg-emerald-500", violet: "bg-violet-500", amber: "bg-amber-500", cyan: "bg-cyan-500", red: "bg-red-500" };

export default function Dashboard() {
  const user = getUser();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [quarter, setQuarter] = useState("Year");
  const [spin, setSpin] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.get("/home/overview");
      setData(d);
      setError("");
    } catch (e) {
      setError(apiError(e, "Failed to load the dashboard"));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => { setSpin(true); await load(); setSpin(false); };

  const markRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      load();
    } catch (e) {
      toast.error(apiError(e, "Failed to update"));
    }
  };

  const first = user?.name?.split(" ")[0] || "there";
  const d = data;

  // Cards use whatever the person is allowed to see, most useful first
  const edge = useMemo(() => {
    if (!d) return [];
    const list = [];
    if (d.finance) list.push({ color: "#7c3aed", icon: <IndianRupee size={26} />, label: "Revenue This Year", value: fmtShort(d.finance.ytd), delta: d.finance.ytdChange, spark: d.finance.spark, hint: "vs same time last year" });
    if (d.crm) list.push({ color: "#10b981", icon: <Users size={26} />, label: "Leads This Month", value: d.crm.month, delta: d.crm.monthChange, spark: d.crm.spark, hint: `${d.crm.conversion}% became projects` });
    if (d.projects) list.push({ color: "#f59e0b", icon: <FolderKanban size={26} />, label: "Active Projects", value: d.projects.active, hint: `${d.projects.openTasks} open tasks` });
    list.push({ color: "#06b6d4", icon: <ListTodo size={26} />, label: "My Open Tasks", value: d.mine.open, hint: d.mine.overdue ? `${d.mine.overdue} overdue` : "Nothing overdue" });
    if (!d.projects) list.push({ color: "#f59e0b", icon: <Clock size={26} />, label: "My Hours This Week", value: `${d.mine.hoursWeek}h` });
    return list.slice(0, 4);
  }, [d]);

  const overview = useMemo(() => {
    if (!d) return [];
    const list = [];
    if (d.finance) list.push({ icon: <IndianRupee size={20} />, tint: "bg-indigo-50 text-indigo-500", label: "Revenue", value: fmtShort(d.finance.month), delta: d.finance.monthChange });
    if (d.crm) list.push({ icon: <Users size={20} />, tint: "bg-emerald-50 text-emerald-500", label: "New leads", value: d.crm.month, delta: d.crm.monthChange });
    list.push({ icon: <ListTodo size={20} />, tint: "bg-cyan-50 text-cyan-500", label: "Open tasks", value: d.mine.open });
    list.push({ icon: <Clock size={20} />, tint: "bg-amber-50 text-amber-500", label: "Hours this week", value: `${d.mine.hoursWeek}h` });
    list.push({ icon: <CalendarDays size={20} />, tint: "bg-pink-50 text-pink-500", label: "Events today", value: d.mine.eventsToday });
    return list.slice(0, 4);
  }, [d]);

  const chart = useMemo(() => {
    if (!d?.finance) return [];
    const [a, b] = QUARTERS[quarter];
    return d.finance.byMonth.slice(a, b);
  }, [d, quarter]);

  const actions = [
    { label: "Add Lead", sub: "Capture a new enquiry", to: "/add-lead", perm: "leads.manage", icon: <UserPlus size={21} />, tint: "bg-violet-50 text-violet-500" },
    { label: "Create Invoice", sub: "Bill a client", to: "/finance/invoices", perm: "invoices.manage", icon: <FileText size={21} />, tint: "bg-emerald-50 text-emerald-500" },
    { label: can("projecttasks.manage") ? "Assign Task" : "Add Task", sub: "Plan the work", to: can("projecttasks.manage") ? "/pm/tasks" : "/my-work", icon: <Plus size={21} />, tint: "bg-amber-50 text-amber-500" },
    { label: "Add Event", sub: "Schedule a meeting", to: "/calendar", icon: <CalendarDays size={21} />, tint: "bg-cyan-50 text-cyan-500" },
    { label: "Email Campaign", sub: "Send to your leads", to: "/campaigns", perm: "campaigns.manage", icon: <Mail size={21} />, tint: "bg-pink-50 text-pink-500" },
    { label: "Manage Users", sub: "Team and access", to: "/users", perm: "users.view", icon: <Settings size={21} />, tint: "bg-slate-100 text-slate-500" },
  ].filter((a) => !a.perm || can(a.perm)).slice(0, 4);

  const exportSummary = () => {
    const rows = [["Item", "Value"], ["Date", new Date().toLocaleDateString("en-IN")]];
    if (d.finance) rows.push(["Revenue this year (INR)", d.finance.ytd], ["Revenue this month (INR)", d.finance.month]);
    if (d.invoices) rows.push(["Pending invoices (INR)", d.invoices.pending], ["Overdue invoices", d.invoices.overdue]);
    if (d.crm) rows.push(["Leads this month", d.crm.month], ["Lead to project %", d.crm.conversion]);
    if (d.projects) rows.push(["Active projects", d.projects.active], ["Open tasks (all)", d.projects.openTasks]);
    rows.push(["My open tasks", d.mine.open], ["My overdue tasks", d.mine.overdue], ["My hours this week", d.mine.hoursWeek]);
    downloadCsv(`dashboard-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const crumbs = [{ label: "Home" }, { label: "Dashboard" }];
  const Head = (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="text-left">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-500">{crumbs.map((c) => c.label).join(" / ")}</p>
      </div>
      <div className="flex gap-3">
        <GhostButton onClick={refresh} disabled={spin}><RefreshCw size={18} className={spin ? "animate-spin" : ""} /> Refresh</GhostButton>
        <PrimaryButton onClick={exportSummary} disabled={!d}><Download size={18} /> Download Report</PrimaryButton>
      </div>
    </div>
  );

  if (!d) return <Layout><div className="space-y-6">{Head}{error ? <SectionCard title="Something went wrong"><p className="text-slate-600">{error}</p></SectionCard> : <Spinner />}</div></Layout>;

  const headline = [
    d.finance ? `Revenue is ${d.finance.monthChange >= 0 ? "up" : "down"} ${Math.abs(d.finance.monthChange)}% this month` : null,
    d.mine.overdue ? `${d.mine.overdue} of your tasks ${d.mine.overdue === 1 ? "is" : "are"} overdue` : d.mine.dueToday ? `${d.mine.dueToday} task${d.mine.dueToday === 1 ? " is" : "s are"} due today` : "you have no overdue tasks",
  ].filter(Boolean);

  const chips = [
    d.crm?.followUpsDue ? { icon: <Users size={16} />, text: `${d.crm.followUpsDue} Follow-up${d.crm.followUpsDue > 1 ? "s" : ""} Due`, to: "/crm/follow-ups", tone: "amber" } : null,
    d.invoices?.overdue ? { icon: <TriangleAlert size={16} />, text: `${d.invoices.overdue} Overdue Invoice${d.invoices.overdue > 1 ? "s" : ""}`, to: "/finance/invoices", tone: "red" } : null,
    d.notifications.unread ? { icon: <Mail size={16} />, text: `${d.notifications.unread} Unread Notification${d.notifications.unread > 1 ? "s" : ""}`, to: "/notifications", tone: "violet" } : null,
    d.mine.eventsToday ? { icon: <CalendarDays size={16} />, text: `${d.mine.eventsToday} Event${d.mine.eventsToday > 1 ? "s" : ""} Today`, to: "/calendar", tone: "cyan" } : null,
  ].filter(Boolean);
  const chipTone = { amber: "border-amber-200 bg-amber-50/60 text-amber-700", red: "border-red-200 bg-red-50/60 text-red-700", violet: "border-violet-200 bg-violet-50/60 text-violet-700", cyan: "border-cyan-200 bg-cyan-50/60 text-cyan-700" };

  return (
    <Layout>
      <div className="space-y-6">
        {Head}

        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3 rounded-3xl border border-violet-100 bg-linear-to-br from-indigo-50 via-violet-50 to-white p-7 text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
            <h2 className="mt-5 text-4xl font-bold text-slate-900">Welcome back, {first}!</h2>
            <p className="mt-3 text-lg text-slate-600">{headline.join(" and ").replace(/^./, (c) => c.toUpperCase())}.</p>

            {chips.length > 0 && <div className="mt-5 flex flex-wrap gap-3">{chips.map((c) => <Link key={c.text} to={c.to} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold ${chipTone[c.tone]}`}>{c.icon}{c.text}</Link>)}</div>}

            <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs font-bold tracking-widest text-slate-500">RECENT ACTIVITY</p>
              {d.activity[0] ? (
                <p className="mt-3 flex items-start gap-3 text-slate-800"><span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[d.activity[0].tone]}`} /><span>{d.activity[0].text}<span className="block text-sm text-slate-400">{timeAgo(d.activity[0].at)}</span></span></p>
              ) : <p className="mt-3 text-slate-400">Nothing yet. New leads, payments and finished tasks will show here.</p>}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <PrimaryButton onClick={() => navigate(can("analytics.view") ? "/analytics/sales" : "/my-work")}>{can("analytics.view") ? "View Analytics" : "Open My Work"} <ArrowUpRight size={17} /></PrimaryButton>
              <GhostButton onClick={exportSummary}><FileText size={17} /> Download Report</GhostButton>
            </div>
          </div>

          <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-linear-to-br from-white to-violet-50/50 p-7 text-left">
            <div className="flex items-start justify-between"><div><p className="text-xl font-bold text-slate-900">Today&apos;s Overview</p><p className="text-sm text-slate-500">Your numbers right now</p></div><span className="h-11 w-11 rounded-xl bg-white border border-slate-200 text-brand flex items-center justify-center"><ChartColumn size={20} /></span></div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              {overview.map((o) => (
                <div key={o.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between"><span className={`h-10 w-10 rounded-xl flex items-center justify-center ${o.tint}`}>{o.icon}</span><DeltaPill value={o.delta} /></div>
                  <p className="mt-3 text-3xl font-bold text-slate-900">{o.value}</p>
                  <p className="text-slate-500">{o.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{edge.map((c) => <EdgeCard key={c.label} {...c} />)}</div>

        <div className="grid gap-6 xl:grid-cols-2">
          {d.finance ? (
            <SectionCard
              title="Revenue Analytics"
              subtitle="Money received, by service"
              action={<div className="flex flex-wrap justify-end gap-2">{Object.keys(QUARTERS).map((q) => <button key={q} onClick={() => setQuarter(q)} className={`px-3.5 py-1.5 rounded-lg border text-sm font-semibold ${quarter === q ? "bg-brand text-white border-brand" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>{q}</button>)}</div>}
            >
              {d.finance.serviceKeys.length === 0 ? <EmptyState>No payments received this year yet.</EmptyState> : (
                <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" /><YAxis tickFormatter={moneyTick} width={64} />
                  <Tooltip formatter={(v) => fmtMoney(v)} /><Legend />
                  {d.finance.serviceKeys.map((k, i) => <Bar key={k} dataKey={k} stackId="a" fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </BarChart></ResponsiveContainer></div>
              )}
            </SectionCard>
          ) : (
            <SectionCard title="Today" subtitle="What is coming up for you">
              {d.mine.nextEvents.length === 0 ? <EmptyState>No events today.</EmptyState> : <ul className="divide-y divide-slate-100">{d.mine.nextEvents.map((e, i) => <li key={i} className="py-3 flex justify-between"><span className="font-medium text-slate-900">{e.title}</span><span className="text-slate-500">{e.allDay ? "All day" : new Date(e.start).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</span></li>)}</ul>}
            </SectionCard>
          )}

          {d.crm ? (
            <SectionCard title="Leads Overview" subtitle="New leads and wins, last 7 days">
              <div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={d.crm.week}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" /><YAxis allowDecimals={false} />
                <Tooltip /><Legend />
                <Area type="monotone" dataKey="leads" name="New leads" stroke="#6366f1" fill="#6366f122" strokeWidth={2.5} />
                <Area type="monotone" dataKey="won" name="Won" stroke="#10b981" fill="#10b98122" strokeWidth={2} />
              </AreaChart></ResponsiveContainer></div>
            </SectionCard>
          ) : (
            <SectionCard title="My Tasks" subtitle="Your work at a glance">
              <div className="grid grid-cols-3 gap-4 text-center">
                {[["Open", d.mine.open, "text-slate-900"], ["Due today", d.mine.dueToday, "text-amber-600"], ["Overdue", d.mine.overdue, "text-red-600"]].map(([l, v, c]) => <div key={l} className="rounded-2xl border border-slate-200 p-5"><p className={`text-4xl font-bold ${c}`}>{v}</p><p className="text-slate-500">{l}</p></div>)}
              </div>
              <Link to="/my-work" className="mt-5 inline-flex items-center gap-2 font-semibold text-brand">Open My Work <ArrowUpRight size={16} /></Link>
            </SectionCard>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {d.invoices ? (
            <SectionCard title="Recent Invoices" subtitle="Latest billing" action={<Link to="/finance/invoices"><PrimaryButton className="!py-2">View All</PrimaryButton></Link>}>
              {d.invoices.recent.length === 0 ? <EmptyState>No invoices yet.</EmptyState> : (
                <div className="-mx-6 -my-6 overflow-x-auto">
                  <table className="w-full min-w-120 text-left">
                    <thead><tr className={THEAD}><th className="p-4">Invoice</th><th className="p-4">Client</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Date</th></tr></thead>
                    <tbody>{d.invoices.recent.map((i) => { const m = invoiceStatusMeta(i.status); return (
                      <tr key={i._id} className={TROW}><td className="p-4 font-semibold text-brand">{i.number}</td><td className="p-4 font-medium text-slate-900">{i.clientName}</td><td className="p-4 font-bold">{fmtMoney(i.total)}</td><td className="p-4"><Badge className={m.badge}>{m.label}</Badge></td><td className="p-4 text-slate-500 whitespace-nowrap">{fmtDate(i.issueDate)}</td></tr>
                    ); })}</tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          ) : <div className="hidden xl:block" />}

          <SectionCard title="Activity Feed" subtitle="Recent happenings" action={<Link to="/notifications"><GhostButton className="!py-2">View All</GhostButton></Link>}>
            {d.activity.length === 0 ? <EmptyState>No activity yet.</EmptyState> : (
              <ul className="divide-y divide-slate-100 -my-3">{d.activity.map((a, i) => (
                <li key={i} className="flex items-start gap-4 py-4"><span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[a.tone]}`} /><div className="min-w-0"><p className="text-slate-800">{a.text}</p><p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-400"><Clock size={13} /> {timeAgo(a.at)}</p></div></li>
              ))}</ul>
            )}
          </SectionCard>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            d.projects && { label: "Team hours (7 days)", value: `${d.projects.hoursWeek}h`, hint: "Logged in time tracking", dot: "green" },
            d.projects && { label: "Overdue tasks", value: d.projects.overdue, hint: `${d.projects.openTasks} open in total`, dot: d.projects.overdue ? "red" : "green" },
            d.invoices && { label: "Pending invoices", value: fmtShort(d.invoices.pending), hint: d.invoices.overdue ? `${d.invoices.overdue} overdue` : "None overdue", dot: d.invoices.overdue ? "amber" : "green" },
            d.subscriptions && { label: "Recurring revenue", value: fmtShort(d.subscriptions.mrr), hint: `${d.subscriptions.active} paying subscriptions`, dot: "violet" },
            { label: "My hours (7 days)", value: `${d.mine.hoursWeek}h`, hint: "From My Work", dot: "cyan" },
          ].filter(Boolean).slice(0, 4).map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 text-left">
              <div className="flex items-center justify-between"><p className="text-xs font-bold tracking-widest text-slate-500 uppercase">{s.label}</p><span className={`h-2.5 w-2.5 rounded-full ${DOT[s.dot]}`} /></div>
              <p className="mt-3 text-3xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-400">{s.hint}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard title="Quick Actions" subtitle="Frequently used shortcuts">
            <div className="grid gap-4 sm:grid-cols-2">
              {actions.map((a) => (
                <Link key={a.label} to={a.to} className="flex items-center gap-4 rounded-2xl border border-slate-200 p-5 hover:border-brand hover:shadow-sm transition">
                  <span className={`h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center ${a.tint}`}>{a.icon}</span>
                  <span><span className="block text-lg font-bold text-slate-900">{a.label}</span><span className="block text-sm text-slate-400">{a.sub}</span></span>
                </Link>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Notifications"
            subtitle="Alerts and updates"
            action={<div className="flex items-center gap-2">{d.notifications.unread > 0 && <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-600">{d.notifications.unread} New</span>}<GhostButton className="!py-2" onClick={markRead} disabled={!d.notifications.unread}>Mark Read</GhostButton></div>}
          >
            {d.notifications.latest.length === 0 ? <EmptyState>You&apos;re all caught up.</EmptyState> : (
              <ul className="divide-y divide-slate-100 -my-3">{d.notifications.latest.map((n) => {
                const m = typeMeta(n.type); const Icon = m.icon;
                return (
                  <li key={n._id}><button onClick={() => navigate(n.link || "/notifications")} className="w-full flex items-start gap-4 py-4 text-left">
                    <span className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center ${m.tint}`}><Icon size={20} /></span>
                    <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className={`font-bold ${n.read ? "text-slate-600" : "text-slate-900"}`}>{n.title}</span>{!n.read && <span className="h-2 w-2 rounded-full bg-brand" />}</span>{n.message && <span className="block text-slate-500 truncate">{n.message}</span>}<span className="mt-1 flex items-center gap-1.5 text-sm text-slate-400"><Clock size={13} /> {timeAgo(n.createdAt)}</span></span>
                  </button></li>
                );
              })}</ul>
            )}
          </SectionCard>
        </div>
      </div>
    </Layout>
  );
}
