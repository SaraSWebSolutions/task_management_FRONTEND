import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Clock, ListTodo, CalendarClock, TriangleAlert, Timer, Pencil, Trash2, FolderKanban } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Card, Badge, Spinner, EmptyState, Modal, Field, PrimaryButton, GhostButton, DangerButton, IconButton, SearchBox, inputClass } from "../components/ui";
import { KpiCard, SelectBox } from "../components/finance/bits";
import { THEAD, TROW, apiError } from "../components/finance/helpers";
import { Segmented } from "../components/analytics/parts";
import { localYmd } from "../components/analytics/helpers";
import { fmtDate } from "../utils/format";
import { getUser } from "../utils/permissions";

const STATUSES = [
  { value: "TODO", label: "To do", badge: "bg-slate-100 text-slate-600" },
  { value: "IN_PROGRESS", label: "In progress", badge: "bg-blue-100 text-blue-700" },
  { value: "REVIEW", label: "In review", badge: "bg-amber-100 text-amber-700" },
  { value: "DONE", label: "Done", badge: "bg-emerald-100 text-emerald-700" },
];
const statusMeta = (v) => STATUSES.find((s) => s.value === v) || STATUSES[0];
const CATEGORY = { SUPPORT: ["Support", "bg-violet-100 text-violet-700"], OTHER: ["Other work", "bg-slate-100 text-slate-600"] };

const blankTask = { title: "", projectChoice: "SUPPORT", dueDate: "", estimatedHours: "", description: "" };
const blankTime = () => ({ taskRef: "", date: localYmd(), mode: "hours", hours: "", startTime: "", endTime: "", notes: "" });

