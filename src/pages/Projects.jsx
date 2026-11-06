import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  FolderOpen,
  CircleCheck,
  CirclePause,
  TriangleAlert,
  Calendar,
  IndianRupee,
  EllipsisVertical,
  Pencil,
  Trash2,
  X,
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
import { fmtDate, toDateInput } from "../utils/format";
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

const STATUSES = [
  { value: "PLANNING", label: "Planning" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "COMPLETED", label: "Completed" },
];

// team: [{ user, hours }]  support: [{ _id?, user, name, hours, note }]
const empty = {
  name: "",
  clientName: "",
  description: "",
  startDate: "",
  endDate: "",
  priority: "HIGH",
  status: "PLANNING",
  projectValue: "",
  clientEstimationHours: "",
  teamEstimationHours: "",
  team: [],
  support: [],
};

const fromProject = (p) => ({
  name: p.name || "",
  clientName: p.clientName || "",
  description: p.description || "",
  startDate: toDateInput(p.startDate),
  endDate: toDateInput(p.endDate),
  priority: p.priority || "MEDIUM",
  status: p.status || "PLANNING",
  projectValue: p.projectValue ?? "",
  clientEstimationHours: p.clientEstimationHours ?? "",
  teamEstimationHours: p.teamEstimationHours ?? "",
  team: (p.team || []).map((m) => ({ user: m.user?._id || m.user, hours: m.hours ?? 0 })),
  support: (p.support || []).map((e) => ({
    _id: e._id,
    user: e.user?._id || e.user,
    name: e.user?.name || "",
    hours: e.hours ?? 0,
    note: e.note || "",
  })),
});

