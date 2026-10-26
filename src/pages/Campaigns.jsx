import { useCallback, useEffect, useMemo, useState } from "react";
import { PenSquare, Send, FileText, Trash2, RotateCcw, Users, Reply } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Spinner, EmptyState, Modal, Field, PrimaryButton, GhostButton, DangerButton, SearchBox, Badge, inputClass } from "../components/ui";
import { apiError } from "../components/finance/helpers";
import { fmtDate, timeAgo } from "../utils/format";
import { can, homePath } from "../utils/permissions";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const parseEmails = (text) => {
  const all = text.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean);
  return { emails: [...new Set(all.filter((e) => EMAIL.test(e)))], invalid: [...new Set(all.filter((e) => !EMAIL.test(e)))] };
};

const STATUS = {
  DRAFT: ["Draft", "bg-slate-100 text-slate-600"],
  SENT: ["Sent", "bg-emerald-100 text-emerald-700"],
  PARTIAL: ["Some failed", "bg-amber-100 text-amber-700"],
  FAILED: ["Failed", "bg-red-100 text-red-700"],
};
const LEAD_STATUS = [["", "Any status"], ["NEW", "New"], ["DEMO_SCHEDULED", "Demo scheduled"], ["QUOTATION_SENT", "Quotation sent"], ["SALES", "Sales"], ["PROJECT", "Won"], ["LOST", "Lost"]];
const LEAD_SOURCE = [["", "Any source"], ["BNI", "BNI"], ["EVENT", "Event"], ["META", "Meta Ads"], ["INDIAMART", "IndiaMART"], ["OTHER", "Other"]];

const FOLDERS = [
  { key: "sent", label: "Sent", icon: Send },
  { key: "drafts", label: "Drafts", icon: FileText },
  { key: "trash", label: "Trash", icon: Trash2 },
];
const blank = { id: "", name: "", title: "", body: "", to: "", followUpOf: null };

