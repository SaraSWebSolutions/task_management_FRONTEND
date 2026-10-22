import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, ClipboardList, CircleCheck, Clock, TriangleAlert, User, Calendar } from "lucide-react";
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
  Pagination,
  SearchBox,
  IconButton,
  inputClass,
} from "../components/ui";
import { PRIORITIES, TASK_STATUSES, priorityMeta, taskStatusMeta } from "../constants/crm";
import { fmtDate, toDateInput } from "../utils/format";
import { can, homePath } from "../utils/permissions";

const PER_PAGE = 10;

const empty = {
  title: "",
  description: "",
  priority: "MEDIUM",
  status: "TODO",
  dueDate: "",
  project: "",
  assignee: "",
  lead: "",
};

export default function CrmTasks() {
  const canManage = can("crmtasks.manage");

  const [data, setData] = useState(null);
  const [options, setOptions] = useState({ users: [], leads: [] });
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState(null); // null | "new" | task
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/crm/tasks");
      setData(res.data);
    } catch {
      toast.error("Failed to load tasks");
    }
  }, []);

  useEffect(() => {
    load();
    api
      .get("/crm/options")
      .then((res) => setOptions(res.data))
      .catch(() => {});
  }, [load]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.tasks || []).filter(
      (t) =>
        (priority === "ALL" || t.priority === priority) &&
        (status === "ALL" || t.status === status) &&
        (!q || [t.title, t.description, t.project, t.assignee?.name].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [data, search, priority, status]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openNew = () => {
    setForm(empty);
    setEditing("new");
  };

  const openEdit = (t) => {
    setForm({
      title: t.title || "",
      description: t.description || "",
      priority: t.priority,
      status: t.status,
      dueDate: toDateInput(t.dueDate),
      project: t.project || "",
      assignee: t.assignee?._id || "",
      lead: t.lead?._id || "",
    });
    setEditing(t);
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error("Task title is required");
    try {
      setSaving(true);
      if (editing === "new") await api.post("/crm/tasks", form);
      else await api.put(`/crm/tasks/${editing._id}`, form);
      toast.success(editing === "new" ? "Task added" : "Task updated");
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (t) => {
    try {
      await api.patch(`/crm/tasks/${t._id}/toggle`);
      load();
    } catch {
      toast.error("Failed to update task");
    }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete task "${t.title}"?`)) return;
    try {
      await api.delete(`/crm/tasks/${t._id}`);
      toast.success("Task deleted");
      load();
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const stats = data?.stats;
  const rows = shown.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const reset = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Tasks"
          breadcrumbs={[
            { label: "Home", to: homePath() },
            { label: "Apps" },
            { label: "CRM" },
            { label: "Tasks" },
          ]}
          actions={
            canManage && (
              <PrimaryButton onClick={openNew}>
                <Plus size={18} /> Add Task
              </PrimaryButton>
            )
          }
        />

        {!data ? (
          <Spinner />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Tasks" value={stats.total} icon={<ClipboardList size={26} />} />
              <StatCard label="Completed" value={stats.completed} icon={<CircleCheck size={26} />} tone="green" />
              <StatCard label="In Progress" value={stats.inProgress} icon={<Clock size={26} />} tone="amber" />
              <StatCard label="Overdue" value={stats.overdue} icon={<TriangleAlert size={26} />} tone="red" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col lg:flex-row gap-4">
              <SearchBox
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
                placeholder="Search tasks..."
              />
              <select value={priority} onChange={reset(setPriority)} className={`${inputClass} lg:w-56`}>
                <option value="ALL">All Priorities</option>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <select value={status} onChange={reset(setStatus)} className={`${inputClass} lg:w-56`}>
                <option value="ALL">All Status</option>
                {TASK_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div role="heading" aria-level={2} className="text-lg font-semibold text-slate-900">
                  Task List
                </div>
                <span className="text-slate-500">{shown.length} tasks</span>
              </div>

              {shown.length === 0 ? (
                <EmptyState>No tasks found.</EmptyState>
              ) : (
                <ul>
                  {rows.map((t) => {
                    const pr = priorityMeta(t.priority);
                    const st = taskStatusMeta(t.status);
                    const done = t.status === "COMPLETED";
                    return (
                      <li key={t._id} className="flex items-start gap-4 px-6 py-5 border-t border-slate-100 first:border-t-0">
                        <input
                          type="checkbox"
                          checked={done}
                          disabled={!canManage}
                          onChange={() => toggle(t)}
                          className="mt-1.5 h-5 w-5 shrink-0 rounded border-slate-300 accent-[#7c3aed]"
                          aria-label="Mark complete"
                        />

                        <div className="min-w-0 flex-1 text-left">
                          <p className={`text-lg font-semibold ${done ? "text-slate-400 line-through" : "text-slate-900"}`}>
                            {t.title}
                          </p>
                          {t.description && <p className="mt-1 text-slate-500">{t.description}</p>}

                          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                            {t.assignee && (
                              <span className="inline-flex items-center gap-1.5">
                                <User size={14} /> {t.assignee.name}
                              </span>
                            )}
                            {t.dueDate && (
                              <span className={`inline-flex items-center gap-1.5 ${t.overdue ? "text-red-500 font-medium" : ""}`}>
                                <Calendar size={14} /> {fmtDate(t.dueDate)}
                                {t.overdue && " (overdue)"}
                              </span>
                            )}
                            {t.project && <Badge className="bg-violet-100 text-violet-700">{t.project}</Badge>}
                            {t.lead && (
                              <Link to={`/leads/${t.lead._id}`} className="hover:text-brand">
                                Lead: {t.lead.name}
                              </Link>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 shrink-0">
                          <div className="flex gap-2">
                            <Badge className={pr.badge}>{pr.label}</Badge>
                            <Badge className={st.badge}>{st.label}</Badge>
                          </div>
                          {canManage && (
                            <div className="flex gap-2">
                              <IconButton onClick={() => openEdit(t)} aria-label="Edit task">
                                <Pencil size={16} />
                              </IconButton>
                              <IconButton tone="danger" onClick={() => remove(t)} aria-label="Delete task">
                                <Trash2 size={16} />
                              </IconButton>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <Pagination page={page} perPage={PER_PAGE} total={shown.length} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      <Modal
        open={!!editing}
        title={editing === "new" ? "Add New Task" : "Edit Task"}
        onClose={() => setEditing(null)}
        footer={
          <>
            <GhostButton onClick={() => setEditing(null)}>Cancel</GhostButton>
            <PrimaryButton onClick={save} disabled={saving}>
              {saving ? "Saving..." : editing === "new" ? "Add Task" : "Save Task"}
            </PrimaryButton>
          </>
        }
      >
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <Field label="Task Title" required>
              <input value={form.title} onChange={set("title")} className={inputClass} />
            </Field>
          </div>
          <div className="sm:col-span-3">
            <Field label="Description">
              <textarea rows={3} value={form.description} onChange={set("description")} className={inputClass} />
            </Field>
          </div>
          <Field label="Priority">
            <select value={form.priority} onChange={set("priority")} className={inputClass}>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={set("status")} className={inputClass}>
              {TASK_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Due Date">
            <input type="date" value={form.dueDate} onChange={set("dueDate")} className={inputClass} />
          </Field>
          <Field label="Project / Category">
            <input value={form.project} onChange={set("project")} placeholder="e.g. Sales Operations" className={inputClass} />
          </Field>
          <Field label="Assignee">
            <select value={form.assignee} onChange={set("assignee")} className={inputClass}>
              <option value="">Unassigned</option>
              {options.users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Linked Lead">
            <select value={form.lead} onChange={set("lead")} className={inputClass}>
              <option value="">None</option>
              {options.leads.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name}
                  {l.company ? ` - ${l.company}` : ""}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>
    </Layout>
  );
}
