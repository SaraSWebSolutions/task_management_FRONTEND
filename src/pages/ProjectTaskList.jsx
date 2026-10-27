import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import ProjectTaskModal from "../components/ProjectTaskModal";
import api from "../api/axios";
import { PageHeader, Badge, Avatar, Spinner, EmptyState, Pagination, SearchBox, IconButton, PrimaryButton, Modal, GhostButton, DangerButton } from "../components/ui";
import { PM_TASK_STATUSES, pmTaskStatusMeta } from "../constants/pm";
import { PRIORITIES, priorityMeta } from "../constants/crm";
import { fmtDate } from "../utils/format";
import { can, homePath } from "../utils/permissions";

const PER_PAGE = 10;
const select = "border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-700 w-full";

export default function ProjectTaskList() {
  const canManage = can("projecttasks.manage");

  const [tasks, setTasks] = useState(null);
  const [options, setOptions] = useState({ users: [], projects: [], milestones: [] });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [project, setProject] = useState("ALL");
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState(null);
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
        (status === "ALL" || t.status === status) &&
        (priority === "ALL" || t.priority === priority) &&
        (project === "ALL" || t.project?._id === project) &&
        (!q || [t.title, t.project?.name, t.assignee?.name].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [tasks, search, status, priority, project]);

  const rows = shown.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const reset = (setter) => (v) => { setter(v); setPage(1); };

  const toggleDone = async (t) => {
    try {
      await api.patch(`/pm/tasks/${t._id}/status`, { status: t.status === "DONE" ? "TODO" : "DONE" });
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not update task");
    }
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
          title="Task List"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Apps" }, { label: "Projects" }, { label: "Tasks" }]}
          actions={canManage && <PrimaryButton onClick={() => setModal({ task: null, defaults: {} })}><Plus size={18} /> Add Task</PrimaryButton>}
        />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 grid gap-4 lg:grid-cols-4">
          <SearchBox value={search} onChange={reset(setSearch)} placeholder="Search tasks..." />
          <select value={status} onChange={(e) => reset(setStatus)(e.target.value)} className={select}>
            <option value="ALL">All Statuses</option>
            {PM_TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={priority} onChange={(e) => reset(setPriority)(e.target.value)} className={select}>
            <option value="ALL">All Priorities</option>
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select value={project} onChange={(e) => reset(setProject)(e.target.value)} className={select}>
            <option value="ALL">All Projects</option>
            {options.projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {!tasks ? (
            <Spinner />
          ) : shown.length === 0 ? (
            <EmptyState>No tasks found.</EmptyState>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-225 text-left">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      <th className="p-4 w-12" />
                      <th className="p-4">Task</th>
                      <th className="p-4">Project</th>
                      <th className="p-4">Assignee</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4">Due Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Est. Hours</th>
                      {canManage && <th className="p-4">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((t) => (
                      <tr key={t._id} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="p-4">
                          <input type="checkbox" checked={t.status === "DONE"} onChange={() => toggleDone(t)} aria-label="Mark done" />
                        </td>
                        <td className={`p-4 font-medium ${t.status === "DONE" ? "line-through text-slate-400" : "text-slate-900"}`}>{t.title}</td>
                        <td className="p-4 text-slate-500">{t.project?.name || (t.category === "OTHER" ? "Other work" : "Support work")}</td>
                        <td className="p-4">
                          {t.assignee ? (
                            <span className="inline-flex items-center gap-2"><Avatar name={t.assignee.name} size="h-8 w-8" text="text-xs" />{t.assignee.name}</span>
                          ) : <span className="text-slate-400">-</span>}
                        </td>
                        <td className="p-4"><Badge className={priorityMeta(t.priority).badge}>{priorityMeta(t.priority).label}</Badge></td>
                        <td className={`p-4 ${t.overdue ? "text-red-500 font-medium" : "text-slate-500"}`}>{fmtDate(t.dueDate)}</td>
                        <td className="p-4"><Badge className={pmTaskStatusMeta(t.status).badge}>{pmTaskStatusMeta(t.status).label}</Badge></td>
                        <td className="p-4 text-slate-500"><span className="inline-flex items-center gap-1.5"><Clock size={14} />{t.estimatedHours || 0}h</span></td>
                        {canManage && (
                          <td className="p-4">
                            <div className="flex gap-2">
                              <IconButton onClick={() => setModal({ task: t })} aria-label="Edit"><Pencil size={15} /></IconButton>
                              <IconButton tone="danger" onClick={() => setToDelete(t)} aria-label="Delete"><Trash2 size={15} /></IconButton>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} perPage={PER_PAGE} total={shown.length} onChange={setPage} />
            </>
          )}
        </div>
      </div>

      <ProjectTaskModal open={!!modal} task={modal?.task} defaults={modal?.defaults} options={options} saving={saving} onSave={save} onClose={() => setModal(null)} />

      <Modal center
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
