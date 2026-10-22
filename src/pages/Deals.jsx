import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Briefcase, Trophy, CircleX, Clock, IndianRupee } from "lucide-react";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import {
  PageHeader,
  Card,
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
import { DEAL_STAGES, DEAL_STATUS_BADGE, stageMeta } from "../constants/crm";
import { fmtDate, fmtMoney, toDateInput } from "../utils/format";
import { can, homePath } from "../utils/permissions";

const PER_PAGE = 10;

const short = (n) =>
  n >= 1e7 ? `₹${+(n / 1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${+(n / 1e5).toFixed(1)}L` : n >= 1e3 ? `₹${+(n / 1e3).toFixed(0)}K` : `₹${n}`;

const empty = {
  name: "",
  company: "",
  value: "",
  stage: "DISCOVERY",
  probability: "",
  owner: "",
  closeDate: "",
  lead: "",
  notes: "",
};

function Tile({ label, value, hint, icon, tone }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 text-left">
      <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${tone}`}>{icon}</div>
      <p className="mt-4 text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-sm text-slate-400">{hint}</p>}
    </div>
  );
}

export default function Deals() {
  const canManage = can("deals.manage");

  const [data, setData] = useState(null);
  const [options, setOptions] = useState({ users: [], leads: [] });
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("ALL");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState(null); // null | "new" | deal
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/crm/deals");
      setData(res.data);
    } catch {
      toast.error("Failed to load deals");
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
    return (data?.deals || []).filter(
      (d) =>
        (stage === "ALL" || d.stage === stage) &&
        (!q || [d.name, d.company, d.owner?.name].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [data, search, stage]);

  const openNew = () => {
    setForm(empty);
    setEditing("new");
  };

  const openEdit = (d) => {
    setForm({
      name: d.name || "",
      company: d.company || "",
      value: d.value ?? "",
      stage: d.stage,
      probability: d.probability ?? "",
      owner: d.owner?._id || "",
      closeDate: toDateInput(d.closeDate),
      lead: d.lead?._id || "",
      notes: d.notes || "",
    });
    setEditing(d);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Picking a lead pre-fills the company.
  const pickLead = (e) => {
    const id = e.target.value;
    const lead = options.leads.find((l) => l._id === id);
    setForm((f) => ({ ...f, lead: id, company: f.company || lead?.company || "" }));
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Deal name is required");
    const body = { ...form, value: Number(form.value) || 0 };
    // Let the stage decide the probability when it was left blank.
    if (body.probability === "") delete body.probability;

    try {
      setSaving(true);
      if (editing === "new") await api.post("/crm/deals", body);
      else await api.put(`/crm/deals/${editing._id}`, body);
      toast.success(editing === "new" ? "Deal created" : "Deal updated");
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save deal");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`Delete deal "${d.name}"?`)) return;
    try {
      await api.delete(`/crm/deals/${d._id}`);
      toast.success("Deal deleted");
      load();
    } catch {
      toast.error("Failed to delete deal");
    }
  };

  const stats = data?.stats;
  const rows = shown.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const chart = (stats?.byStage || []).map((s) => ({
    name: stageMeta(s.stage).label,
    value: s.value,
    color: stageMeta(s.stage).color,
  }));

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Deals"
          breadcrumbs={[
            { label: "Home", to: homePath() },
            { label: "Apps" },
            { label: "CRM" },
            { label: "Deals" },
          ]}
          actions={
            canManage && (
              <PrimaryButton onClick={openNew}>
                <Plus size={18} /> New Deal
              </PrimaryButton>
            )
          }
        />

        {!data ? (
          <Spinner />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
              <Tile label="Total Deals" value={stats.total} icon={<Briefcase size={24} />} tone="bg-indigo-50 text-indigo-500" />
              <Tile label="Won Deals" value={stats.won} hint={`${fmtMoney(stats.wonValue)} value`} icon={<Trophy size={24} />} tone="bg-emerald-50 text-emerald-500" />
              <Tile label="Lost Deals" value={stats.lost} hint={`${stats.lossRate}% loss rate`} icon={<CircleX size={24} />} tone="bg-red-50 text-red-500" />
              <Tile label="In Progress" value={stats.inProgress} hint={`${stats.avgProbability}% avg probability`} icon={<Clock size={24} />} tone="bg-amber-50 text-amber-500" />
              <Tile label="Pipeline Value" value={short(stats.pipelineValue)} hint="Open deals" icon={<IndianRupee size={24} />} tone="bg-cyan-50 text-cyan-500" />
            </div>

            <Card title="Deal Value by Stage">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tickLine={false} />
                    <YAxis tickFormatter={short} tickLine={false} width={70} />
                    <Tooltip formatter={(v) => fmtMoney(v)} cursor={{ fill: "#f1f5f9" }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {chart.map((c) => (
                        <Cell key={c.name} fill={c.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col lg:flex-row gap-4">
              <SearchBox
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
                placeholder="Search deals..."
              />
              <select
                value={stage}
                onChange={(e) => {
                  setStage(e.target.value);
                  setPage(1);
                }}
                className={`${inputClass} lg:w-56`}
              >
                <option value="ALL">All Stages</option>
                {DEAL_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div role="heading" aria-level={2} className="text-lg font-semibold text-slate-900">
                  All Deals
                </div>
                <span className="text-slate-500">{shown.length} deals</span>
              </div>

              {shown.length === 0 ? (
                <EmptyState>No deals found.</EmptyState>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[1100px] w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {["Deal Name", "Company", "Value", "Stage", "Probability", "Owner", "Close Date", "Status", "Actions"].map((h) => (
                          <th key={h} className="px-4 py-4">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((d) => {
                        const sm = stageMeta(d.stage);
                        const st = DEAL_STATUS_BADGE[d.status];
                        return (
                          <tr key={d._id} className="border-t border-slate-100 hover:bg-slate-50/60 text-slate-700">
                            <td className="px-4 py-4 font-semibold text-slate-900">
                              {d.lead ? (
                                <Link to={`/leads/${d.lead._id}`} className="hover:text-brand">
                                  {d.name}
                                </Link>
                              ) : (
                                d.name
                              )}
                            </td>
                            <td className="px-4 py-4">{d.company || "-"}</td>
                            <td className="px-4 py-4 font-bold text-brand">{fmtMoney(d.value)}</td>
                            <td className="px-4 py-4">
                              <Badge className={sm.badge}>{sm.label}</Badge>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-1.5 w-20 rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full"
                                    style={{ width: `${d.probability || 0}%`, background: sm.color }}
                                  />
                                </div>
                                <span className="text-sm">{d.probability ?? 0}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">{d.owner?.name || "-"}</td>
                            <td className="px-4 py-4 whitespace-nowrap">{fmtDate(d.closeDate)}</td>
                            <td className="px-4 py-4">
                              <Badge className={st.badge}>{st.label}</Badge>
                            </td>
                            <td className="px-4 py-4">
                              {canManage && (
                                <div className="flex gap-2">
                                  <IconButton onClick={() => openEdit(d)} aria-label="Edit deal">
                                    <Pencil size={16} />
                                  </IconButton>
                                  <IconButton tone="danger" onClick={() => remove(d)} aria-label="Delete deal">
                                    <Trash2 size={16} />
                                  </IconButton>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <Pagination page={page} perPage={PER_PAGE} total={shown.length} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      <Modal
        open={!!editing}
        title={editing === "new" ? "New Deal" : "Edit Deal"}
        onClose={() => setEditing(null)}
        footer={
          <>
            <GhostButton onClick={() => setEditing(null)}>Cancel</GhostButton>
            <PrimaryButton onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save Deal"}
            </PrimaryButton>
          </>
        }
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Deal name" required>
              <input value={form.name} onChange={set("name")} className={inputClass} />
            </Field>
          </div>
          <Field label="Linked lead">
            <select value={form.lead} onChange={pickLead} className={inputClass}>
              <option value="">None</option>
              {options.leads.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name}
                  {l.company ? ` - ${l.company}` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Company">
            <input value={form.company} onChange={set("company")} className={inputClass} />
          </Field>
          <Field label="Value (₹)">
            <input type="number" min="0" value={form.value} onChange={set("value")} placeholder="e.g. 150000" className={inputClass} />
          </Field>
          <Field label="Stage">
            <select value={form.stage} onChange={set("stage")} className={inputClass}>
              {DEAL_STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Probability (%)" hint="Leave blank to use the stage default">
            <input type="number" min="0" max="100" value={form.probability} onChange={set("probability")} className={inputClass} />
          </Field>
          <Field label="Owner">
            <select value={form.owner} onChange={set("owner")} className={inputClass}>
              <option value="">Unassigned</option>
              {options.users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Close date">
            <input type="date" value={form.closeDate} onChange={set("closeDate")} className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <textarea rows={3} value={form.notes} onChange={set("notes")} className={inputClass} />
            </Field>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
