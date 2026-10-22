import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleCheck, Circle, ListChecks, Calendar, Pencil, Trash2, Plus, Filter } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Badge, Avatar, Spinner, EmptyState, Modal, Field, PrimaryButton, GhostButton, DangerButton, IconButton, inputClass } from "../components/ui";
import { MILESTONE_STATUSES, milestoneStatusMeta } from "../constants/pm";
import { fmtDate, toDateInput } from "../utils/format";
import { can, homePath } from "../utils/permissions";

const empty = { project: "", title: "", description: "", dueDate: "", status: "UPCOMING", manualProgress: 0 };

export default function Milestones() {
  const canManage = can("milestones.manage");

  const [items, setItems] = useState(null);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [project, setProject] = useState("ALL");

  const [editing, setEditing] = useState(null); // null | "new" | milestone
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/pm/milestones");
      setItems(res.data.milestones);
    } catch {
      toast.error("Failed to load milestones");
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
    api.get("/pm/options").then((r) => setProjects(r.data.projects || [])).catch(() => {});
  }, [load]);

  const shown = useMemo(
    () =>
      (items || []).filter(
        (m) => (filter === "ALL" || m.status === filter) && (project === "ALL" || m.project?._id === project),
      ),
    [items, filter, project],
  );

  const openForm = (m) => {
    setEditing(m || "new");
    setForm(
      m
        ? {
            project: m.project?._id || "",
            title: m.title,
            description: m.description || "",
            dueDate: toDateInput(m.dueDate),
            status: m.status,
            manualProgress: m.manualProgress || 0,
          }
        : empty,
    );
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.title.trim()) return toast.error("Milestone title is required");
    if (!form.project) return toast.error("Select a project");
    try {
      setSaving(true);
      const body = { ...form, manualProgress: Number(form.manualProgress) || 0 };
      if (editing === "new") await api.post("/pm/milestones", body);
      else await api.put(`/pm/milestones/${editing._id}`, body);
      toast.success(editing === "new" ? "Milestone added" : "Milestone updated");
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save milestone");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/pm/milestones/${toDelete._id}`);
      toast.success("Milestone deleted");
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
          title="Milestones"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Apps" }, { label: "Projects" }, { label: "Milestones" }]}
          actions={canManage && <PrimaryButton onClick={() => openForm()}><Plus size={18} /> Add Milestone</PrimaryButton>}
        />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col lg:flex-row lg:items-center gap-4">
          <span className="inline-flex items-center gap-2 font-semibold text-slate-700"><Filter size={18} className="text-slate-400" /> Filter by Status:</span>
          <div className="flex flex-wrap gap-2">
            {[{ value: "ALL", label: "All" }, ...MILESTONE_STATUSES].map((s) => (
              <button
                key={s.value}
                onClick={() => setFilter(s.value)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${filter === s.value ? "bg-brand text-white border-brand" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <select value={project} onChange={(e) => setProject(e.target.value)} className="lg:ml-auto border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-700">
            <option value="ALL">All Projects</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <span className="text-sm text-slate-500">Showing {shown.length} of {items?.length || 0} milestones</span>
        </div>

        {!items ? (
          <Spinner />
        ) : shown.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200"><EmptyState>No milestones found.</EmptyState></div>
        ) : (
          <div className="space-y-5 border-l-2 border-slate-200 pl-5">
            {shown.map((m) => {
              const meta = milestoneStatusMeta(m.status);
              const done = m.status === "COMPLETED";
              return (
                <div key={m._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-left" style={{ borderLeft: `4px solid ${meta.bar}` }}>
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        {done ? <CircleCheck className="text-emerald-500" size={22} /> : <Circle className="text-slate-400" size={22} />}
                        <span className="text-xl font-semibold text-slate-900">{m.title}</span>
                        <Badge className={meta.badge}>{meta.label}</Badge>
                        {m.overdue && <Badge className="bg-red-100 text-red-600">Overdue</Badge>}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 ml-9">{m.project?.name}</p>
                      {m.description && <p className="mt-2 ml-9 text-slate-500">{m.description}</p>}
                      <div className="mt-3 ml-9 flex flex-wrap gap-5 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1.5"><Calendar size={15} /> Due: {fmtDate(m.dueDate)}</span>
                        <span className="inline-flex items-center gap-1.5"><ListChecks size={15} /> {m.tasks.done}/{m.tasks.total} Tasks</span>
                      </div>
                    </div>

                    <div className="flex lg:flex-col items-start lg:items-end gap-3">
                      {m.team.length > 0 && (
                        <div className="flex -space-x-2">
                          {m.team.slice(0, 4).map((u) => (
                            <div key={u._id} className="ring-2 ring-white rounded-full"><Avatar name={u.name} size="h-9 w-9" text="text-xs" /></div>
                          ))}
                        </div>
                      )}
                      {canManage && (
                        <div className="flex gap-2">
                          <IconButton onClick={() => openForm(m)} aria-label="Edit"><Pencil size={15} /></IconButton>
                          <IconButton tone="danger" onClick={() => setToDelete(m)} aria-label="Delete"><Trash2 size={15} /></IconButton>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-slate-500"><span>Progress</span><span className="font-medium text-slate-700">{m.progress}%</span></div>
                    <div className="mt-1.5 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full" style={{ width: `${m.progress}%`, background: meta.bar }} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={!!editing}
        title={editing === "new" ? "Add New Milestone" : "Edit Milestone"}
        onClose={() => setEditing(null)}
        footer={<><GhostButton onClick={() => setEditing(null)}>Cancel</GhostButton><PrimaryButton disabled={saving} onClick={save}>{editing === "new" ? "Create Milestone" : "Save Milestone"}</PrimaryButton></>}
      >
        <div className="space-y-5">
          <Field label="Milestone Title" required><input value={form.title} onChange={set("title")} placeholder="Enter milestone title" className={inputClass} /></Field>
          <Field label="Description"><textarea rows={3} value={form.description} onChange={set("description")} placeholder="Describe this milestone" className={inputClass} /></Field>
          <Field label="Project" required>
            <select value={form.project} onChange={set("project")} className={inputClass} disabled={editing !== "new"}>
              <option value="">Select project</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </Field>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Due Date"><input type="date" value={form.dueDate} onChange={set("dueDate")} className={inputClass} /></Field>
            <Field label="Status">
              <select value={form.status} onChange={set("status")} className={inputClass}>
                {MILESTONE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Progress (%)" hint="Used only while no task is linked. Once tasks are linked to this milestone, progress is calculated from done tasks.">
            <input type="number" min="0" max="100" value={form.manualProgress} onChange={set("manualProgress")} className={inputClass} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!toDelete}
        title="Delete milestone"
        onClose={() => setToDelete(null)}
        footer={<><GhostButton onClick={() => setToDelete(null)}>Cancel</GhostButton><DangerButton onClick={remove}>Delete</DangerButton></>}
      >
        <p className="text-slate-600">Delete <strong>{toDelete?.title}</strong>? Its tasks are kept, they just lose the milestone link.</p>
      </Modal>
    </Layout>
  );
}
