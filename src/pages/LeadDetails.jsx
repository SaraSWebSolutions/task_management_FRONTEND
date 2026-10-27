import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Upload } from "lucide-react";
import Layout from "../components/Layout";
import api from "../api/axios";
import MarketingTime from "../components/MarketingTime";
import toast from "react-hot-toast";

const input =
  "w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand";
const primaryBtn =
  "rounded-xl bg-brand px-5 py-3 text-white transition hover:bg-brand-hover disabled:opacity-60";

const nice = (s) =>
  s ? s.charAt(0) + s.slice(1).toLowerCase().replaceAll("_", " ") : "-";

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(false);

  const [demo, setDemo] = useState({
    assignedTo: "",
    demoDate: "",
    location: "",
    spendAmount: "",
    spendDoc: "",
    spendDocName: "",
  });
  const [project, setProject] = useState({
    name: "",
    projectValue: "",
    clientEstimationHours: "",
    teamEstimationHours: "",
  });

  const load = async () => {
    try {
      const [leadRes, userRes] = await Promise.all([
        api.get(`/leads/${id}`),
        api.get("/leads/assignees"),
      ]);
      const l = leadRes.data.lead;
      setLead(l);
      setUsers(userRes.data.users || []);
      setDemo({
        assignedTo: l.assignedTo?._id || "",
        demoDate: l.demoDate ? l.demoDate.slice(0, 10) : "",
        location: l.location || "",
        spendAmount: l.spendAmount ?? "",
        spendDoc: "",
        spendDocName: l.spendDocName || "",
      });
      setProject((p) => ({ ...p, name: p.name || l.company || l.name }));
    } catch {
      toast.error("Failed to load lead");
    }
  };

  useEffect(() => {
    Promise.resolve().then(load);
  }, [id]);

  const run = async (fn, success) => {
    try {
      setBusy(true);
      const res = await fn();
      toast.success(success);
      return res;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const pickFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024)
      return toast.error("File is too large (max 4 MB)");

    const reader = new FileReader();
    reader.onload = () =>
      setDemo((d) => ({
        ...d,
        spendDoc: reader.result,
        spendDocName: file.name,
      }));
    reader.readAsDataURL(file);
  };

  if (!lead)
    return (
      <Layout>
        <p className="text-center text-slate-500 mt-20">Loading...</p>
      </Layout>
    );

  const closed = ["SALES", "PROJECT", "LOST"].includes(lead.status);
  const isOffline = lead.demoType === "OFFLINE";

  return (
    <Layout>
      <div className="max-w-3xl mx-auto pb-12 space-y-6">
        <div className="bg-white rounded-3xl border shadow-sm p-6">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate("/leads")}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-800">{lead.name}</h1>
              <p className="text-slate-500 mt-1">
                {[lead.company, lead.email, lead.phone]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="text-sm text-slate-600 mt-3">
                Asking for: <b>{nice(lead.requestType)}</b>
                {lead.requestType === "DEMO" && (
                  <> ({nice(lead.demoType)})</>
                )}
                {" · "}Status: <b>{nice(lead.status)}</b>
              </p>
              {lead.notes && (
                <p className="text-sm text-slate-500 mt-2">{lead.notes}</p>
              )}
            </div>
          </div>
        </div>

        {/* Demo */}
        {lead.requestType === "DEMO" && (
          <Card title={`Demo (${nice(lead.demoType)})`}>
            <Field label="Assigned to *">
              <select
                disabled={closed}
                value={demo.assignedTo}
                onChange={(e) =>
                  setDemo((d) => ({ ...d, assignedTo: e.target.value }))
                }
                className={input}
              >
                <option value="">Select person</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} {u.designation ? `(${u.designation})` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Demo date">
              <input
                disabled={closed}
                type="date"
                value={demo.demoDate}
                onChange={(e) =>
                  setDemo((d) => ({ ...d, demoDate: e.target.value }))
                }
                className={input}
              />
            </Field>

            {isOffline && (
              <>
                <Field label="Location *">
                  <input
                    disabled={closed}
                    value={demo.location}
                    onChange={(e) =>
                      setDemo((d) => ({ ...d, location: e.target.value }))
                    }
                    placeholder="Where is the demo?"
                    className={input}
                  />
                </Field>
                <Field label="Spend amount *">
                  <input
                    disabled={closed}
                    type="number"
                    min="0"
                    value={demo.spendAmount}
                    onChange={(e) =>
                      setDemo((d) => ({ ...d, spendAmount: e.target.value }))
                    }
                    placeholder="Expense amount"
                    className={input}
                  />
                </Field>
                <Field label="Expense copy * (image or PDF, max 4 MB)">
                  {!closed && (
                    <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-dashed border-slate-300 px-4 py-3 text-slate-600 hover:bg-slate-50">
                      <Upload size={18} />
                      {demo.spendDocName || "Choose file"}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={pickFile}
                        className="hidden"
                      />
                    </label>
                  )}
                  {lead.spendDoc && !demo.spendDoc && (
                    <a
                      href={lead.spendDoc}
                      download={lead.spendDocName || "expense-copy"}
                      className="mt-2 inline-flex items-center gap-2 text-sm text-brand underline"
                    >
                      <FileText size={16} /> {lead.spendDocName || "Saved copy"}
                    </a>
                  )}
                </Field>
              </>
            )}

            {!closed && (
              <button
                disabled={busy}
                className={primaryBtn}
                onClick={async () => {
                  const res = await run(
                    () => api.put(`/leads/${id}/demo`, demo),
                    "Demo details saved",
                  );
                  if (res) load();
                }}
              >
                Save demo details
              </button>
            )}
          </Card>
        )}

        {/* Quotation */}
        {["NEW", "DEMO_SCHEDULED", "QUOTATION_SENT"].includes(lead.status) &&
          (lead.requestType === "QUOTATION" || lead.status !== "NEW") && (
            <Card title="Quotation">
              {lead.quotationSentAt && (
                <p className="text-sm text-slate-600">
                  Sent on {new Date(lead.quotationSentAt).toLocaleString()}
                </p>
              )}
              <button
                disabled={busy}
                className={primaryBtn}
                onClick={async () => {
                  const res = await run(
                    () => api.post(`/leads/${id}/quotation`),
                    "Quotation marked as sent",
                  );
                  if (res) load();
                }}
              >
                {lead.quotationSentAt ? "Mark sent again" : "Send quotation"}
              </button>
            </Card>
          )}

        {/* Convert to sales */}
        {["DEMO_SCHEDULED", "QUOTATION_SENT"].includes(lead.status) && (
          <Card title="Convert to sales">
            <p className="text-sm text-slate-600">
              Lead agreed? Move it to sales, then create the project.
            </p>
            <button
              disabled={busy}
              className={primaryBtn}
              onClick={async () => {
                const res = await run(
                  () => api.post(`/leads/${id}/convert-sales`),
                  "Converted to sales",
                );
                if (res) load();
              }}
            >
              Convert to sales
            </button>
          </Card>
        )}

        {/* Convert to project */}
        {lead.status === "SALES" && (
          <Card title="Convert to project">
            <Field label="Project name *">
              <input
                value={project.name}
                onChange={(e) =>
                  setProject((p) => ({ ...p, name: e.target.value }))
                }
                className={input}
              />
            </Field>
            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Project value">
                <input
                  type="number"
                  min="0"
                  value={project.projectValue}
                  onChange={(e) =>
                    setProject((p) => ({ ...p, projectValue: e.target.value }))
                  }
                  className={input}
                />
              </Field>
              <Field label="Client estimation (hrs)">
                <input
                  type="number"
                  min="0"
                  value={project.clientEstimationHours}
                  onChange={(e) =>
                    setProject((p) => ({
                      ...p,
                      clientEstimationHours: e.target.value,
                    }))
                  }
                  className={input}
                />
              </Field>
              <Field label="Team estimation (hrs)">
                <input
                  type="number"
                  min="0"
                  value={project.teamEstimationHours}
                  onChange={(e) =>
                    setProject((p) => ({
                      ...p,
                      teamEstimationHours: e.target.value,
                    }))
                  }
                  className={input}
                />
              </Field>
            </div>
            <button
              disabled={busy}
              className={primaryBtn}
              onClick={async () => {
                const res = await run(
                  () => api.post(`/leads/${id}/convert-project`, project),
                  "Project created",
                );
                if (res) navigate(`/projects/${res.data.project._id}`);
              }}
            >
              Create project
            </button>
          </Card>
        )}

        {lead.status === "PROJECT" && lead.project && (
          <Card title="Project">
            <button
              className={primaryBtn}
              onClick={() => navigate(`/projects/${lead.project}`)}
            >
              Open project
            </button>
          </Card>
        )}
        <MarketingTime lead={lead} users={users} onSaved={load} />
      </div>
    </Layout>
  );
}