export default function MyWork() {
  const user = getUser();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("OPEN");
  const [project, setProject] = useState("");
  const [search, setSearch] = useState("");

  const [taskOpen, setTaskOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [taskForm, setTaskForm] = useState(blankTask);
  const [timeOpen, setTimeOpen] = useState(false);
  const [timeForm, setTimeForm] = useState(blankTime());
  const [toDelete, setToDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.get("/my-work");
      setData(d);
      setError("");
    } catch (e) {
      setError(apiError(e, "Failed to load your work"));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tasks = useMemo(() => data?.tasks || [], [data]);
  const q = search.trim().toLowerCase();
  const rows = tasks.filter(
    (t) =>
      (filter === "ALL" || (filter === "OPEN" ? t.status !== "DONE" : t.status === filter)) &&
      (!project || (project === "NONE" ? !t.project : t.project?._id === project)) &&
      (!q || t.title.toLowerCase().includes(q)),
  );

  const setT = (k) => (e) => setTaskForm((f) => ({ ...f, [k]: e.target.value }));
  const setM = (k) => (e) => setTimeForm((f) => ({ ...f, [k]: e.target.value }));

  const openAdd = () => { setEditing(null); setTaskForm(blankTask); setTaskOpen(true); };
  const openEdit = (t) => {
    setEditing(t);
    setTaskForm({
      title: t.title, projectChoice: t.project ? t.project._id : t.category,
      dueDate: t.dueDate ? localYmd(t.dueDate) : "", estimatedHours: t.estimatedHours || "", description: t.description || "",
    });
    setTaskOpen(true);
  };

  const saveTask = async () => {
    if (!taskForm.title.trim()) return toast.error("Enter the task title");
    const isProject = !["SUPPORT", "OTHER"].includes(taskForm.projectChoice);
    const body = {
      title: taskForm.title, description: taskForm.description, dueDate: taskForm.dueDate || undefined,
      estimatedHours: taskForm.estimatedHours === "" ? 0 : Number(taskForm.estimatedHours),
      project: isProject ? taskForm.projectChoice : undefined,
      category: isProject ? "PROJECT" : taskForm.projectChoice,
    };
    try {
      setSaving(true);
      if (editing) await api.put(`/my-work/tasks/${editing._id}`, body);
      else await api.post("/my-work/tasks", body);
      toast.success(editing ? "Task updated" : "Task added");
      setTaskOpen(false);
      load();
    } catch (e) {
      toast.error(apiError(e, "Failed to save task"));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (t, status) => {
    try {
      await api.patch(`/my-work/tasks/${t._id}/status`, { status });
      load();
    } catch (e) {
      toast.error(apiError(e, "Failed to update status"));
    }
  };

  const openTime = (t) => { setTimeForm({ ...blankTime(), taskRef: t?._id || "" }); setTimeOpen(true); };

  const saveTime = async () => {
    if (!timeForm.taskRef) return toast.error("Select the task");
    const body = { taskRef: timeForm.taskRef, date: timeForm.date, notes: timeForm.notes };
    if (timeForm.mode === "hours") {
      if (!(Number(timeForm.hours) > 0)) return toast.error("Enter the hours spent");
      body.hours = Number(timeForm.hours);
    } else {
      if (!timeForm.startTime || !timeForm.endTime) return toast.error("Enter the from and to time");
      body.startTime = timeForm.startTime;
      body.endTime = timeForm.endTime;
    }
    try {
      setSaving(true);
      const { data: r } = await api.post("/my-work/time", body);
      toast.success(r.message);
      setTimeOpen(false);
      load();
    } catch (e) {
      toast.error(apiError(e, "Failed to log time"));
    } finally {
      setSaving(false);
    }
  };

  const removeTime = async (id) => {
    try {
      await api.delete(`/my-work/time/${id}`);
      toast.success("Time entry deleted");
      load();
    } catch (e) {
      toast.error(apiError(e, "Failed to delete"));
    }
  };

  const removeTask = async () => {
    try {
      await api.delete(`/my-work/tasks/${toDelete._id}`);
      toast.success("Task deleted");
      setToDelete(null);
      load();
    } catch (e) {
      toast.error(apiError(e, "Failed to delete"));
      setToDelete(null);
    }
  };

  const crumbs = [{ label: "Home" }, { label: "My Work" }];
  if (!data) {
    return (
      <Layout>
        <PageHeader title="My Work" breadcrumbs={crumbs} />
        {error ? <Card><p className="py-8 text-center text-slate-600">{error}</p></Card> : <Spinner />}
      </Layout>
    );
  }

  const s = data.stats;
  const openTasks = tasks.filter((t) => t.status !== "DONE");
  // minutes for the live preview of a from-to entry
  const mins = (v) => { const m = /^(\d{1,2}):(\d{2})$/.exec(v || ""); return m ? +m[1] * 60 + +m[2] : null; };
  const span = mins(timeForm.endTime) != null && mins(timeForm.startTime) != null ? mins(timeForm.endTime) - mins(timeForm.startTime) : null;

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="My Work"
          breadcrumbs={crumbs}
          actions={
            <>
              <GhostButton onClick={() => openTime(null)} disabled={!openTasks.length}><Clock size={18} /> Log Time</GhostButton>
              <PrimaryButton onClick={openAdd}><Plus size={18} /> Add Task</PrimaryButton>
            </>
          }
        />
        <p className="text-sm text-slate-500 -mt-2">Hi {user?.name?.split(" ")[0] || "there"}. Tasks your manager gave you appear here. Doing support or other work with no project? Add it as your own task.</p>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Open Tasks" value={s.open} icon={<ListTodo size={26} />} hint={`${s.inProgress} in progress`} />
          <KpiCard label="Due Today" value={s.dueToday} icon={<CalendarClock size={26} />} tone="amber" />
          <KpiCard label="Overdue" value={s.overdue} icon={<TriangleAlert size={26} />} tone="red" />
          <KpiCard label="Hours This Week" value={`${s.hoursWeek}h`} icon={<Timer size={26} />} tone="green" hint={`${s.doneWeek} tasks done this week`} />
        </div>

        {data.projects.length > 0 && (
          <div>
            <p className="text-lg font-semibold text-slate-900 mb-3">My Projects</p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.projects.map((p) => (
                <div key={p._id} className="bg-white rounded-2xl border border-slate-200 p-5 text-left">
                  <div className="flex items-start gap-3">
                    <span className="h-11 w-11 rounded-xl bg-violet-50 text-brand flex items-center justify-center shrink-0"><FolderKanban size={20} /></span>
                    <div className="min-w-0"><p className="font-bold text-slate-900 truncate">{p.name}</p>{p.clientName && <p className="text-sm text-slate-500 truncate">{p.clientName}</p>}</div>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-brand" style={{ width: `${p.tasks ? (p.done / p.tasks) * 100 : 0}%` }} /></div>
                  <p className="mt-2 text-sm text-slate-500">{p.done}/{p.tasks} of my tasks done{p.overdue ? <span className="text-red-600 font-medium"> · {p.overdue} overdue</span> : null}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col xl:flex-row xl:items-center gap-4">
          <Segmented value={filter} onChange={setFilter} options={[{ value: "OPEN", label: "Open" }, ...STATUSES.map((st) => ({ value: st.value, label: st.label })), { value: "ALL", label: "All" }]} />
          <SelectBox value={project} onChange={setProject} className="xl:w-64">
            <option value="">All projects</option>
            {data.projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            <option value="NONE">Support / other work</option>
          </SelectBox>
          <div className="xl:flex-1"><SearchBox value={search} onChange={setSearch} placeholder="Search tasks..." /></div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Tasks ({rows.length})</div>
          {rows.length === 0 ? <EmptyState>{tasks.length ? "No tasks match." : "No tasks yet. Your manager's tasks and your own will show here."}</EmptyState> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-225 text-left">
                <thead><tr className={THEAD}><th className="p-4">Task</th><th className="p-4">Due</th><th className="p-4">Status</th><th className="p-4">Time (logged / est.)</th><th className="p-4" /></tr></thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t._id} className={TROW}>
                      <td className="p-4">
                        <p className="font-semibold text-slate-900">{t.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                          {t.project ? <span>{t.project.name}</span> : <Badge className={CATEGORY[t.category]?.[1]}>{CATEGORY[t.category]?.[0] || "Other work"}</Badge>}
                          {!t.mine && <span className="text-xs text-slate-400">assigned by manager</span>}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">{t.dueDate ? <span className={t.overdue ? "text-red-600 font-semibold" : t.dueToday ? "text-amber-600 font-semibold" : "text-slate-600"}>{fmtDate(t.dueDate)}{t.overdue ? " (late)" : t.dueToday ? " (today)" : ""}</span> : <span className="text-slate-400">-</span>}</td>
                      <td className="p-4">
                        <select value={t.status} onChange={(e) => changeStatus(t, e.target.value)} className={`rounded-md px-2.5 py-1 text-xs font-medium border-0 outline-none cursor-pointer ${statusMeta(t.status).badge}`}>
                          {STATUSES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
                        </select>
                      </td>
                      <td className="p-4 whitespace-nowrap"><span className="font-semibold">{t.loggedHours}h</span><span className="text-slate-400"> / {t.estimatedHours ? `${t.estimatedHours}h` : "-"}</span></td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-end">
                          {t.status !== "DONE" && <GhostButton className="!px-3 !py-1.5 text-sm" onClick={() => openTime(t)}><Clock size={14} /> Log time</GhostButton>}
                          {t.mine && <IconButton onClick={() => openEdit(t)} aria-label="Edit"><Pencil size={15} /></IconButton>}
                          {t.mine && <IconButton tone="danger" onClick={() => setToDelete(t)} aria-label="Delete"><Trash2 size={15} /></IconButton>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">My Time (last 14 days)</div>
          {data.time.length === 0 ? <EmptyState>No time logged yet. Use Log Time on a task.</EmptyState> : (
            <ul className="divide-y divide-slate-100">
              {data.time.map((e) => (
                <li key={e._id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{e.taskRef?.title || e.task || "Work"}</p>
                    <p className="text-sm text-slate-500">{fmtDate(e.date)} · {e.project?.name || "Support / other work"}{e.startTime && e.endTime ? ` · ${e.startTime} to ${e.endTime}` : ""}{e.notes ? ` · ${e.notes}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-3"><span className="font-bold text-slate-900">{e.hours}h</span><IconButton tone="danger" onClick={() => removeTime(e._id)} aria-label="Delete time entry"><Trash2 size={15} /></IconButton></div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Modal
        open={taskOpen}
        title={editing ? "Edit Task" : "Add Task"}
        onClose={() => setTaskOpen(false)}
        footer={<><GhostButton onClick={() => setTaskOpen(false)}>Cancel</GhostButton><PrimaryButton disabled={saving} onClick={saveTask}>{editing ? "Save Changes" : "Add Task"}</PrimaryButton></>}
      >
        <div className="space-y-5">
          <Field label="Task" required><input value={taskForm.title} onChange={setT("title")} placeholder="What are you working on?" className={inputClass} /></Field>
          <Field label="Project / type" hint="Not on a project? Choose Support or Other work.">
            <select value={taskForm.projectChoice} onChange={setT("projectChoice")} disabled={!!editing?.project} className={inputClass}>
              {data.projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              <option value="SUPPORT">No project: Support work</option>
              <option value="OTHER">No project: Other work</option>
            </select>
          </Field>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Due date"><input type="date" value={taskForm.dueDate} onChange={setT("dueDate")} className={inputClass} /></Field>
            <Field label="Estimated hours"><input type="number" min="0" step="0.25" value={taskForm.estimatedHours} onChange={setT("estimatedHours")} placeholder="0" className={inputClass} /></Field>
          </div>
          <Field label="Details"><textarea rows={3} value={taskForm.description} onChange={setT("description")} className={inputClass} /></Field>
        </div>
      </Modal>

      <Modal
        open={timeOpen}
        title="Log Time"
        onClose={() => setTimeOpen(false)}
        footer={<><GhostButton onClick={() => setTimeOpen(false)}>Cancel</GhostButton><PrimaryButton disabled={saving} onClick={saveTime}>Save Time</PrimaryButton></>}
      >
        <div className="space-y-5">
          <Field label="Task" required>
            <select value={timeForm.taskRef} onChange={setM("taskRef")} className={inputClass}>
              <option value="">Select task</option>
              {openTasks.map((t) => <option key={t._id} value={t._id}>{t.title}{t.project ? ` (${t.project.name})` : ""}</option>)}
            </select>
          </Field>
          <Field label="Date" required><input type="date" max={localYmd()} value={timeForm.date} onChange={setM("date")} className={inputClass} /></Field>
          <div>
            <Segmented value={timeForm.mode} onChange={(mode) => setTimeForm((f) => ({ ...f, mode }))} options={[{ value: "hours", label: "Enter hours" }, { value: "range", label: "From - to time" }]} />
            {timeForm.mode === "hours" ? (
              <div className="mt-4"><Field label="Hours spent" required><input type="number" min="0.25" max="24" step="0.25" value={timeForm.hours} onChange={setM("hours")} placeholder="e.g. 1.5" className={inputClass} /></Field></div>
            ) : (
              <div className="mt-4 grid sm:grid-cols-2 gap-5">
                <Field label="From" required><input type="time" value={timeForm.startTime} onChange={setM("startTime")} className={inputClass} /></Field>
                <Field label="To" required hint={span > 0 ? `${Math.round((span / 60) * 100) / 100} hours` : undefined}><input type="time" value={timeForm.endTime} onChange={setM("endTime")} className={inputClass} /></Field>
              </div>
            )}
          </div>
          <Field label="Notes"><input value={timeForm.notes} onChange={setM("notes")} placeholder="What did you do?" className={inputClass} /></Field>
        </div>
      </Modal>

      <Modal center
        open={!!toDelete}
        title="Delete task"
        onClose={() => setToDelete(null)}
        footer={<><GhostButton onClick={() => setToDelete(null)}>Cancel</GhostButton><DangerButton onClick={removeTask}>Delete</DangerButton></>}
      >
        <p className="text-slate-600">Delete <strong>{toDelete?.title}</strong>?</p>
      </Modal>
    </Layout>
  );
}
