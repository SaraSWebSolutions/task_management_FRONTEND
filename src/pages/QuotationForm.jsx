import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Save, Printer, Mail, MessageCircle, Copy, UserPlus, FolderKanban } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Field, Spinner, PrimaryButton, GhostButton, Modal, inputClass } from "../components/ui";
import { docInput, MiniField, PartyBox, LineItems, TotalsBox, AddBlock, CustomFields, LogoBox, Section } from "../components/billing/DocParts";
import { printDocument, amountInWords, pickLogo, withCustomMeta } from "../utils/billingDoc";
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

const blankItem = () => ({ type: "SERVICE", product: "", hsn: "", uom: "", description: "", qty: 1, rate: "" });

const emptyForm = () => ({
  customer: { name: "", company: "", email: "", phone: "", address: "" },
  lead: "",
  date: ymd(new Date()),
  items: [blankItem()],
  customFields: [],
  logo: "",
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

const logoUrl = () => new URL(logo, window.location.origin).href;

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
            items: q.items.map((i) => ({ type: i.type || "SERVICE", product: i.product || "", hsn: i.hsn || "", uom: i.uom || "", description: i.description, qty: i.qty, rate: i.rate })),
            customFields: q.customFields || [],
            logo: q.logo || "",
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
            f.items = real.map((i) => ({ ...blankItem(), description: i.description, qty: i.qty, rate: i.rate }));
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
      const next = item || blankItem();
      return { ...f, items: blank ? [next] : [...f.items, next] };
    });
  // Products dropdown: our products + plans / services from the catalog
  const products = useMemo(
    () => catalog.map((c) => ({ _id: c.product || c.label, product: c.product, name: c.label, price: c.rate, type: c.product ? c.type : "SERVICE", hsn: c.hsn, uom: c.uom, taxPercent: c.taxPercent })),
    [catalog],
  );
  const pickProduct = (n, p) => {
    setForm((f) => ({
      ...f,
      // products carry their own tax %; the quotation has one tax % for the whole sheet
      taxPercent: p.taxPercent > 0 ? p.taxPercent : f.taxPercent,
      items: f.items.map((it, i) => (i === n ? { ...it, description: p.name, product: p.product || "", type: p.type || "SERVICE", hsn: p.hsn || "", uom: p.uom || "", rate: p.price } : it)),
    }));
  };
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
    if (convert === "PROJECT") return navigate(`/projects?edit=${res.data.project._id}`);
    const q = (await api.get(`/quotations/${saved._id}`)).data.quotation;
    setSaved(q);
    setForm((f) => ({ ...f, lead: q.lead || "" }));
  });

  const onPrint = guard(async () => {
    const q = await save(true);
    await api.post(`/quotations/${q._id}/sent`, { via: "PDF" }).then((r) => setSaved(r.data.quotation));
    const c = form.customer;
    const ok = printDocument({
      title: "Quotation",
      number: q.number,
      meta: withCustomMeta([["Quotation No", q.number], ["Quotation Date", fmtDate(form.date)], ["Valid Until", form.validUntil ? fmtDate(form.validUntil) : ""]], form.customFields),
      fromTitle: "Quotation By",
      from: { name: "SaraS Web Solutions", lines: [] },
      toTitle: "Quotation For",
      to: { name: c.name, lines: [c.company, c.address, [c.email, c.phone].filter(Boolean).join(" · ")] },
      items: totals.items,
      totals: [
        ["Subtotal", fmtMoney(totals.subtotal)],
        ...(totals.discount > 0 ? [["Discount", `-${fmtMoney(totals.discount)}`]] : []),
        ...(Number(form.taxPercent) > 0 ? [[`Tax (${form.taxPercent}%)`, fmtMoney(totals.tax)]] : []),
        ["Total", fmtMoney(totals.total), true],
      ],
      words: amountInWords(totals.total),
      terms: form.terms,
      notes: form.notes,
      logo: pickLogo(form.logo, logoUrl()),
    });
    if (!ok) throw new Error("Allow pop-ups to download the PDF");
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

  const c = form.customer;

  const actions = (
    <>
      {form.lead && <GhostButton className="!py-2" onClick={() => navigate(`/leads/${form.lead}`)}>Open lead</GhostButton>}
      {saved && <Pill tone={saved.status === "SENT" ? "green" : "slate"}>{saved.status === "SENT" ? "Shared" : "Draft"}</Pill>}
    </>
  );

  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-4 pb-12">
        <PageHeader title={saved ? `Quotation ${saved.number}` : "New Quotation"} breadcrumbs={crumbs} actions={actions} />

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* title, dates, logo */}
          <Section className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0 flex-1 text-left">
              <p className="text-2xl font-bold text-brand">Quotation</p>
              <div className="mt-3 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                <MiniField label="Quotation No"><input readOnly value={saved?.number || "On save"} className={`${docInput} !bg-slate-50`} /></MiniField>
                <MiniField label="Date"><input type="date" value={form.date} onChange={setField("date")} className={docInput} /></MiniField>
                <MiniField label="Valid Until"><input type="date" value={form.validUntil} onChange={setField("validUntil")} className={docInput} /></MiniField>
              </div>
              <div className="mt-3"><CustomFields fields={form.customFields} onChange={(v) => setForm((f) => ({ ...f, customFields: v }))} /></div>
            </div>
            <LogoBox value={form.logo} defaultLogo={logo} onChange={(v) => setForm((f) => ({ ...f, logo: v }))} />
          </Section>

          {/* from / for */}
          <Section className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-2">
              <PartyBox title="Quotation By">
                <p className="font-bold text-slate-900">SaraS Web Solutions</p>
                <p className="mt-1 text-sm text-slate-500">Your company details shown on the quotation.</p>
              </PartyBox>
            </div>
            <div className="md:col-span-3">
              <PartyBox title="Quotation For (Customer)">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <MiniField label="Name" required><input value={c.name} onChange={setCustomer("name")} className={docInput} /></MiniField>
                  <MiniField label="Company"><input value={c.company} onChange={setCustomer("company")} className={docInput} /></MiniField>
                  <MiniField label="Email"><input type="email" value={c.email} onChange={setCustomer("email")} className={docInput} /></MiniField>
                  <MiniField label="Phone / WhatsApp"><input value={c.phone} onChange={setCustomer("phone")} className={docInput} placeholder="10 digit number" /></MiniField>
                  <MiniField label="Address" className="sm:col-span-2"><input value={c.address} onChange={setCustomer("address")} className={docInput} /></MiniField>
                </div>
              </PartyBox>
            </div>
          </Section>

          {/* items */}
          <Section>
            <LineItems items={form.items} qtyKey="qty" onChange={setItem} onAdd={() => addItem()} onRemove={removeItem} products={products} onPickProduct={pickProduct} />
          </Section>

          {/* notes + totals */}
          <Section className="grid items-start gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <AddBlock label="Add Terms and Conditions" value={form.terms} onChange={(v) => setForm((f) => ({ ...f, terms: v }))} rows={3} />
              <AddBlock label="Add Notes" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} rows={2} />
            </div>
            <TotalsBox
              total={totals.total}
              rows={[
                ["Amount", fmtMoney(totals.subtotal)],
                ["Discount (₹)", <input key="d" type="number" min="0" value={form.discount} onChange={setField("discount")} placeholder="0" className={`${docInput} !w-28 text-right`} />],
                ["Tax (%)", <input key="t" type="number" min="0" max="100" value={form.taxPercent} onChange={setField("taxPercent")} className={`${docInput} !w-28 text-right`} />],
                ...(totals.tax > 0 ? [["Tax amount", fmtMoney(totals.tax)]] : []),
              ]}
            />
          </Section>

          {/* actions */}
          {canManage && (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 sm:px-6">
              <PrimaryButton disabled={busy} onClick={onSave} className="!py-2"><Save size={16} /> Save</PrimaryButton>
              <GhostButton disabled={busy} onClick={onPrint} className="!py-2"><Printer size={16} /> Download PDF</GhostButton>
              <GhostButton disabled={busy} onClick={onWhatsapp} className="!px-3 !py-2" title="Share on WhatsApp"><MessageCircle size={16} /></GhostButton>
              <GhostButton disabled={busy} onClick={onEmail} className="!px-3 !py-2" title="Send by email"><Mail size={16} /></GhostButton>
              <GhostButton disabled={busy} onClick={onCopy} className="!px-3 !py-2" title="Copy text"><Copy size={16} /></GhostButton>

              {saved && (
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {leadInfo?.project ? "Converted to a project" : leadInfo ? "Linked to a lead" : "Not linked to a lead"}
                  </span>
                  {!saved.lead && (
                    <GhostButton disabled={busy} onClick={() => openConvert("LEAD")} className="!py-2"><UserPlus size={16} /> Convert to Lead</GhostButton>
                  )}
                  {leadInfo?.project ? (
                    <GhostButton onClick={() => navigate(`/projects?edit=${leadInfo.project}`)} className="!py-2"><FolderKanban size={16} /> Open project</GhostButton>
                  ) : (
                    leadInfo?.status !== "LOST" && (
                      <PrimaryButton disabled={busy} onClick={() => openConvert("PROJECT")} className="!py-2"><FolderKanban size={16} /> Convert to Project</PrimaryButton>
                    )
                  )}
                </div>
              )}
            </div>
          )}
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
