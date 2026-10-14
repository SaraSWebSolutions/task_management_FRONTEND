import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Layout from "../components/Layout";
import api from "../api/axios";
import toast from "react-hot-toast";
import { money } from "./Projects";

const input =
  "w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#2b1247]";
const primaryBtn =
  "rounded-xl bg-[#2b1247] px-5 py-2.5 text-white transition hover:bg-[#23163a] disabled:opacity-60";

const toRows = (list = []) =>
  list.map((e) => ({
    _id: e._id,
    user: e.user?._id || "",
    name: e.user?.name || "",
    hours: e.hours,
    rate: e.hourlyRate,
    note: e.note || "",
  }));

// Editable list of "person + hours" rows. Used for the team and for support work.
function EntryEditor({ title, rows, setRows, users, withNote, onSave, saving }) {
  const [pick, setPick] = useState("");
  const [hours, setHours] = useState("");

  const add = () => {
    if (!pick) return toast.error("Select a person");
    if (hours === "" || Number(hours) < 0) return toast.error("Enter hours");
    const user = users.find((u) => u._id === pick);
    setRows((r) => [
      ...r,
      { user: pick, name: user?.name || "", hours: Number(hours), rate: null, note: "" },
    ]);
    setPick("");
    setHours("");
  };

  const change = (i, field, value) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));

  return (
    <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-120 text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-3 text-left">Member</th>
                <th className="p-3 text-center w-32">Hours</th>
                {withNote && <th className="p-3 text-left">Note</th>}
                <th className="p-3 text-center">Cost</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3">{row.name}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="0"
                      value={row.hours}
                      onChange={(e) => change(i, "hours", e.target.value)}
                      className={input}
                    />
                  </td>
                  {withNote && (
                    <td className="p-3">
                      <input
                        value={row.note}
                        onChange={(e) => change(i, "note", e.target.value)}
                        placeholder="What was done"
                        className={input}
                      />
                    </td>
                  )}
                  <td className="p-3 text-center">
                    {row.rate == null ? "-" : money(row.rate * row.hours)}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
                      className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <select value={pick} onChange={(e) => setPick(e.target.value)} className={input}>
          <option value="">Select person</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name} {u.designation ? `(${u.designation})` : ""}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="Hours"
          className={`${input} sm:w-32`}
        />
        <button
          onClick={add}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-100"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      <button disabled={saving} onClick={onSave} className={primaryBtn}>
        Save
      </button>
    </div>
  );
}

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({});
  const [team, setTeam] = useState([]);
  const [support, setSupport] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [p, u] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get("/leads/assignees"),
      ]);
      const pr = p.data.project;
      setProject(pr);
      setUsers(u.data.users || []);
      setForm({
        name: pr.name,
        status: pr.status,
        projectValue: pr.projectValue,
        clientEstimationHours: pr.clientEstimationHours,
        teamEstimationHours: pr.teamEstimationHours,
      });
      setTeam(toRows(pr.team));
      setSupport(toRows(pr.support));
    } catch {
      toast.error("Failed to load project");
    }
  };

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [id]);

  const save = async (request, success) => {
    try {
      setSaving(true);
      await request();
      toast.success(success);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!project)
    return (
      <Layout>
        <p className="text-center text-slate-500 mt-20">Loading...</p>
      </Layout>
    );

  const completed = project.status === "COMPLETED";
  const s = project.summary;
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const costRows = (list) =>
    list.map((e, i) => (
      <tr key={i} className="border-t">
        <td className="p-3">{e.user?.name}</td>
        <td className="p-3 text-center">{e.hours}</td>
        <td className="p-3 text-center">{money(e.hourlyRate)}/hr</td>
        <td className="p-3 text-right">{money(e.hours * e.hourlyRate)}</td>
      </tr>
    ));

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-12 space-y-6">
        <div className="bg-white rounded-3xl border shadow-sm p-6">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate("/projects")}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{project.name}</h1>
              <p className="text-slate-500 mt-1">Client: {project.clientName}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">Project details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-sm font-medium text-slate-700">
              Name
              <input value={form.name} onChange={set("name")} className={`${input} mt-2`} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Status
              <select value={form.status} onChange={set("status")} className={`${input} mt-2`}>
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Project value (original)
              <input type="number" min="0" value={form.projectValue} onChange={set("projectValue")} className={`${input} mt-2`} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Client estimation (hrs)
              <input type="number" min="0" value={form.clientEstimationHours} onChange={set("clientEstimationHours")} className={`${input} mt-2`} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Team estimation (hrs)
              <input type="number" min="0" value={form.teamEstimationHours} onChange={set("teamEstimationHours")} className={`${input} mt-2`} />
            </label>
          </div>
          <button
            disabled={saving}
            className={primaryBtn}
            onClick={() => save(() => api.put(`/projects/${id}`, form), "Project updated")}
          >
            Save details
          </button>
        </div>

        {/* Marketing time (edited on the lead) */}
        <div className="bg-white rounded-3xl border shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Marketing time</h2>
            <p className="text-sm text-slate-500 mt-1">
              {s.marketingHours} hrs · {money(s.marketingCost)} spent on marketing for this project
            </p>
          </div>
          {project.lead?._id && (
            <button
              onClick={() => navigate(`/leads/${project.lead._id}`)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
            >
              Update marketing time
            </button>
          )}
        </div>

        {/* Team */}
        <EntryEditor
          title="Team members & time worked"
          rows={team}
          setRows={setTeam}
          users={users}
          saving={saving}
          onSave={() =>
            save(
              () =>
                api.put(`/projects/${id}/team`, {
                  team: team.map((r) => ({ user: r.user, hours: r.hours })),
                }),
              "Team saved",
            )
          }
        />

        {/* Cost breakdown once completed */}
        {completed && (
          <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-semibold text-slate-800">Cost breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-120 text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="p-3 text-left">Member</th>
                    <th className="p-3 text-center">Hours</th>
                    <th className="p-3 text-center">Salary rate</th>
                    <th className="p-3 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {costRows(project.team)}
                  {project.support.length > 0 && (
                    <tr className="border-t bg-slate-50">
                      <td colSpan={4} className="p-3 font-medium">
                        Support after completion
                      </td>
                    </tr>
                  )}
                  {costRows(project.support)}
                  {(project.lead?.marketing?.length || 0) > 0 && (
                    <tr className="border-t bg-slate-50">
                      <td colSpan={4} className="p-3 font-medium">
                        Marketing time
                      </td>
                    </tr>
                  )}
                  {costRows(project.lead?.marketing || [])}
                </tbody>
              </table>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-slate-500">Project value</p>
                <p className="text-2xl font-bold">{money(project.projectValue)}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-slate-500">
                  Team ({s.teamHours} hrs) + support ({s.supportHours} hrs) + marketing ({s.marketingHours} hrs)
                </p>
                <p className="text-2xl font-bold">{money(s.totalCost)}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 sm:col-span-2">
                <p className="text-slate-500">Value after team cost</p>
                <p className={`text-2xl font-bold ${s.profit < 0 ? "text-red-600" : "text-green-600"}`}>
                  {money(s.profit)}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Rate = monthly salary ÷ (26 working days × 8 hours), saved when the
              person is added.
            </p>
          </div>
        )}

        {/* Support after completion */}
        {completed && (
          <EntryEditor
            title="Support after completion"
            rows={support}
            setRows={setSupport}
            users={users}
            withNote
            saving={saving}
            onSave={() =>
              save(
                () =>
                  api.put(`/projects/${id}/support`, {
                    support: support.map((r) => ({
                      _id: r._id,
                      user: r.user,
                      hours: r.hours,
                      note: r.note,
                    })),
                  }),
                "Support time saved",
              )
            }
          />
        )}
      </div>
    </Layout>
  );
}
