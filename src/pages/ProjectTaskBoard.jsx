import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Calendar, Pencil, Trash2, Clock } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import ProjectTaskModal from "../components/ProjectTaskModal";
import api from "../api/axios";
import { PageHeader, Avatar, Spinner, SearchBox, IconButton, PrimaryButton, Modal, GhostButton, DangerButton } from "../components/ui";
import { PM_TASK_STATUSES, PRIORITY_DOT } from "../constants/pm";
import { priorityMeta } from "../constants/crm";
import { fmtDate } from "../utils/format";
import { can, homePath } from "../utils/permissions";

export default function ProjectTaskBoard() {
  const canManage = can("projecttasks.manage");
  const myId = JSON.parse(localStorage.getItem("user") || "{}")?.id || JSON.parse(localStorage.getItem("user") || "{}")?._id;

  const [tasks, setTasks] = useState(null);
  const [options, setOptions] = useState({ users: [], projects: [], milestones: [] });
  const [search, setSearch] = useState("");
  const [project, setProject] = useState("ALL");
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  const [modal, setModal] = useState(null); // { task, defaults }
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/pm/tasks");
      setTasks(res.data.tasks);
    } catch {
      toast.error("Failed to load tasks");
      setTasks([]);
    }
  }, []);

  useEffect(() => {
    load();
    api.get("/pm/options").then((r) => setOptions(r.data)).catch(() => {});
  }, [load]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (tasks || []).filter(
      (t) =>
        (project === "ALL" || t.project?._id === project) &&
        (!q || [t.title, t.description, t.assignee?.name, t.project?.name].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [tasks, search, project]);

  const canMove = (t) => canManage || (t.assignee?._id && t.assignee._id === myId);

  const move = async (task, status) => {
    if (!task || task.status === status || !canMove(task)) return;
    const previous = tasks;
    // optimistic, rolled back if the server says no
    setTasks((list) => list.map((t) => (t._id === task._id ? { ...t, status } : t)));
    try {
      await api.patch(`/pm/tasks/${task._id}/status`, { status });
    } catch (error) {
      setTasks(previous);
      toast.error(error?.response?.data?.message || "Could not move task");
    }
  };

  const onDrop = (status) => {
    const task = tasks.find((t) => t._id === dragId);
    setDragId(null);
    setOverCol(null);
    move(task, status);
  };

  const save = async (form) => {
    if (!form.title.trim()) return toast.error("Task title is required");
    if (!form.project && form.category === "PROJECT") return toast.error("Select a project, or choose support / other work");
    try {
      setSaving(true);
      if (modal.task) await api.put(`/pm/tasks/${modal.task._id}`, form);
      else await api.post("/pm/tasks", form);
      toast.success(modal.task ? "Task updated" : "Task added");
      setModal(null);
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/pm/tasks/${toDelete._id}`);
      toast.success("Task deleted");
      setToDelete(null);
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Task Board"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Apps" }, { label: "Projects" }, { label: "Task Board" }]}
          actions={
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <SearchBox value={search} onChange={setSearch} placeholder="Search tasks..." />
              <select value={project} onChange={(e) => setProject(e.target.value)} className="border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-700">
                <option value="ALL">All Projects</option>
                {options.projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              {canManage && (
                <PrimaryButton onClick={() => setModal({ task: null, defaults: {} })}>
                  <Plus size={18} /> Add Task
                </PrimaryButton>
              )}
            </div>
          }
        />

        {!tasks ? (
          <Spinner />
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-4 items-start">
            {PM_TASK_STATUSES.map((col) => {
              const list = shown.filter((t) => t.status === col.value);
              return (
                <div
                  key={col.value}
                  onDragOver={(e) => { e.preventDefault(); setOverCol(col.value); }}
                  onDragLeave={() => setOverCol((c) => (c === col.value ? null : c))}
                  onDrop={() => onDrop(col.value)}
                  className={`w-80 shrink-0 rounded-2xl p-2 transition ${overCol === col.value ? "bg-brand-soft/60" : ""}`}
                >
                  <div className="flex items-center gap-2 px-2 pb-4">
                    <span className="h-3 w-3 rounded-full" style={{ background: col.color }} />
                    <span className="font-semibold text-slate-900">{col.label}</span>
                    <span className="rounded-md bg-indigo-50 text-indigo-600 text-xs font-semibold px-2 py-0.5">{list.length}</span>
                    {canManage && (
                      <button
                        onClick={() => setModal({ task: null, defaults: { status: col.value } })}
                        className="ml-auto h-7 w-7 rounded-full border border-slate-300 text-slate-500 flex items-center justify-center hover:bg-slate-50"
                        aria-label={`Add task to ${col.label}`}
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 min-h-24">
                    {list.map((t) => (
                      <div
                        key={t._id}
                        draggable={canMove(t)}
                        onDragStart={() => setDragId(t._id)}
                        onDragEnd={() => { setDragId(null); setOverCol(null); }}
                        className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-left ${canMove(t) ? "cursor-grab" : ""} ${dragId === t._id ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <span className="inline-flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[t.priority]}`} />
                            {priorityMeta(t.priority).label}
                          </span>
                          {canManage && (
                            <span className="flex gap-1">
                              <IconButton onClick={() => setModal({ task: t })} aria-label="Edit task" className="!h-7 !w-7"><Pencil size={13} /></IconButton>
                              <IconButton tone="danger" onClick={() => setToDelete(t)} aria-label="Delete task" className="!h-7 !w-7"><Trash2 size={13} /></IconButton>
                            </span>
                          )}
                        </div>
                        <p className="mt-2 font-semibold text-slate-900">{t.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{t.project?.name || (t.category === "OTHER" ? "Other work" : "Support work")}</p>
                        {t.description && <p className="mt-1 text-sm text-slate-500 line-clamp-2">{t.description}</p>}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                          {t.assignee ? <Avatar name={t.assignee.name} size="h-8 w-8" text="text-xs" /> : <span className="text-xs text-slate-400">Unassigned</span>}
                          <span className={`inline-flex items-center gap-1.5 ${t.overdue ? "text-red-500 font-medium" : ""}`}>
                            <Calendar size={14} /> {t.dueDate ? fmtDate(t.dueDate) : "-"}
                          </span>
                          {t.estimatedHours > 0 && (
                            <span className="inline-flex items-center gap-1"><Clock size={14} />{t.estimatedHours}h</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {list.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-400">No tasks</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ProjectTaskModal
        open={!!modal}
        task={modal?.task}
        defaults={modal?.defaults}
        options={options}
        saving={saving}
        onSave={save}
        onClose={() => setModal(null)}
      />

      <Modal
        open={!!toDelete}
        title="Delete task"
        onClose={() => setToDelete(null)}
        footer={<><GhostButton onClick={() => setToDelete(null)}>Cancel</GhostButton><DangerButton onClick={remove}>Delete</DangerButton></>}
      >
        <p className="text-slate-600">Delete <strong>{toDelete?.title}</strong>?</p>
      </Modal>
    </Layout>
  );
}