export default function Campaigns() {
  const canManage = can("campaigns.manage");
  const canLeads = can("leads.view");

  const [data, setData] = useState(null);
  const [folder, setFolder] = useState("sent");
  const [search, setSearch] = useState("");
  const [view, setView] = useState(null);

  const [compose, setCompose] = useState(false);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState("");
  const [confirm, setConfirm] = useState(false);

  const [picker, setPicker] = useState(false);
  const [filter, setFilter] = useState({ status: "", source: "" });
  const [leads, setLeads] = useState(null);
  const [chosen, setChosen] = useState([]);

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.get("/campaigns");
      setData(d);
    } catch (e) {
      toast.error(apiError(e, "Failed to load campaigns"));
      setData({ campaigns: [], counts: { sent: 0, drafts: 0, trash: 0 } });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.campaigns || []).filter((c) => {
      const inFolder = folder === "trash" ? c.trashed : !c.trashed && (folder === "drafts" ? c.status === "DRAFT" : c.status !== "DRAFT");
      return inFolder && (!q || [c.name, c.title, c.body].some((v) => v?.toLowerCase().includes(q)) || c.emails.some((e) => e.includes(q)));
    });
  }, [data, folder, search]);

  const { emails, invalid } = parseEmails(form.to);
  const followUp = !!form.followUpOf;

  const openCompose = (c) => {
    setForm(c ? { id: c._id, name: c.name || "", title: c.title || "", body: c.body || "", to: c.emails.join(", "), followUpOf: null } : blank);
    setView(null);
    setCompose(true);
  };

  const openFollowUp = (c) => {
    setForm({ id: "", name: c.name, title: `Following up: ${c.title}`, body: "", to: c.emails.join(", "), followUpOf: c });
    setView(null);
    setCompose(true);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const saveDraft = async () => {
    try {
      setBusy("draft");
      await api.post("/campaigns/draft", { id: form.id || undefined, name: form.name, title: form.title, body: form.body, emails: form.to });
      toast.success("Draft saved");
      setCompose(false);
      setFolder("drafts");
      load();
    } catch (e) {
      toast.error(apiError(e, "Failed to save draft"));
    } finally {
      setBusy("");
    }
  };

  const checkBeforeSend = () => {
    if (!followUp && !form.name.trim()) return toast.error("Give the campaign a name");
    if (!form.title.trim()) return toast.error("Enter the email subject");
    if (!form.body.trim()) return toast.error("Write the message");
    if (!emails.length) return toast.error("Add at least one recipient");
    if (invalid.length) return toast.error(`Not a valid email: ${invalid[0]}${invalid.length > 1 ? ` (+${invalid.length - 1} more)` : ""}`);
    if (emails.length > 100) return toast.error("You can send to at most 100 recipients at a time");
    setConfirm(true);
  };

  const send = async () => {
    try {
      setBusy("send");
      let res;
      if (followUp) res = await api.post(`/campaigns/${form.followUpOf._id}/follow-up`, { title: form.title, body: form.body });
      else if (form.id) res = await api.post(`/campaigns/${form.id}/send`, { name: form.name, title: form.title, body: form.body, emails: form.to });
      else res = await api.post("/campaigns/add", { name: form.name, title: form.title, body: form.body, emails: form.to });
      toast.success(res.data.message);
      setConfirm(false);
      setCompose(false);
      setFolder("sent");
      load();
    } catch (e) {
      // 207 / 502 still carry the result
      const r = e?.response?.data;
      if (r?.stats) {
        toast[r.stats.successCount ? "success" : "error"](r.message, { duration: 6000 });
        setConfirm(false);
        setCompose(false);
        setFolder("sent");
        load();
      } else toast.error(apiError(e, "Failed to send"));
    } finally {
      setBusy("");
    }
  };

  const act = async (fn, okMsg) => {
    try {
      await fn();
      if (okMsg) toast.success(okMsg);
      setView(null);
      load();
    } catch (e) {
      toast.error(apiError(e, "Action failed"));
    }
  };

  const openPicker = async () => {
    setPicker(true);
    setChosen([]);
    loadLeads({ status: "", source: "" });
  };
  const loadLeads = async (f) => {
    setFilter(f);
    setLeads(null);
    try {
      const { data: d } = await api.get("/campaigns/recipients", { params: Object.fromEntries(Object.entries(f).filter(([, v]) => v)) });
      setLeads(d.recipients);
    } catch (e) {
      toast.error(apiError(e, "Failed to load leads"));
      setLeads([]);
    }
  };
  const addChosen = () => {
    const merged = [...new Set([...emails, ...chosen])];
    setForm((f) => ({ ...f, to: merged.join(", ") }));
    setPicker(false);
  };

  const crumbs = [{ label: "Home", to: homePath() }, { label: "Email Campaigns" }];
  if (!data) return <Layout><PageHeader title="Email Campaigns" breadcrumbs={crumbs} /><Spinner /></Layout>;

  const counts = data.counts;
  const FolderIcon = FOLDERS.find((f) => f.key === folder).icon;

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader title="Email Campaigns" breadcrumbs={crumbs} actions={canManage && <PrimaryButton onClick={() => openCompose()}><PenSquare size={18} /> Compose</PrimaryButton>} />

        <div className="grid gap-6 lg:grid-cols-4 items-start">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
            {FOLDERS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setFolder(key)} className={`w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-left font-semibold ${folder === key ? "bg-violet-50 text-brand border-l-4 border-brand" : "text-slate-600 hover:bg-slate-50"}`}>
                <Icon size={19} /><span className="flex-1">{label}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${folder === key ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}>{counts[key]}</span>
              </button>
            ))}
            <p className="mt-3 px-4 pb-2 text-xs text-slate-400">Mail goes out through the email account set up for the server.</p>
          </div>

          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
              <span className="flex items-center gap-2 text-lg font-semibold text-slate-900"><FolderIcon size={19} /> {FOLDERS.find((f) => f.key === folder).label} ({rows.length})</span>
              <div className="sm:w-72"><SearchBox value={search} onChange={setSearch} placeholder="Search emails..." /></div>
            </div>

            {rows.length === 0 ? <EmptyState>{folder === "drafts" ? "No drafts." : folder === "trash" ? "Trash is empty." : "No campaigns sent yet. Click Compose to send your first one."}</EmptyState> : (
              <ul className="divide-y divide-slate-100">
                {rows.map((c) => {
                  const st = STATUS[c.status];
                  return (
                    <li key={c._id}>
                      <button onClick={() => setView(c)} className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-slate-50">
                        <span className="mt-0.5 h-11 w-11 shrink-0 rounded-full bg-violet-100 text-brand flex items-center justify-center font-bold">{(c.name || "?").charAt(0).toUpperCase()}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-slate-900">{c.name || "Untitled"}</span><Badge className={st[1]}>{st[0]}</Badge>{c.followUpCount > 0 && <Badge className="bg-cyan-50 text-cyan-700">{c.followUpCount} follow-up{c.followUpCount > 1 ? "s" : ""}</Badge>}</span>
                          <span className="block font-medium text-slate-800 truncate">{c.title || "(no subject)"}</span>
                          <span className="block text-sm text-slate-500 truncate">{c.body}</span>
                        </span>
                        <span className="shrink-0 text-right text-sm text-slate-400"><span className="block">{c.sentAt ? fmtDate(c.sentAt) : timeAgo(c.updatedAt)}</span><span className="block mt-1 flex items-center justify-end gap-1"><Users size={13} /> {c.emails.length}</span></span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* View */}
      <Modal
        open={!!view}
        wide
        title={view?.name || "Campaign"}
        onClose={() => setView(null)}
        footer={view && canManage && (
          <>
            {view.trashed ? (
              <>
                <GhostButton onClick={() => act(() => api.patch(`/campaigns/${view._id}/restore`), "Restored")}><RotateCcw size={16} /> Restore</GhostButton>
                <DangerButton onClick={() => act(() => api.delete(`/campaigns/${view._id}`), "Deleted")}>Delete forever</DangerButton>
              </>
            ) : (
              <>
                <GhostButton onClick={() => act(() => api.patch(`/campaigns/${view._id}/trash`), "Moved to trash")}><Trash2 size={16} /> Trash</GhostButton>
                {view.status === "DRAFT" && <PrimaryButton onClick={() => openCompose(view)}><PenSquare size={16} /> Edit & send</PrimaryButton>}
                {view.status === "FAILED" && <PrimaryButton onClick={() => openCompose(view)}><Send size={16} /> Try again</PrimaryButton>}
                {["SENT", "PARTIAL"].includes(view.status) && <PrimaryButton onClick={() => openFollowUp(view)}><Reply size={16} /> Send follow-up</PrimaryButton>}
              </>
            )}
          </>
        )}
      >
        {view && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2"><Badge className={STATUS[view.status][1]}>{STATUS[view.status][0]}</Badge>{view.sentAt && <span className="text-sm text-slate-500">Sent {fmtDate(view.sentAt)} by {view.createdBy?.name || "-"}</span>}</div>
            <div><p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Subject</p><p className="text-lg font-semibold text-slate-900">{view.title || "(no subject)"}</p></div>
            <div className="rounded-xl bg-slate-50 p-4 text-slate-700 whitespace-pre-wrap break-words max-h-64 overflow-y-auto">{view.body || "(empty)"}</div>
            {view.status !== "DRAFT" && <p className="text-sm text-slate-600"><strong>{view.sentCount}</strong> delivered{view.failCount ? <>, <strong className="text-red-600">{view.failCount}</strong> failed</> : null}{view.lastFollowUpAt ? <> · last follow-up {fmtDate(view.lastFollowUpAt)}</> : null}</p>}
            <div>
              <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">Recipients ({view.emails.length})</p>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {view.emails.map((e) => { const bad = view.failures?.some((f) => f.email === e); return <span key={e} className={`rounded-full px-3 py-1 text-sm ${bad ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"}`}>{e}</span>; })}
              </div>
            </div>
            {view.failures?.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
                <p className="font-semibold">Could not send to:</p>
                {view.failures.map((f) => <p key={f.email}>{f.email}: {f.error}</p>)}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Compose */}
      <Modal
        open={compose}
        wide
        title={followUp ? "Send Follow-up" : form.id ? "Edit Draft" : "New Message"}
        onClose={() => setCompose(false)}
        footer={<>{!followUp && <GhostButton disabled={!!busy} onClick={saveDraft}>Save Draft</GhostButton>}<PrimaryButton disabled={!!busy} onClick={checkBeforeSend}><Send size={16} /> Send</PrimaryButton></>}
      >
        <div className="space-y-5">
          {!followUp && <Field label="Campaign name" required hint="Only you see this, to find it later"><input value={form.name} onChange={set("name")} placeholder="e.g. Diwali offer" className={inputClass} /></Field>}
          <Field label="To" required hint={followUp ? "Goes to everyone on the original campaign" : `${emails.length} recipient${emails.length === 1 ? "" : "s"}${invalid.length ? `, ${invalid.length} not valid` : ""}. Separate with commas or new lines.`}>
            <textarea rows={followUp ? 2 : 3} value={form.to} onChange={set("to")} readOnly={followUp} placeholder="Recipient email addresses" className={`${inputClass} ${followUp ? "bg-slate-50" : ""}`} />
          </Field>
          {!followUp && canLeads && <GhostButton onClick={openPicker}><Users size={16} /> Add from leads</GhostButton>}
          {invalid.length > 0 && <p className="text-sm text-red-600">Check: {invalid.slice(0, 3).join(", ")}{invalid.length > 3 ? "..." : ""}</p>}
          <Field label="Subject" required><input value={form.title} onChange={set("title")} placeholder="Email subject" className={inputClass} /></Field>
          <Field label="Message" required><textarea rows={9} value={form.body} onChange={set("body")} placeholder="Write your message..." className={inputClass} /></Field>
        </div>
      </Modal>

      <Modal open={confirm} title="Send email" onClose={() => setConfirm(false)} footer={<><GhostButton disabled={busy === "send"} onClick={() => setConfirm(false)}>Cancel</GhostButton><PrimaryButton disabled={busy === "send"} onClick={send}>{busy === "send" ? "Sending..." : `Send to ${emails.length}`}</PrimaryButton></>}>
        <p className="text-slate-600">Send <strong>{form.title}</strong> to <strong>{emails.length}</strong> recipient{emails.length === 1 ? "" : "s"}? This can&apos;t be undone.{emails.length > 10 ? " Large lists take a little while. Keep this window open." : ""}</p>
      </Modal>

      {/* Lead picker */}
      <Modal open={picker} title="Add recipients from leads" onClose={() => setPicker(false)} footer={<><GhostButton onClick={() => setPicker(false)}>Cancel</GhostButton><PrimaryButton disabled={!chosen.length} onClick={addChosen}>Add {chosen.length || ""}</PrimaryButton></>}>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <select value={filter.status} onChange={(e) => loadLeads({ ...filter, status: e.target.value })} className={inputClass}>{LEAD_STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            <select value={filter.source} onChange={(e) => loadLeads({ ...filter, source: e.target.value })} className={inputClass}>{LEAD_SOURCE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </div>
          {leads === null ? <Spinner /> : leads.length === 0 ? <p className="py-6 text-center text-slate-500">No leads with an email address match.</p> : (
            <>
              <label className="flex items-center gap-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={chosen.length === leads.length} onChange={(e) => setChosen(e.target.checked ? leads.map((l) => l.email) : [])} /> Select all ({leads.length})</label>
              <ul className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                {leads.map((l) => (
                  <li key={l.email}><label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50"><input type="checkbox" checked={chosen.includes(l.email)} onChange={() => setChosen((c) => (c.includes(l.email) ? c.filter((x) => x !== l.email) : [...c, l.email]))} /><span className="min-w-0"><span className="block text-sm font-medium text-slate-900 truncate">{l.name}{l.company ? ` · ${l.company}` : ""}</span><span className="block text-xs text-slate-500 truncate">{l.email}</span></span></label></li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Modal>
    </Layout>
  );
}
