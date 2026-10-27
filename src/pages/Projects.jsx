import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  FolderOpen,
  CircleCheck,
  CirclePause,
  TriangleAlert,
  Calendar,
  IndianRupee,
  EllipsisVertical,
  Eye,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import {
  PageHeader,
  StatCard,
  Badge,
  Avatar,
  Spinner,
  EmptyState,
  Modal,
  Field,
  PrimaryButton,
  GhostButton,
  DangerButton,
  SearchBox,
  inputClass,
} from "../components/ui";
import { PRIORITIES, priorityMeta } from "../constants/crm";
import { projectStatusMeta } from "../constants/pm";
import { fmtDate } from "../utils/format";
import { can, homePath } from "../utils/permissions";

// Other pages (ProjectDetails) import this
export const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const FILTERS = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "OVERDUE", label: "Overdue" },
];

const matches = (p, f) => {
  if (f === "ALL") return true;
  if (f === "OVERDUE") return p.overdue;
  if (f === "ACTIVE") return ["PLANNING", "IN_PROGRESS"].includes(p.status) && !p.overdue;
  return p.status === f;
};

const barColor = (p) =>
  p.status === "COMPLETED" ? "bg-emerald-500" : p.overdue ? "bg-red-500" : p.progress < 40 ? "bg-amber-500" : "bg-brand";

const empty = {
  name: "",
  clientName: "",
  description: "",
  startDate: "",
  endDate: "",
  priority: "HIGH",
  projectValue: "",
  members: [],
};

