import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Clock, ChartColumn, IndianRupee, Banknote, Play, Square, Trash2, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Card, StatCard, Badge, Avatar, Spinner, EmptyState, Modal, Field, PrimaryButton, GhostButton, DangerButton, IconButton, Pagination, SearchBox, inputClass } from "../components/ui";
import { fmtDate, downloadCsv } from "../utils/format";
import { can, homePath } from "../utils/permissions";

const PER_PAGE = 10;
const today = () => new Date().toISOString().slice(0, 10);
const pad = (n) => String(n).padStart(2, "0");
const clock = (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
const hrs = (n) => `${Math.round((n || 0) * 10) / 10}h`;

const empty = { date: today(), hours: "", project: "", task: "", notes: "", billable: true, user: "" };

export default function TimeTracking() {
  const canLog = can("timelogs.manage");

  const [data, setData] = useState(null);
  const [options, setOptions] = useState({ users: [], projects: [] });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // Timer lives in the browser; Stop opens the entry form with the elapsed hours.
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const tick = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/pm/time");
      setData(res.data);
    } catch {
      toast.error("Failed to load time entries");
      setData({ entries: [], stats: {}, weekly: [], scope: "mine" });
    }
  }, []);

  useEffect(() => {
    load();
    api.get("/pm/options").then((r) => setOptions(r.data)).catch(() => {});
  }, [load]);

  useEffect(() => {
    if (!running) return undefined;
    tick.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(tick.current);
  }, [running]);

  const stop = () => {
    setRunning(false);
    if (seconds < 36) {
      toast("Timer was under a minute, nothing to log", { icon: "ℹ️" });
      setSeconds(0);
      return;
    }
    setForm({ ...empty, hours: (Math.round((seconds / 3600) * 100) / 100).toString() });
    setOpen(true);
    setSeconds(0);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.project && !form.task.trim()) return toast.error("Select a project, or describe the support work");
    if (!form.date) return toast.error("Select a date");
    if (!(Number(form.hours) > 0 && Number(form.hours) <= 24)) return toast.error("Hours must be between 0 and 24");
    try {
      setSaving(true);
      await api.post("/pm/time", { ...form, hours: Number(form.hours) });
      toast.success("Time entry saved");
      setOpen(false);
      setForm(empty);
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/pm/time/${toDelete._id}`);
      toast.success("Entry deleted");
      setToDelete(null);
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete");
    }
  };

  const stats = data?.stats || {};
  const diff = Math.round(((stats.weekHours || 0) - (stats.lastWeekHours || 0)) * 10) / 10;

  const q = search.trim().toLowerCase();
  const entries = (data?.entries || []).filter(
    (e) => !q || [e.project?.name, e.task, e.user?.name, e.notes].some((v) => v?.toLowerCase().includes(q)),
  );
  const rows = entries.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportCsv = () =>
    downloadCsv("time-entries.csv", [
      ["Date", "Project", "Task", "User", "Hours", "Billable", "Notes"],
      ...entries.map((e) => [fmtDate(e.date), e.project?.name, e.task, e.user?.name, e.hours, e.billable ? "Yes" : "No", e.notes]),
    ]);

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Time Tracking"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Apps" }, { label: "Projects" }, { label: "Time Tracking" }]}
          actions={
            <>
              <GhostButton onClick={exportCsv} disabled={!entries.length}><Download size={18} /> Export</GhostButton>
              {canLog && <PrimaryButton onClick={() => { setForm(empty); setOpen(true); }}><Plus size={18} /> Add Entry</PrimaryButton>}
            </>
          }
        />

        {!data ? (
          <Spinner />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Hours This Week" value={hrs(stats.weekHours)} icon={<Clock size={26} />} hint={`${diff >= 0 ? "+" : ""}${diff}h vs last week`} />
              <StatCard label="Hours This Month" value={hrs(stats.monthHours)} icon={<ChartColumn size={26} />} tone="green" />
              <StatCard label="Billable Hours" value={hrs(stats.billableHours)} icon={<IndianRupee size={26} />} tone="amber" hint={`${stats.billableRate || 0}% billable rate`} />
              <StatCard label="Non-Billable" value={hrs(stats.nonBillableHours)} icon={<Banknote size={26} />} tone="indigo" />
            </div>

            <div className="grid gap-5 lg:grid-cols-5">
              <Card title="Timer" className="lg:col-span-2">
                <div className="py-6 text-center">
                  <div className="font-mono text-6xl font-bold text-slate-900">{clock(seconds)}</div>
                  <p className="mt-3 text-sm text-slate-500">{running ? "Tracking... press Stop to log it" : "Click start to begin tracking"}</p>
                  {canLog && (
                    <div className="mt-6">
                      {running ? (
                        <DangerButton onClick={stop}><Square size={16} /> Stop</DangerButton>
                      ) : (
                        <PrimaryButton onClick={() => setRunning(true)}><Play size={16} /> Start</PrimaryButton>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              <Card title="Weekly Hours Breakdown" className="lg:col-span-3">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.weekly}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" tickFormatter={(d) => d.slice(0, 3)} />
                      <YAxis unit="h" />
                      <Tooltip formatter={(v) => `${v}h`} />
                      <Legend />
                      <Bar dataKey="billable" name="Billable" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="nonBillable" name="Non-Billable" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search time entries..." />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <span className="text-lg font-semibold text-slate-900">Time Log</span>
                <span className="text-sm text-slate-500">{entries.length} entries{data.scope === "mine" ? " (yours)" : ""}</span>
              </div>
              {entries.length === 0 ? (
                <EmptyState>No time entries yet.</EmptyState>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-225 text-left">
                      <thead>
                        <tr className="bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                          <th className="p-4">Date</th><th className="p-4">Project</th><th className="p-4">Task</th><th className="p-4">User</th><th className="p-4">Hours</th><th className="p-4">Billable</th><th className="p-4">Notes</th>{canLog && <th className="p-4" />}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((e) => (
                          <tr key={e._id} className="border-t border-slate-100 hover:bg-slate-50/60">
                            <td className="p-4 text-slate-500">{fmtDate(e.date)}</td>
                            <td className="p-4 font-medium text-slate-900">{e.project?.name || "Support / other work"}</td>
                            <td className="p-4 text-slate-600">{e.task || "-"}</td>
                            <td className="p-4"><span className="inline-flex items-center gap-2"><Avatar name={e.user?.name} size="h-8 w-8" text="text-xs" />{e.user?.name}</span></td>
                            <td className="p-4 font-medium">{hrs(e.hours)}</td>
                            <td className="p-4"><Badge className={e.billable ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>{e.billable ? "Yes" : "No"}</Badge></td>
                            <td className="p-4 text-slate-500 max-w-xs truncate">{e.notes || "-"}</td>
                            {canLog && <td className="p-4"><IconButton tone="danger" onClick={() => setToDelete(e)} aria-label="Delete"><Trash2 size={15} /></IconButton></td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={page} perPage={PER_PAGE} total={entries.length} onChange={setPage} />
                </>
              )}
            </div>
          </>
        )}
      </div>

      <Modal
        open={open}
        title="Add Time Entry"
        onClose={() => setOpen(false)}
        footer={<><GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton><PrimaryButton disabled={saving} onClick={save}>Save Entry</PrimaryButton></>}
      >
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Date" required><input type="date" value={form.date} onChange={set("date")} className={inputClass} /></Field>
            <Field label="Hours" required><input type="number" min="0" max="24" step="0.25" value={form.hours} onChange={set("hours")} placeholder="0.0" className={inputClass} /></Field>
            <Field label="Project" hint="Leave empty for support or other work">
              <select value={form.project} onChange={set("project")} className={inputClass}>
                <option value="">No project (support / other work)</option>
                {options.projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Task"><input value={form.task} onChange={set("task")} placeholder="Task description" className={inputClass} /></Field>
          </div>
          {data?.scope === "all" && (
            <Field label="Log for" hint="Leave empty to log it for yourself.">
              <select value={form.user} onChange={set("user")} className={inputClass}>
                <option value="">Me</option>
                {options.users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Notes"><textarea rows={3} value={form.notes} onChange={set("notes")} placeholder="Additional notes..." className={inputClass} /></Field>
          <label className="flex items-center gap-3 text-slate-700 font-medium">
            <input type="checkbox" checked={form.billable} onChange={(e) => setForm((f) => ({ ...f, billable: e.target.checked }))} /> Billable
          </label>
        </div>
      </Modal>

      <Modal
        open={!!toDelete}
        title="Delete time entry"
        onClose={() => setToDelete(null)}
        footer={<><GhostButton onClick={() => setToDelete(null)}>Cancel</GhostButton><DangerButton onClick={remove}>Delete</DangerButton></>}
      >
        <p className="text-slate-600">Delete this {hrs(toDelete?.hours)} entry for <strong>{toDelete?.project?.name || "support / other work"}</strong>?</p>
      </Modal>
    </Layout>
  );
}