export default function Projects() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const canManage = can("projects.manage");
  const editId = searchParams.get("edit");

  const [projects, setProjects] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [open, setOpen] = useState(false); // add drawer
  const [form, setForm] = useState(empty);
  const [supportPick, setSupportPick] = useState({ user: "", hours: "", note: "" });
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

  // The project being edited (opened with ?edit=<id>, e.g. from a lead's "Open project")
  const editing = useMemo(
    () => (editId && projects ? projects.find((p) => p._id === editId) || null : null),
    [editId, projects],
  );

  useEffect(() => {
    if (!editId || !projects) return;
    if (!editing) {
      toast.error("Project not found");
      setSearchParams({}, { replace: true });
      return;
    }
    setForm(fromProject(editing));
    setSupportPick({ user: "", hours: "", note: "" });
    // load the form once per opened project, not on every refresh of the list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, projects === null]);

  const openEdit = (p) => {
    setMenuId(null);
    setSearchParams({ edit: p._id });
  };

  const closeDrawer = () => {
    setOpen(false);
    setForm(empty);
    if (editId) setSearchParams({}, { replace: true });
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const hasMember = (id) => form.team.some((m) => m.user === id);
  const toggleMember = (id) =>
    setForm((f) => ({
      ...f,
      team: f.team.some((m) => m.user === id)
        ? f.team.filter((m) => m.user !== id)
        : [...f.team, { user: id, hours: 0 }],
    }));
  const setMemberHours = (id, hours) =>
    setForm((f) => ({
      ...f,
      team: f.team.map((m) => (m.user === id ? { ...m, hours } : m)),
    }));

  const addSupport = () => {
    if (!supportPick.user) return toast.error("Select a person");
    if (supportPick.hours === "" || Number(supportPick.hours) < 0) return toast.error("Enter hours");
    const person = users.find((u) => u._id === supportPick.user);
    setForm((f) => ({
      ...f,
      support: [
        ...f.support,
        { user: supportPick.user, name: person?.name || "", hours: Number(supportPick.hours), note: supportPick.note },
      ],
    }));
    setSupportPick({ user: "", hours: "", note: "" });
  };

  const create = async () => {
    if (!form.name.trim()) return toast.error("Project title is required");
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      return toast.error("End date cannot be before the start date");
    try {
      setSaving(true);
      await api.post("/projects", {
        ...form,
        members: form.team.map((m) => m.user),
        projectValue: Number(form.projectValue) || 0,
        clientEstimationHours: Number(form.clientEstimationHours) || 0,
        teamEstimationHours: Number(form.teamEstimationHours) || 0,
      });
      toast.success("Project created");
      closeDrawer();
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create project");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!form.name.trim()) return toast.error("Project title is required");
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      return toast.error("End date cannot be before the start date");
    try {
      setSaving(true);
      await api.put(`/projects/${editId}`, {
        name: form.name,
        clientName: form.clientName,
        description: form.description,
        priority: form.priority,
        status: form.status,
        startDate: form.startDate,
        endDate: form.endDate,
        projectValue: Number(form.projectValue) || 0,
        clientEstimationHours: Number(form.clientEstimationHours) || 0,
        teamEstimationHours: Number(form.teamEstimationHours) || 0,
      });
      await api.put(`/projects/${editId}/team`, {
        team: form.team.map((m) => ({ user: m.user, hours: Number(m.hours) || 0 })),
      });
      if (form.status === "COMPLETED") {
        await api.put(`/projects/${editId}/support`, {
          support: form.support.map((r) => ({
            _id: r._id,
            user: r.user,
            hours: Number(r.hours) || 0,
            note: r.note,
          })),
        });
      }
      toast.success("Project updated");
      closeDrawer();
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update project");
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
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="text-left font-semibold text-slate-900 text-lg leading-snug hover:text-brand"
                    >
                      {p.name}
                    </button>
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
                          <button onClick={() => openEdit(p)} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50">
                            <Pencil size={15} /> {canManage ? "Edit" : "Open"}
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
        wide
        open={open || !!editing}
        title={editing ? "Edit Project" : "Add New Project"}
        onClose={closeDrawer}
        footer={
          <>
            <GhostButton onClick={closeDrawer}>{editing && !canManage ? "Close" : "Cancel"}</GhostButton>
            {(!editing || canManage) && (
              <PrimaryButton disabled={saving} onClick={editing ? saveEdit : create}>
                {editing ? "Save Changes" : "Create Project"}
              </PrimaryButton>
            )}
          </>
        }
      >
        <fieldset disabled={!!editing && !canManage} className="space-y-5 border-0 p-0 m-0 min-w-0">
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
            {editing ? (
              <Field label="Status">
                <select value={form.status} onChange={set("status")} className={inputClass}>
                  {STATUSES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
                </select>
              </Field>
            ) : (
              <span className="hidden sm:block" />
            )}
            <Field label="Project Value (₹)">
              <input type="number" min="0" value={form.projectValue} onChange={set("projectValue")} placeholder="0" className={inputClass} />
            </Field>
            <span className="hidden sm:block" />
            <Field label="Client Estimation (hrs)">
              <input type="number" min="0" value={form.clientEstimationHours} onChange={set("clientEstimationHours")} placeholder="0" className={inputClass} />
            </Field>
            <Field label="Team Estimation (hrs)">
              <input type="number" min="0" value={form.teamEstimationHours} onChange={set("teamEstimationHours")} placeholder="0" className={inputClass} />
            </Field>
          </div>

          <Field label="Team Members" hint={editing ? "Tick the people on this project and enter the hours each has worked." : "Hours and costing can be edited later by opening the project."}>
            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
              {users.map((u) => (
                <div key={u._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
                  <label className="flex flex-1 min-w-0 items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={hasMember(u._id)} onChange={() => toggleMember(u._id)} />
                    <span className="text-sm text-slate-700 truncate">{u.name}</span>
                    {u.designation && <span className="text-xs text-slate-400 truncate">{u.designation}</span>}
                  </label>
                  {editing && hasMember(u._id) && (
                    <input
                      type="number"
                      min="0"
                      aria-label={`Hours worked by ${u.name}`}
                      value={form.team.find((m) => m.user === u._id)?.hours ?? 0}
                      onChange={(e) => setMemberHours(u._id, e.target.value)}
                      className={`${inputClass} !w-24 !py-1.5`}
                      placeholder="Hours"
                    />
                  )}
                </div>
              ))}
            </div>
          </Field>

          {editing && (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 space-y-1">
              <p>
                Marketing time: <b className="text-slate-800">{editing.summary?.marketingHours || 0} hrs</b> ·{" "}
                <b className="text-slate-800">{money(editing.summary?.marketingCost)}</b>
              </p>
              {editing.lead?._id && (
                <button
                  type="button"
                  onClick={() => navigate(`/leads/${editing.lead._id}`)}
                  className="text-brand font-semibold underline"
                >
                  Update marketing time on the lead
                </button>
              )}
            </div>
          )}

          {editing && form.status === "COMPLETED" && (
            <>
              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <p className="font-semibold text-slate-800">Cost summary</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-slate-500">Project value</p>
                    <p className="text-lg font-bold text-slate-900">{money(editing.projectValue)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-slate-500">Team + support + marketing</p>
                    <p className="text-lg font-bold text-slate-900">{money(editing.summary?.totalCost)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 col-span-2">
                    <p className="text-slate-500">Value after team cost</p>
                    <p className={`text-lg font-bold ${(editing.summary?.profit || 0) < 0 ? "text-red-600" : "text-green-600"}`}>
                      {money(editing.summary?.profit)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400">Shown as saved. Save the project to refresh it after changing hours.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <p className="font-semibold text-slate-800">Support after completion</p>
                {form.support.map((r, i) => (
                  <div key={r._id || i} className="flex items-center gap-2">
                    <span className="flex-1 min-w-0 truncate text-sm text-slate-700">{r.name}</span>
                    <input
                      type="number"
                      min="0"
                      value={r.hours}
                      onChange={(e) => setForm((f) => ({ ...f, support: f.support.map((x, n) => (n === i ? { ...x, hours: e.target.value } : x)) }))}
                      className={`${inputClass} !w-20 !py-1.5`}
                      aria-label="Support hours"
                    />
                    <input
                      value={r.note}
                      onChange={(e) => setForm((f) => ({ ...f, support: f.support.map((x, n) => (n === i ? { ...x, note: e.target.value } : x)) }))}
                      placeholder="What was done"
                      className={`${inputClass} !py-1.5`}
                    />
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, support: f.support.filter((_, n) => n !== i) }))}
                        className="h-8 w-8 shrink-0 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center"
                        aria-label="Remove support entry"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {canManage && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select value={supportPick.user} onChange={(e) => setSupportPick((s) => ({ ...s, user: e.target.value }))} className={`${inputClass} !py-2`}>
                      <option value="">Select person</option>
                      {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                    </select>
                    <input type="number" min="0" value={supportPick.hours} onChange={(e) => setSupportPick((s) => ({ ...s, hours: e.target.value }))} placeholder="Hours" className={`${inputClass} !py-2 sm:!w-24`} />
                    <input value={supportPick.note} onChange={(e) => setSupportPick((s) => ({ ...s, note: e.target.value }))} placeholder="Note" className={`${inputClass} !py-2`} />
                    <GhostButton type="button" onClick={addSupport}>Add</GhostButton>
                  </div>
                )}
              </div>
            </>
          )}
        </fieldset>
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