export default function Projects() {
  const navigate = useNavigate();
  const canManage = can("projects.manage");

  const [projects, setProjects] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [menuId, setMenuId] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data.projects || []);
    } catch {
      toast.error("Failed to load projects");
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    load();
    api.get("/pm/options").then((r) => setUsers(r.data.users || [])).catch(() => {});
  }, [load]);

  const stats = useMemo(() => {
    const list = projects || [];
    return {
      active: list.filter((p) => ["PLANNING", "IN_PROGRESS"].includes(p.status)).length,
      completed: list.filter((p) => p.status === "COMPLETED").length,
      onHold: list.filter((p) => p.status === "ON_HOLD").length,
      overdue: list.filter((p) => p.overdue).length,
    };
  }, [projects]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (projects || []).filter(
      (p) =>
        matches(p, filter) &&
        (!q || [p.name, p.clientName, p.description].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [projects, search, filter]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleMember = (id) =>
    setForm((f) => ({
      ...f,
      members: f.members.includes(id) ? f.members.filter((m) => m !== id) : [...f.members, id],
    }));

  const create = async () => {
    if (!form.name.trim()) return toast.error("Project title is required");
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      return toast.error("End date cannot be before the start date");
    try {
      setSaving(true);
      await api.post("/projects", { ...form, projectValue: Number(form.projectValue) || 0 });
      toast.success("Project created");
      setOpen(false);
      setForm(empty);
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create project");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/projects/${toDelete._id}`);
      toast.success("Project deleted");
      setToDelete(null);
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete project");
      setToDelete(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Projects"
          breadcrumbs={[
            { label: "Home", to: homePath() },
            { label: "Apps" },
            { label: "Projects" },
          ]}
          actions={
            canManage && (
              <PrimaryButton onClick={() => setOpen(true)}>
                <Plus size={18} /> Add Project
              </PrimaryButton>
            )
          }
        />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Active Projects" value={stats.active} icon={<FolderOpen size={26} />} />
          <StatCard label="Completed" value={stats.completed} icon={<CircleCheck size={26} />} tone="green" />
          <StatCard label="On Hold" value={stats.onHold} icon={<CirclePause size={26} />} tone="amber" />
          <StatCard label="Overdue" value={stats.overdue} icon={<TriangleAlert size={26} />} tone="red" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col lg:flex-row gap-4 lg:items-center">
          <SearchBox value={search} onChange={setSearch} placeholder="Search projects..." />
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                  filter === f.value
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {!projects ? (
          <Spinner />
        ) : shown.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200">
            <EmptyState>No projects found.</EmptyState>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {shown.map((p) => {
              const st = p.overdue ? { label: "Overdue", badge: "bg-red-100 text-red-600" } : projectStatusMeta(p.status);
              const members = (p.team || []).map((m) => m.user?.name).filter(Boolean);
              return (
                <div key={p._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col text-left">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/projects/${p._id}`} className="font-semibold text-slate-900 text-lg leading-snug hover:text-brand">
                      {p.name}
                    </Link>
                    <div className="relative">
                      <button
                        onClick={() => setMenuId(menuId === p._id ? null : p._id)}
                        className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
                        aria-label="Project menu"
                      >
                        <EllipsisVertical size={16} />
                      </button>
                      {menuId === p._id && (
                        <div className="absolute right-0 z-10 mt-1 w-40 rounded-xl border border-slate-200 bg-white shadow-lg py-1">
                          <button onClick={() => navigate(`/projects/${p._id}`)} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50">
                            <Eye size={15} /> View
                          </button>
                          {canManage && (
                            <button onClick={() => { setToDelete(p); setMenuId(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                              <Trash2 size={15} /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="mt-2 text-sm text-slate-500 line-clamp-2 min-h-10">
                    {p.description || (p.clientName ? `Client: ${p.clientName}` : "No description")}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={priorityMeta(p.priority).badge}>{priorityMeta(p.priority).label}</Badge>
                    <Badge className={st.badge}>{st.label}</Badge>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {members.slice(0, 3).map((n) => (
                        <div key={n} className="ring-2 ring-white rounded-full">
                          <Avatar name={n} size="h-8 w-8" text="text-xs" />
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-slate-500">
                      {members.length} member{members.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Progress</span>
                      <span className="font-medium text-slate-700">{p.progress}%</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-slate-100">
                      <div className={`h-2 rounded-full ${barColor(p)}`} style={{ width: `${p.progress}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {p.tasks.done}/{p.tasks.total} tasks done
                    </p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1.5"><Calendar size={14} /> {fmtDate(p.endDate)}</span>
                    <span className="inline-flex items-center gap-1"><IndianRupee size={14} />{Number(p.projectValue || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={open}
        title="Add New Project"
        onClose={() => setOpen(false)}
        footer={
          <>
            <GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton>
            <PrimaryButton disabled={saving} onClick={create}>Create Project</PrimaryButton>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Project Title" required>
            <input value={form.name} onChange={set("name")} placeholder="Enter project title" className={inputClass} />
          </Field>
          <Field label="Client Name">
            <input value={form.clientName} onChange={set("clientName")} placeholder="Enter client name" className={inputClass} />
          </Field>
          <Field label="Description">
            <textarea rows={3} value={form.description} onChange={set("description")} placeholder="Enter project description" className={inputClass} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Start Date"><input type="date" value={form.startDate} onChange={set("startDate")} className={inputClass} /></Field>
            <Field label="End Date"><input type="date" value={form.endDate} onChange={set("endDate")} className={inputClass} /></Field>
            <Field label="Priority">
              <select value={form.priority} onChange={set("priority")} className={inputClass}>
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Project Value (₹)">
              <input type="number" min="0" value={form.projectValue} onChange={set("projectValue")} placeholder="0" className={inputClass} />
            </Field>
          </div>
          <Field label="Team Members" hint="Hours and costing can be edited later in the project details.">
            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
              {users.map((u) => (
                <label key={u._id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={form.members.includes(u._id)} onChange={() => toggleMember(u._id)} />
                  <span className="text-sm text-slate-700">{u.name}</span>
                  {u.designation && <span className="text-xs text-slate-400">{u.designation}</span>}
                </label>
              ))}
            </div>
          </Field>
        </div>
      </Modal>

      <Modal center
        open={!!toDelete}
        title="Delete project"
        onClose={() => setToDelete(null)}
        footer={
          <>
            <GhostButton onClick={() => setToDelete(null)}>Cancel</GhostButton>
            <DangerButton onClick={remove}>Delete</DangerButton>
          </>
        }
      >
        <p className="text-slate-600">
          Delete <strong>{toDelete?.name}</strong>? Its tasks, milestones and time entries are deleted too. This cannot be undone.
        </p>
      </Modal>
    </Layout>
  );
}
