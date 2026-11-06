import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Upload, Plus, CalendarPlus, Send, Check } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import MarketingTime from "../components/MarketingTime";
import { Card, Field, Badge, Modal, PrimaryButton, GhostButton, Spinner, inputClass } from "../components/ui";
import { statusMeta } from "../constants/crm";
import { fmtDate, fmtMoney } from "../utils/format";
import { can } from "../utils/permissions";

const nice = (s) =>
  s ? s.charAt(0) + s.slice(1).toLowerCase().replaceAll("_", " ") : "-";

const hasDemo = (type) => type === "DEMO" || type === "BOTH";
const requestLabel = (type) => (type === "BOTH" ? "Demo + Quotation" : nice(type));

const STEP_OF = { NEW: 0, DEMO_SCHEDULED: 1, QUOTATION_SENT: 1, SALES: 2, PROJECT: 3 };

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function Steps({ lead }) {
  const labels = [
    "Lead",
    lead.requestType === "BOTH" ? "Demo & Quotation" : lead.requestType === "DEMO" ? "Demo" : "Quotation",
    "Sales",
    "Project",
  ];
  const at = STEP_OF[lead.status] ?? -1;
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {labels.map((l, i) => {
        const done = i < at || lead.status === "PROJECT";
        const now = i === at && lead.status !== "PROJECT";
        return (
          <li key={l} className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                done
                  ? "bg-emerald-100 text-emerald-700"
                  : now
                    ? "bg-brand text-white"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {done && <Check size={14} />}
              {l}
            </span>
            {i < labels.length - 1 && <span className="h-px w-5 bg-slate-300" />}
          </li>
        );
      })}
    </ol>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900 break-words">{value || "-"}</span>
    </div>
  );
}

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(false);

  const [salesNotes, setSalesNotes] = useState("");

  const [demo, setDemo] = useState({
    assignedTo: "",
    demoDate: "",
    demoNotes: "",
    location: "",
    spendAmount: "",
    spendDoc: "",
    spendDocName: "",
  });

  const [emailIt, setEmailIt] = useState(true);

  const [projectOpen, setProjectOpen] = useState(false);
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
        demoNotes: l.demoNotes || "",
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
      toast.success(typeof success === "function" ? success(res) : success);
      return res;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const pickSpendFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return toast.error("File is too large (max 4 MB)");
    const data = await readFile(file);
    setDemo((d) => ({ ...d, spendDoc: data, spendDocName: file.name }));
  };

  // ---- quotation: upload a file ...
  const pickQuotationFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return toast.error("File is too large (max 4 MB)");
    const data = await readFile(file);
    const res = await run(
      () => api.put(`/leads/${id}/quotation`, { mode: "FILE", file: data, fileName: file.name }),
      "Quotation file saved",
    );
    if (res) load();
  };

  const sendQuote = async () => {
    const res = await run(
      () => api.post(`/leads/${id}/quotation`, { email: emailIt }),
      (r) => r.data.message,
    );
    if (res) load();
  };

  if (!lead)
    return (
      <Layout>
        <Spinner />
      </Layout>
    );

  const canManage = can("leads.manage");
  // view-only people see the lead but cannot change it
  const closed = !canManage || ["SALES", "PROJECT", "LOST"].includes(lead.status);
  const isOffline = lead.demoType === "OFFLINE";
  const meta = statusMeta(lead.status);
  const showQuotation =
    canManage &&
    ["NEW", "DEMO_SCHEDULED", "QUOTATION_SENT"].includes(lead.status) &&
    (lead.requestType !== "DEMO" || lead.status !== "NEW");
  // Quotation leads convert after the quotation is sent; demo-only leads after the demo
  const showConvertSales =
    canManage &&
    (lead.status === "QUOTATION_SENT" ||
      (lead.requestType === "DEMO" && lead.status === "DEMO_SCHEDULED"));
  const q = lead.quotation;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pb-12 space-y-6 text-left">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-wrap items-start gap-4">
            <button
              onClick={() => navigate("/leads")}
              aria-label="Back to leads"
              className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <div role="heading" aria-level={1} className="text-3xl font-bold text-slate-900">
                  {lead.name}
                </div>
                <Badge className={meta.badge}>{meta.label}</Badge>
              </div>
              <p className="mt-1 text-slate-500">
                {[lead.company, lead.email, lead.phone].filter(Boolean).join(" · ")}
              </p>
              {lead.whatsapp && (
                <p className="mt-1 text-sm text-slate-500">WhatsApp: {lead.whatsapp}</p>
              )}
              <p className="mt-2 text-sm text-slate-600">
                Asking for: <b>{requestLabel(lead.requestType)}</b>
                {hasDemo(lead.requestType) && lead.demoType && <> ({nice(lead.demoType)} demo)</>}
              </p>
              {lead.notes && <p className="mt-2 text-sm text-slate-500">{lead.notes}</p>}
            </div>
            {can("followups.manage") && (
              <PrimaryButton
                onClick={() => navigate("/crm/follow-ups", { state: { newFor: lead._id } })}
              >
                <CalendarPlus size={18} /> Add follow-up
              </PrimaryButton>
            )}
          </div>
          {lead.status !== "LOST" && (
            <div className="mt-5 border-t border-slate-100 pt-5">
              <Steps lead={lead} />
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3 items-start">
          <div className="lg:col-span-2 space-y-6">
            {/* Demo */}
            {hasDemo(lead.requestType) && (
              <Card title={`Demo (${nice(lead.demoType)})`}>
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Assigned to" required>
                      <select
                        disabled={closed}
                        value={demo.assignedTo}
                        onChange={(e) => setDemo((d) => ({ ...d, assignedTo: e.target.value }))}
                        className={inputClass}
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
                        onChange={(e) => setDemo((d) => ({ ...d, demoDate: e.target.value }))}
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <Field label="Demo notes">
                    <textarea
                      disabled={closed}
                      rows={3}
                      value={demo.demoNotes}
                      onChange={(e) => setDemo((d) => ({ ...d, demoNotes: e.target.value }))}
                      placeholder="Notes for the demo"
                      className={inputClass}
                    />
                  </Field>

                  {isOffline && (
                    <>
                      <div className="grid sm:grid-cols-2 gap-5">
                        <Field label="Location" required>
                          <input
                            disabled={closed}
                            value={demo.location}
                            onChange={(e) => setDemo((d) => ({ ...d, location: e.target.value }))}
                            placeholder="Where is the demo?"
                            className={inputClass}
                          />
                        </Field>
                        <Field label="Spend amount" required>
                          <input
                            disabled={closed}
                            type="number"
                            min="0"
                            value={demo.spendAmount}
                            onChange={(e) => setDemo((d) => ({ ...d, spendAmount: e.target.value }))}
                            placeholder="Expense amount"
                            className={inputClass}
                          />
                        </Field>
                      </div>
                      <Field label="Expense copy" required hint="Image or PDF, max 4 MB">
                        {!closed && (
                          <span className="flex items-center gap-2 cursor-pointer rounded-xl border border-dashed border-slate-300 px-4 py-3 text-slate-600 hover:bg-slate-50">
                            <Upload size={18} />
                            {demo.spendDocName || "Choose file"}
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={pickSpendFile}
                              className="hidden"
                            />
                          </span>
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
                    <PrimaryButton
                      disabled={busy}
                      onClick={async () => {
                        const res = await run(
                          () => api.put(`/leads/${id}/demo`, demo),
                          "Demo details saved",
                        );
                        if (res) load();
                      }}
                    >
                      Save demo details
                    </PrimaryButton>
                  )}
                </div>
              </Card>
            )}

            {/* Quotation */}
            {showQuotation && (
              <Card
                title="Quotation"
                subtitle="Upload a ready file, or add a quotation (opens the quotation form). Then send it to the lead."
              >
                <div className="space-y-5">
                  {!lead.quotationSource ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-slate-500">
                      No quotation yet.
                    </div>
                  ) : lead.quotationSource === "FILE" ? (
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-11 w-11 shrink-0 rounded-xl bg-white border border-slate-200 text-brand flex items-center justify-center">
                          <FileText size={20} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{lead.quotationDocName}</p>
                          <p className="text-sm text-slate-500">Uploaded file</p>
                        </div>
                      </div>
                      <a
                        href={lead.quotationDoc}
                        download={lead.quotationDocName || "quotation"}
                        className="text-sm font-semibold text-brand underline shrink-0"
                      >
                        Download
                      </a>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{q?.number}</p>
                        <p className="text-lg font-bold text-slate-900">{fmtMoney(q?.total)}</p>
                      </div>
                      <ul className="mt-3 divide-y divide-slate-200 text-sm">
                        {q?.items?.map((i, n) => (
                          <li key={n} className="flex justify-between gap-3 py-2">
                            <span className="text-slate-700">
                              {i.description} <span className="text-slate-400">× {i.qty}</span>
                            </span>
                            <span className="text-slate-900">{fmtMoney(i.qty * i.rate)}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-slate-500">
                        Subtotal {fmtMoney(q?.subtotal)}
                        {q?.taxPercent ? ` · Tax ${q.taxPercent}% ${fmtMoney(q.tax)}` : ""}
                        {q?.validUntil ? ` · Valid until ${fmtDate(q.validUntil)}` : ""}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <label
                      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer ${busy ? "opacity-60 pointer-events-none" : ""}`}
                    >
                      <Upload size={18} />
                      {lead.quotationSource === "FILE" ? "Replace file" : "Upload file"}
                      <input
                        type="file"
                        accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx"
                        onChange={pickQuotationFile}
                        className="hidden"
                      />
                    </label>
                    <GhostButton onClick={() => navigate(`/quotations/new?lead=${lead._id}`)}>
                      <Plus size={18} />
                      {lead.quotationSource === "FORM" ? "Edit quotation" : "Add quotation"}
                    </GhostButton>
                  </div>

                  <div className="border-t border-slate-100 pt-5 space-y-4">
                    <label className="flex items-center gap-3 text-slate-700">
                      <input
                        type="checkbox"
                        checked={emailIt}
                        onChange={(e) => setEmailIt(e.target.checked)}
                      />
                      Email it to {lead.email}
                    </label>
                    <div className="flex flex-wrap items-center gap-4">
                      <PrimaryButton disabled={busy || !lead.quotationSource} onClick={sendQuote}>
                        <Send size={18} />
                        {lead.quotationSentAt ? "Send again" : "Send quotation"}
                      </PrimaryButton>
                      {lead.quotationSentAt && (
                        <span className="text-sm text-slate-500">
                          Last sent {new Date(lead.quotationSentAt).toLocaleString()}
                        </span>
                      )}
                      {!lead.quotationSource && (
                        <span className="text-sm text-slate-400">Add a file or create the quotation first.</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Convert to sales */}
            {showConvertSales && (
              <Card
                title="Convert to sales"
                subtitle={
                  lead.quotationSentAt
                    ? "Quotation sent. Lead agreed? Add a note and move it to sales."
                    : "Demo done. Lead agreed? Add a note and move it to sales."
                }
              >
                <div className="space-y-4">
                  <Field label="Notes" required>
                    <textarea
                      rows={4}
                      value={salesNotes}
                      onChange={(e) => setSalesNotes(e.target.value)}
                      placeholder="What did the lead agree to? Price, timeline, next steps..."
                      className={inputClass}
                    />
                  </Field>
                  <PrimaryButton
                    disabled={busy}
                    onClick={async () => {
                      if (!salesNotes.trim()) return toast.error("Type a note before converting to sales");
                      const res = await run(
                        () => api.post(`/leads/${id}/convert-sales`, { notes: salesNotes }),
                        "Converted to sales",
                      );
                      if (res) {
                        setSalesNotes("");
                        load();
                      }
                    }}
                  >
                    Convert to sales
                  </PrimaryButton>
                </div>
              </Card>
            )}

            {["SALES", "PROJECT"].includes(lead.status) && lead.salesNotes && (
              <Card title="Sales notes">
                <p className="whitespace-pre-wrap text-slate-700">{lead.salesNotes}</p>
                {lead.salesAt && (
                  <p className="mt-2 text-xs text-slate-400">Converted on {fmtDate(lead.salesAt)}</p>
                )}
              </Card>
            )}

            {/* Convert to project */}
            {canManage && lead.status === "SALES" && (
              <Card title="Convert to project" subtitle="Sales is done. Create the project to start the work.">
                <PrimaryButton onClick={() => setProjectOpen(true)}>
                  <Plus size={18} /> Create project
                </PrimaryButton>
              </Card>
            )}

            {lead.status === "PROJECT" && lead.project && (
              <Card title="Project">
                <PrimaryButton onClick={() => navigate(`/projects?edit=${lead.project}`)}>
                  Open project
                </PrimaryButton>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card title="Lead details">
              <div className="divide-y divide-slate-100 -my-2">
                <Info label="Company" value={lead.company} />
                <Info label="Email" value={lead.email} />
                <Info label="Phone" value={lead.phone} />
                <Info label="WhatsApp" value={lead.whatsapp} />
                <Info label="Source" value={nice(lead.source)} />
                <Info label="Priority" value={nice(lead.priority)} />
                <Info label="Expected value" value={lead.value ? fmtMoney(lead.value) : ""} />
                <Info label="Added" value={fmtDate(lead.createdAt)} />
              </div>
            </Card>
            <MarketingTime lead={lead} users={users} onSaved={load} />
          </div>
        </div>
      </div>

      {/* Convert to project drawer (same look as Add Project) */}
      <Modal
        open={projectOpen}
        title="Convert to Project"
        onClose={() => setProjectOpen(false)}
        footer={
          <>
            <GhostButton onClick={() => setProjectOpen(false)}>Cancel</GhostButton>
            <PrimaryButton
              disabled={busy}
              onClick={async () => {
                const res = await run(
                  () => api.post(`/leads/${id}/convert-project`, project),
                  "Project created",
                );
                if (res) navigate(`/projects?edit=${res.data.project._id}`);
              }}
            >
              Create Project
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Project Title" required>
            <input
              value={project.name}
              onChange={(e) => setProject((p) => ({ ...p, name: e.target.value }))}
              placeholder="Enter project title"
              className={inputClass}
            />
          </Field>
          <Field label="Project Value (₹)">
            <input
              type="number"
              min="0"
              value={project.projectValue}
              onChange={(e) => setProject((p) => ({ ...p, projectValue: e.target.value }))}
              placeholder="0"
              className={inputClass}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Client Estimation (hrs)">
              <input
                type="number"
                min="0"
                value={project.clientEstimationHours}
                onChange={(e) => setProject((p) => ({ ...p, clientEstimationHours: e.target.value }))}
                placeholder="0"
                className={inputClass}
              />
            </Field>
            <Field label="Team Estimation (hrs)">
              <input
                type="number"
                min="0"
                value={project.teamEstimationHours}
                onChange={(e) => setProject((p) => ({ ...p, teamEstimationHours: e.target.value }))}
                placeholder="0"
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
