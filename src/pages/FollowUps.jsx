import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Check,
  RefreshCw,
  Bell,
  Phone,
  Mail,
  Users,
  CalendarDays,
  Clock,
  TriangleAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import {
  PageHeader,
  StatCard,
  Badge,
  Spinner,
  EmptyState,
  Modal,
  Field,
  PrimaryButton,
  GhostButton,
  IconButton,
  inputClass,
} from "../components/ui";
import { FOLLOWUP_TYPES, followUpTypeMeta } from "../constants/crm";
import { fmtDateTime, toLocalInput } from "../utils/format";
import { can, homePath } from "../utils/permissions";

const TYPE_ICON = { CALL: Phone, EMAIL: Mail, MEETING: Users };
const TYPE_TILE = {
  CALL: "bg-emerald-100 text-emerald-600",
  EMAIL: "bg-sky-100 text-sky-600",
  MEETING: "bg-amber-100 text-amber-600",
};
const TABS = [
  { key: "ALL", label: "All" },
  { key: "UPCOMING", label: "Upcoming" },
  { key: "OVERDUE", label: "Overdue" },
  { key: "COMPLETED", label: "Completed" },
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const hhmm = (d) =>
  new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const empty = { lead: "", type: "CALL", notes: "", scheduledAt: "", reminder: false, assignedTo: "" };

export default function FollowUps() {
  const canManage = can("followups.manage");

  const [data, setData] = useState(null);
  const [options, setOptions] = useState({ users: [], leads: [] });
  const [tab, setTab] = useState("ALL");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [day, setDay] = useState(null); // selected calendar day (Date) or null

  const [editing, setEditing] = useState(null); // null | "new" | follow-up
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/crm/follow-ups");
      setData(res.data);
    } catch {
      toast.error("Failed to load follow-ups");
    }
  }, []);

  useEffect(() => {
    load();
    api
      .get("/crm/options")
      .then((res) => setOptions(res.data))
      .catch(() => {});
  }, [load]);

  const all = useMemo(() => data?.followUps || [], [data]);
  const today = new Date();

  const shown = useMemo(
    () =>
      all.filter((f) => {
        if (day && !sameDay(new Date(f.scheduledAt), day)) return false;
        if (tab === "UPCOMING") return f.status === "PENDING" && !f.overdue;
        if (tab === "OVERDUE") return f.overdue;
        if (tab === "COMPLETED") return f.status === "COMPLETED";
        return true;
      }),
    [all, tab, day],
  );

  const overdueList = all.filter((f) => f.overdue);
  const todayList = all.filter((f) => f.status === "PENDING" && sameDay(new Date(f.scheduledAt), today));

  // Calendar cells for the visible month
  const cells = useMemo(() => {
    const first = month.getDay();
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  }, [month]);

  const hasFollowUp = (n) =>
    all.some((f) => {
      const d = new Date(f.scheduledAt);
      return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth() && d.getDate() === n;
    });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openNew = () => {
    setForm(empty);
    setEditing("new");
  };

  const openEdit = (f) => {
    setForm({
      lead: f.lead?._id || "",
      type: f.type,
      notes: f.notes || "",
      scheduledAt: toLocalInput(f.scheduledAt),
      reminder: !!f.reminder,
      assignedTo: f.assignedTo?._id || "",
    });
    setEditing(f);
  };

  const save = async () => {
    if (!form.lead) return toast.error("Select a lead");
    if (!form.scheduledAt) return toast.error("Select date and time");

    // datetime-local has no timezone; convert so the server stores the exact moment.
    const body = { ...form, scheduledAt: new Date(form.scheduledAt).toISOString() };

    try {
      setSaving(true);
      if (editing === "new") await api.post("/crm/follow-ups", body);
      else await api.put(`/crm/follow-ups/${editing._id}`, body);
      toast.success(editing === "new" ? "Follow-up scheduled" : "Follow-up updated");
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save follow-up");
    } finally {
      setSaving(false);
    }
  };

  const toggleDone = async (f) => {
    try {
      await api.patch(`/crm/follow-ups/${f._id}/toggle`);
      load();
    } catch {
      toast.error("Failed to update follow-up");
    }
  };

  const toggleReminder = async (f) => {
    try {
      await api.put(`/crm/follow-ups/${f._id}`, { reminder: !f.reminder });
      toast.success(f.reminder ? "Reminder off" : "Reminder on");
      load();
    } catch {
      toast.error("Failed to update reminder");
    }
  };

  const remove = async (f) => {
    if (!window.confirm("Delete this follow-up?")) return;
    try {
      await api.delete(`/crm/follow-ups/${f._id}`);
      toast.success("Follow-up deleted");
      load();
    } catch {
      toast.error("Failed to delete follow-up");
    }
  };

  const stats = data?.stats;

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Follow-ups"
          breadcrumbs={[
            { label: "Home", to: homePath() },
            { label: "Apps" },
            { label: "CRM" },
            { label: "Follow-ups" },
          ]}
          actions={
            canManage && (
              <PrimaryButton onClick={openNew}>
                <Plus size={18} /> Add Follow-up
              </PrimaryButton>
            )
          }
        />

        {!data ? (
          <Spinner />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_380px] items-start">
            {/* Left: stats, tabs, list */}
            <div className="space-y-6 min-w-0">
              <div className="grid gap-5 sm:grid-cols-3">
                <StatCard label="Total Follow-ups" value={stats.total} icon={<CalendarDays size={26} />} />
                <StatCard label="Upcoming" value={stats.upcoming} icon={<Clock size={26} />} tone="amber" />
                <StatCard label="Overdue" value={stats.overdue} icon={<TriangleAlert size={26} />} tone="red" />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 flex gap-8 overflow-x-auto">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`py-5 border-b-2 font-semibold whitespace-nowrap ${
                      tab === t.key ? "border-brand text-brand" : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {t.label}
                    {t.key === "OVERDUE" && stats.overdue > 0 && (
                      <span className="ml-2 rounded-md bg-red-100 px-2 py-0.5 text-xs text-red-600">{stats.overdue}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                  <div role="heading" aria-level={2} className="text-lg font-semibold text-slate-900">
                    Follow-up Schedule
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    {day && (
                      <button onClick={() => setDay(null)} className="text-sm text-brand hover:underline">
                        Clear date filter
                      </button>
                    )}
                    <span>{shown.length} items</span>
                  </div>
                </div>

                {shown.length === 0 ? (
                  <EmptyState>No follow-ups here.</EmptyState>
                ) : (
                  <ul>
                    {shown.map((f) => {
                      const Icon = TYPE_ICON[f.type] || Phone;
                      const tm = followUpTypeMeta(f.type);
                      const done = f.status === "COMPLETED";
                      return (
                        <li
                          key={f._id}
                          className={`flex gap-4 px-6 py-5 border-t border-slate-100 first:border-t-0 ${
                            f.overdue ? "bg-red-50/70" : ""
                          }`}
                        >
                          <div className={`h-12 w-12 shrink-0 rounded-full flex items-center justify-center ${TYPE_TILE[f.type]}`}>
                            <Icon size={20} />
                          </div>

                          <div className="min-w-0 flex-1 text-left">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-lg font-bold text-slate-900">{f.lead?.name || "Deleted lead"}</p>
                                <p className="text-slate-500">{f.lead?.company || ""}</p>
                              </div>
                              <div className="flex gap-2">
                                <Badge className={tm.badge}>{tm.label}</Badge>
                                {f.overdue && <Badge className="bg-red-100 text-red-600">Overdue</Badge>}
                                {done && <Badge className="bg-emerald-100 text-emerald-700">Completed</Badge>}
                              </div>
                            </div>

                            {f.notes && <p className="mt-2 text-slate-500">{f.notes}</p>}

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                              <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                                <CalendarDays size={14} /> {fmtDateTime(f.scheduledAt)}
                                {f.assignedTo && <span>• {f.assignedTo.name}</span>}
                              </span>

                              {canManage && (
                                <div className="flex gap-2">
                                  <IconButton
                                    tone={done ? "default" : "success"}
                                    onClick={() => toggleDone(f)}
                                    aria-label={done ? "Reopen" : "Mark completed"}
                                    title={done ? "Reopen" : "Mark completed"}
                                  >
                                    <Check size={16} />
                                  </IconButton>
                                  {!done && (
                                    <IconButton tone="warn" onClick={() => openEdit(f)} aria-label="Reschedule" title="Reschedule">
                                      <RefreshCw size={16} />
                                    </IconButton>
                                  )}
                                  <IconButton
                                    onClick={() => toggleReminder(f)}
                                    aria-label="Toggle reminder"
                                    title={f.reminder ? "Reminder on" : "Reminder off"}
                                    className={f.reminder ? "!border-brand !text-brand !bg-brand-soft" : ""}
                                  >
                                    <Bell size={16} />
                                  </IconButton>
                                  <IconButton onClick={() => remove(f)} aria-label="Delete" title="Delete">
                                    <Trash2 size={16} />
                                  </IconButton>
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Right: calendar, overdue, today */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-left">
                <div className="flex items-center justify-between mb-4">
                  <div role="heading" aria-level={2} className="text-lg font-semibold text-slate-900">
                    {month.toLocaleString("en-US", { month: "long", year: "numeric" })}
                  </div>
                  <div className="flex gap-2">
                    <IconButton onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month">
                      <ChevronLeft size={16} />
                    </IconButton>
                    <IconButton onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month">
                      <ChevronRight size={16} />
                    </IconButton>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-y-2 text-center">
                  {DAY_NAMES.map((d) => (
                    <span key={d} className="text-sm font-semibold text-slate-500 pb-2">
                      {d}
                    </span>
                  ))}
                  {cells.map((n, i) => {
                    if (!n) return <span key={`e${i}`} />;
                    const date = new Date(month.getFullYear(), month.getMonth(), n);
                    const selected = day && sameDay(date, day);
                    const isToday = sameDay(date, today);
                    return (
                      <button
                        key={n}
                        onClick={() => setDay(selected ? null : date)}
                        className={`mx-auto h-9 w-9 rounded-full text-sm transition ${
                          selected
                            ? "bg-brand text-white font-semibold"
                            : hasFollowUp(n)
                              ? "border border-brand text-brand font-semibold hover:bg-brand-soft"
                              : isToday
                                ? "bg-slate-100 font-semibold text-slate-900"
                                : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 border-l-4 !border-l-red-500 shadow-sm text-left overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 text-red-600 font-semibold">
                  <TriangleAlert size={18} /> Overdue Follow-ups
                </div>
                {overdueList.length === 0 ? (
                  <p className="px-5 pb-5 text-slate-500">Nothing overdue. 🎉</p>
                ) : (
                  overdueList.slice(0, 6).map((f) => (
                    <div key={f._id} className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-100">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{f.lead?.name || "Deleted lead"}</p>
                        <p className="text-sm text-slate-500">
                          {new Date(f.scheduledAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} -{" "}
                          {followUpTypeMeta(f.type).label}
                        </p>
                      </div>
                      {canManage && (
                        <button
                          onClick={() => openEdit(f)}
                          className="shrink-0 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                        >
                          Action
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm text-left">
                <div className="flex items-center gap-2 px-5 py-4 font-semibold text-slate-900">
                  <Bell size={18} /> Today&apos;s Schedule
                </div>
                {todayList.length === 0 ? (
                  <p className="px-5 pb-5 text-slate-500">No follow-ups scheduled for today.</p>
                ) : (
                  <div className="px-4 pb-4 space-y-3">
                    {todayList.map((f) => (
                      <div key={f._id} className="flex items-center gap-4 rounded-xl bg-slate-50 px-4 py-3">
                        <span className="font-bold text-brand">{hhmm(f.scheduledAt)}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {followUpTypeMeta(f.type).label} - {f.lead?.name || "Deleted lead"}
                          </p>
                          <p className="text-sm text-slate-500 truncate">{f.lead?.company || ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={!!editing}
        title={editing === "new" ? "Add Follow-up" : "Edit Follow-up"}
        onClose={() => setEditing(null)}
        footer={
          <>
            <GhostButton onClick={() => setEditing(null)}>Cancel</GhostButton>
            <PrimaryButton onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save Follow-up"}
            </PrimaryButton>
          </>
        }
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Lead" required>
              <select value={form.lead} onChange={set("lead")} className={inputClass}>
                <option value="">Select lead</option>
                {options.leads.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                    {l.company ? ` - ${l.company}` : ""}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Type">
            <select value={form.type} onChange={set("type")} className={inputClass}>
              {FOLLOWUP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date & time" required>
            <input type="datetime-local" value={form.scheduledAt} onChange={set("scheduledAt")} className={inputClass} />
          </Field>
          <Field label="Assigned to">
            <select value={form.assignedTo} onChange={set("assignedTo")} className={inputClass}>
              <option value="">Unassigned</option>
              {options.users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-3 sm:mt-8 text-slate-700">
            <input
              type="checkbox"
              checked={form.reminder}
              onChange={(e) => setForm((f) => ({ ...f, reminder: e.target.checked }))}
              className="h-5 w-5 rounded border-slate-300 accent-[#7c3aed]"
            />
            Set reminder
          </label>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <textarea rows={3} value={form.notes} onChange={set("notes")} placeholder="What to discuss..." className={inputClass} />
            </Field>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
