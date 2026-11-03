import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Plus, Trash2, Save, Printer, Mail, MessageCircle, Copy, UserPlus, FolderKanban } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Card, Field, Spinner, PrimaryButton, GhostButton, IconButton, Modal, inputClass } from "../components/ui";
import { Pill } from "../components/analytics/parts";
import { fmtMoney, fmtDate } from "../utils/format";
import { LEAD_SOURCES } from "../constants/leadSources";
import { can, homePath } from "../utils/permissions";
import logo from "../assets/logo.png";

const ymd = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
const inDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return ymd(d);
};

const DEFAULT_TERMS = "50% advance to start the work, balance on delivery.\nPrices are in INR and valid until the date above.";

const emptyForm = () => ({
  customer: { name: "", company: "", email: "", phone: "", address: "" },
  lead: "",
  date: ymd(new Date()),
  items: [{ description: "", qty: 1, rate: "" }],
  discount: "",
  taxPercent: 18,
  validUntil: inDays(15),
  terms: DEFAULT_TERMS,
  notes: "",
});

const calc = (f) => {
  const items = f.items.filter((i) => i.description.trim());
  const subtotal = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0);
  const discount = Math.min(subtotal, Math.max(0, Number(f.discount) || 0));
  const tax = ((subtotal - discount) * (Number(f.taxPercent) || 0)) / 100;
  return { items, subtotal, discount, tax, total: subtotal - discount + tax };
};

// Only the quotation sheet is printed / saved as PDF
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #quotation-print, #quotation-print * { visibility: visible !important; }
  #quotation-print { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
}`;

function Sheet({ form, number, totals }) {
  const c = form.customer;
  return (
    <div id="quotation-print" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-left text-slate-800 text-sm">
      <style>{PRINT_CSS}</style>
      <div className="flex items-start justify-between gap-4">
        <div>
          <img src={logo} alt="SaraS" className="h-12 object-contain" />
          <p className="mt-2 font-semibold">SaraS Web Solutions</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">QUOTATION</p>
          <p className="mt-1 text-slate-500">{number || "Number is given on save"}</p>
          <p className="text-slate-500">Date: {fmtDate(form.date)}</p>
          {form.validUntil && <p className="text-slate-500">Valid until: {fmtDate(form.validUntil)}</p>}
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Quotation for</p>
        <p className="mt-1 font-semibold text-slate-900">{c.name || "Customer name"}</p>
        {c.company && <p>{c.company}</p>}
        {c.address && <p className="whitespace-pre-line">{c.address}</p>}
        {(c.email || c.phone) && <p className="text-slate-500">{[c.email, c.phone].filter(Boolean).join(" · ")}</p>}
      </div>

      <table className="mt-6 w-full text-left">
        <thead>
          <tr className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500">
            <th className="p-2.5">#</th>
            <th className="p-2.5">Item</th>
            <th className="p-2.5 text-right">Qty</th>
            <th className="p-2.5 text-right">Rate</th>
            <th className="p-2.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {totals.items.map((i, n) => (
            <tr key={n} className="border-b border-slate-100">
              <td className="p-2.5">{n + 1}</td>
              <td className="p-2.5">{i.description}</td>
              <td className="p-2.5 text-right">{i.qty}</td>
              <td className="p-2.5 text-right">{fmtMoney(i.rate)}</td>
              <td className="p-2.5 text-right">{fmtMoney((Number(i.qty) || 0) * (Number(i.rate) || 0))}</td>
            </tr>
          ))}
          {!totals.items.length && (
            <tr><td colSpan={5} className="p-6 text-center text-slate-400">Items you add will appear here.</td></tr>
          )}
        </tbody>
      </table>

      <div className="mt-4 ml-auto w-full max-w-xs space-y-1.5">
        <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{fmtMoney(totals.subtotal)}</span></div>
        {totals.discount > 0 && (
          <div className="flex justify-between"><span className="text-slate-500">Discount</span><span>-{fmtMoney(totals.discount)}</span></div>
        )}
        {Number(form.taxPercent) > 0 && (
          <div className="flex justify-between"><span className="text-slate-500">Tax ({form.taxPercent}%)</span><span>{fmtMoney(totals.tax)}</span></div>
        )}
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
          <span>Total</span><span>{fmtMoney(totals.total)}</span>
        </div>
      </div>

      {form.terms && (
        <div className="mt-6">
          <p className="font-semibold text-slate-900">Terms</p>
          <p className="mt-1 whitespace-pre-line text-slate-600">{form.terms}</p>
        </div>
      )}
      {form.notes && <p className="mt-4 whitespace-pre-line text-slate-600">{form.notes}</p>}
      <p className="mt-8 text-slate-500">Thank you for your business.</p>
    </div>
  );
}

export default function QuotationForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const canManage = can("leads.manage");

  const [form, setForm] = useState(emptyForm());
  const [saved, setSaved] = useState(null); // quotation from the server (has number + status)
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [leadInfo, setLeadInfo] = useState(null); // status + project of the linked lead
  const [convert, setConvert] = useState(null); // null | "LEAD" | "PROJECT"
  const [conv, setConv] = useState({ source: "OTHER", projectName: "", projectValue: "" });

  useEffect(() => {
    api.get("/quotations/catalog").then((r) => setCatalog(r.data.items || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        if (id) {
          const { quotation: q } = (await api.get(`/quotations/${id}`)).data;
          setSaved(q);
          setForm({
            customer: { name: q.customer?.name || "", company: q.customer?.company || "", email: q.customer?.email || "", phone: q.customer?.phone || "", address: q.customer?.address || "" },
            lead: q.lead || "",
            date: ymd(q.date),
            items: q.items.map((i) => ({ description: i.description, qty: i.qty, rate: i.rate })),
            discount: q.discount || "",
            taxPercent: q.taxPercent,
            validUntil: q.validUntil ? ymd(q.validUntil) : "",
            terms: q.terms || "",
            notes: q.notes || "",
          });
        } else if (params.get("lead")) {
          // Started from a lead: fill the customer details (and any quotation already made)
          const { lead } = (await api.get(`/leads/${params.get("lead")}`)).data;
          const f = emptyForm();
          f.lead = lead._id;
          f.customer = { name: lead.name || "", company: lead.company || "", email: lead.email || "", phone: lead.phone || "", address: "" };
          if (lead.quotationSource === "FORM" && lead.quotation?.items?.length) {
            const real = lead.quotation.items.filter((i) => i.rate >= 0);
            const disc = lead.quotation.items.find((i) => i.rate < 0);
            f.items = real.map((i) => ({ description: i.description, qty: i.qty, rate: i.rate }));
            f.discount = disc ? Math.abs(disc.rate) : "";
            f.taxPercent = lead.quotation.taxPercent ?? 18;
            f.validUntil = lead.quotation.validUntil ? ymd(lead.quotation.validUntil) : f.validUntil;
            f.terms = lead.quotation.terms || f.terms;
            f.notes = lead.quotation.notes || "";
          }
          setForm(f);
        }
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!saved?.lead) return setLeadInfo(null);
    api
      .get(`/leads/${saved.lead}`)
      .then((r) => setLeadInfo({ status: r.data.lead.status, project: r.data.lead.project }))
      .catch(() => setLeadInfo(null));
  }, [saved?._id, saved?.lead]);

  const totals = useMemo(() => calc(form), [form]);

  const setCustomer = (k) => (e) => setForm((f) => ({ ...f, customer: { ...f.customer, [k]: e.target.value } }));
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setItem = (n, k, v) =>
    setForm((f) => ({ ...f, items: f.items.map((it, i) => (i === n ? { ...it, [k]: v } : it)) }));
  const addItem = (item) =>
    setForm((f) => {
      const blank = f.items.length === 1 && !f.items[0].description && !f.items[0].rate;
      const next = item || { description: "", qty: 1, rate: "" };
      return { ...f, items: blank ? [next] : [...f.items, next] };
    });
  const removeItem = (n) =>
    setForm((f) => ({ ...f, items: f.items.length > 1 ? f.items.filter((_, i) => i !== n) : f.items }));

  // Save (create or update) and return the saved quotation
  const save = async (quiet = false) => {
    if (!form.customer.name.trim()) throw new Error("Enter the customer name");
    if (!totals.items.length) throw new Error("Add at least one item");
    const body = { ...form };
    const res = saved
      ? await api.put(`/quotations/${saved._id}`, body)
      : await api.post("/quotations", body);
    const q = res.data.quotation;
    setSaved(q);
    if (!saved) navigate(`/quotations/${q._id}`, { replace: true });
    if (!quiet) toast.success("Quotation saved");
    return q;
  };

  const guard = (fn) => async () => {
    try {
      setBusy(true);
      await fn();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const summaryText = (q) => {
    const lines = [
      `*Quotation ${q.number}* - SaraS Web Solutions`,
      `Hi ${form.customer.name},`,
      "",
      ...totals.items.map((i, n) => `${n + 1}. ${i.description} x ${i.qty} = ${fmtMoney((Number(i.qty) || 0) * (Number(i.rate) || 0))}`),
      "",
      totals.discount > 0 ? `Discount: -${fmtMoney(totals.discount)}` : null,
      Number(form.taxPercent) > 0 ? `Tax (${form.taxPercent}%): ${fmtMoney(totals.tax)}` : null,
      `*Total: ${fmtMoney(totals.total)}*`,
      form.validUntil ? `Valid until: ${fmtDate(form.validUntil)}` : null,
    ];
    return lines.filter((l) => l !== null).join("\n");
  };

  const onSave = guard(() => save());

  const openConvert = (target) =>
    guard(async () => {
      const q = await save(true); // convert what is on the screen
      setConv({
        source: "OTHER",
        projectName: `${form.customer.company || form.customer.name} - ${q.number}`,
        projectValue: q.total,
      });
      setConvert(target);
    })();

  const doConvert = guard(async () => {
    const res = await api.post(`/quotations/${saved._id}/convert`, {
      target: convert,
      source: conv.source,
      projectName: conv.projectName,
      projectValue: conv.projectValue,
    });
    toast.success(res.data.message);
    setConvert(null);
    if (convert === "PROJECT") return navigate(`/projects/${res.data.project._id}`);
    const q = (await api.get(`/quotations/${saved._id}`)).data.quotation;
    setSaved(q);
    setForm((f) => ({ ...f, lead: q.lead || "" }));
  });

  const onPrint = guard(async () => {
    const q = await save(true);
    await api.post(`/quotations/${q._id}/sent`, { via: "PDF" }).then((r) => setSaved(r.data.quotation));
    setTimeout(() => window.print(), 100);
  });

  const onWhatsapp = guard(async () => {
    const q = await save(true);
    const digits = (form.customer.phone || "").replace(/\D/g, "");
    const phone = digits.length === 10 ? `91${digits}` : digits; // 10 digits = Indian number
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(summaryText(q))}`;
    window.open(url, "_blank", "noopener");
    const r = await api.post(`/quotations/${q._id}/sent`, { via: "WHATSAPP" });
    setSaved(r.data.quotation);
  });

  const onEmail = guard(async () => {
    const q = await save(true);
    const to = form.customer.email.trim();
    if (!to) throw new Error("Enter the customer's email address first");
    const r = await api.post(`/quotations/${q._id}/email`, { to });
    setSaved(r.data.quotation);
    toast.success(r.data.message);
  });

  const onCopy = guard(async () => {
    const q = await save(true);
    await navigator.clipboard.writeText(summaryText(q));
    toast.success("Quotation text copied");
  });

  const crumbs = [{ label: "Home", to: homePath() }, { label: "Quotations", to: "/quotations" }, { label: saved ? saved.number : "New Quotation" }];

  if (loading) return <Layout><PageHeader title="Quotation" breadcrumbs={crumbs} /><Spinner /></Layout>;

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        <PageHeader
          title={saved ? `Quotation ${saved.number}` : "New Quotation"}
          breadcrumbs={crumbs}
          actions={
            <>
              {form.lead && <GhostButton onClick={() => navigate(`/leads/${form.lead}`)}>Open lead</GhostButton>}
              {saved && <Pill tone={saved.status === "SENT" ? "green" : "slate"}>{saved.status === "SENT" ? "Shared" : "Draft"}</Pill>}
            </>
          }
        />

        <div className="grid gap-6 xl:grid-cols-2 items-start">
          {/* ---- form ---- */}
          <div className="space-y-6">
            <Card title="Customer">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" required><input value={form.customer.name} onChange={setCustomer("name")} className={inputClass} /></Field>
                <Field label="Company"><input value={form.customer.company} onChange={setCustomer("company")} className={inputClass} /></Field>
                <Field label="Email"><input type="email" value={form.customer.email} onChange={setCustomer("email")} className={inputClass} /></Field>
                <Field label="Phone / WhatsApp"><input value={form.customer.phone} onChange={setCustomer("phone")} className={inputClass} placeholder="10 digit number" /></Field>
                <div className="sm:col-span-2">
                  <Field label="Address"><textarea rows={2} value={form.customer.address} onChange={setCustomer("address")} className={inputClass} /></Field>
                </div>
              </div>
            </Card>

            <Card
              title="Items"
              action={
                catalog.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => {
                      const it = catalog[e.target.value];
                      if (it) addItem({ description: it.description, qty: 1, rate: it.rate });
                    }}
                    className={`${inputClass} w-auto`}
                  >
                    <option value="">+ Add plan / service</option>
                    {catalog.map((c, i) => (
                      <option key={c.label} value={i}>{c.label} · {fmtMoney(c.rate)}</option>
                    ))}
                  </select>
                )
              }
            >
              <div className="space-y-3">
                {form.items.map((it, n) => (
                  <div key={n} className="grid grid-cols-[1fr_5rem_8rem_auto] gap-2 items-center">
                    <input placeholder="Item / description" value={it.description} onChange={(e) => setItem(n, "description", e.target.value)} className={inputClass} />
                    <input type="number" min="0" placeholder="Qty" value={it.qty} onChange={(e) => setItem(n, "qty", e.target.value)} className={inputClass} />
                    <input type="number" min="0" placeholder="Rate" value={it.rate} onChange={(e) => setItem(n, "rate", e.target.value)} className={inputClass} />
                    <IconButton tone="danger" aria-label="Remove item" onClick={() => removeItem(n)}><Trash2 size={15} /></IconButton>
                  </div>
                ))}
              </div>
              <GhostButton className="mt-4" onClick={() => addItem()}><Plus size={18} /> Add item</GhostButton>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <Field label="Discount (₹)"><input type="number" min="0" value={form.discount} onChange={setField("discount")} className={inputClass} /></Field>
                <Field label="Tax %"><input type="number" min="0" value={form.taxPercent} onChange={setField("taxPercent")} className={inputClass} /></Field>
                <Field label="Valid until"><input type="date" value={form.validUntil} onChange={setField("validUntil")} className={inputClass} /></Field>
              </div>
            </Card>

            <Card title="Terms and Notes">
              <div className="space-y-4">
                <Field label="Terms"><textarea rows={3} value={form.terms} onChange={setField("terms")} className={inputClass} /></Field>
                <Field label="Notes"><textarea rows={2} value={form.notes} onChange={setField("notes")} className={inputClass} /></Field>
              </div>
            </Card>
          </div>

          {/* ---- preview + actions ---- */}
          <div className="space-y-4 xl:sticky xl:top-4">
            {canManage && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3">
                <PrimaryButton disabled={busy} onClick={onSave}><Save size={18} /> Save</PrimaryButton>
                <GhostButton disabled={busy} onClick={onPrint}><Printer size={18} /> Download PDF</GhostButton>
                <GhostButton disabled={busy} onClick={onWhatsapp}><MessageCircle size={18} /> WhatsApp</GhostButton>
                <GhostButton disabled={busy} onClick={onEmail}><Mail size={18} /> Email</GhostButton>
                <GhostButton disabled={busy} onClick={onCopy}><Copy size={18} /> Copy text</GhostButton>
              </div>
            )}
            {canManage && saved && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-slate-800 mr-auto">
                  {leadInfo?.project
                    ? "Converted to a project"
                    : leadInfo
                      ? "Linked to a lead"
                      : "Not linked to a lead yet"}
                </span>
                {!saved.lead && (
                  <GhostButton disabled={busy} onClick={() => openConvert("LEAD")}>
                    <UserPlus size={18} /> Convert to Lead
                  </GhostButton>
                )}
                {leadInfo?.project ? (
                  <GhostButton onClick={() => navigate(`/projects/${leadInfo.project}`)}>
                    <FolderKanban size={18} /> Open project
                  </GhostButton>
                ) : (
                  leadInfo?.status !== "LOST" && (
                    <PrimaryButton disabled={busy} onClick={() => openConvert("PROJECT")}>
                      <FolderKanban size={18} /> Convert to Project
                    </PrimaryButton>
                  )
                )}
              </div>
            )}
            <Sheet form={form} number={saved?.number} totals={totals} />
            <p className="text-xs text-slate-400">
              Download PDF opens the print window: choose "Save as PDF" as the printer. Sharing marks the quotation as shared.
            </p>
          </div>
        </div>
      </div>

      <Modal
        open={Boolean(convert)}
        title={convert === "PROJECT" ? "Convert to Project" : "Convert to Lead"}
        onClose={() => setConvert(null)}
        footer={
          <>
            <GhostButton onClick={() => setConvert(null)}>Cancel</GhostButton>
            <PrimaryButton disabled={busy} onClick={doConvert}>
              {convert === "PROJECT" ? "Create Project" : "Create Lead"}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {saved?.lead
              ? "This quotation is already linked to a lead."
              : "A lead is created from the customer details (email is needed). If a lead with this email already exists, the quotation is linked to it."}
          </p>
          {!saved?.lead && (
            <Field label="Lead source" hint="Used for source wise revenue on the Target Dashboard">
              <select value={conv.source} onChange={(e) => setConv((c) => ({ ...c, source: e.target.value }))} className={inputClass}>
                {LEAD_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
          )}
          {convert === "PROJECT" && (
            <>
              <Field label="Project name" required>
                <input value={conv.projectName} onChange={(e) => setConv((c) => ({ ...c, projectName: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Project value (₹)" hint="Starts as the quotation total">
                <input type="number" min="0" value={conv.projectValue} onChange={(e) => setConv((c) => ({ ...c, projectValue: e.target.value }))} className={inputClass} />
              </Field>
            </>
          )}
        </div>
      </Modal>
    </Layout>
  );
}
