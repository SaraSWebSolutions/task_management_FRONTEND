import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Check, X, Pencil, Trash2, Star, Sparkles, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Card, Spinner, EmptyState, Modal, Field, PrimaryButton, GhostButton, DangerButton, IconButton, Toggle, inputClass } from "../components/ui";
import { apiError, THEAD, TROW } from "../components/finance/helpers";
import { fmtMoney } from "../utils/format";
import { can, homePath } from "../utils/permissions";

const NEGATIVE = ["no", "-", "none", "n/a", "false", "0"];
const isNo = (v) => NEGATIVE.includes(String(v ?? "").trim().toLowerCase());
const isYes = (v) => String(v ?? "").trim().toLowerCase() === "yes";
const blank = () => ({ name: "", description: "", monthlyPrice: "", yearlyPrice: "", features: [{ name: "", value: "" }], popular: false, active: true, order: 0 });

export default function FinancePlans() {
  const canManage = can("plans.manage");

  const [data, setData] = useState(null);
  const [yearly, setYearly] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank());
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [discount, setDiscount] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/finance/plans");
      setData(res.data);
      setDiscount(res.data.yearlyDiscount);
    } catch {
      toast.error("Failed to load plans");
      setData({ plans: [], yearlyDiscount: 20 });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setFeature = (i, k, v) => setForm((f) => ({ ...f, features: f.features.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)) }));

  const openAdd = () => { setEditing(null); setForm({ ...blank(), order: (data?.plans.length || 0) + 1 }); setOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description || "", monthlyPrice: p.monthlyPrice,
      yearlyPrice: p.customYearlyPrice ? p.yearlyPrice : "",
      features: p.features.length ? p.features.map((f) => ({ ...f })) : [{ name: "", value: "" }],
      popular: p.popular, active: p.active, order: p.order,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Plan name is required");
    if (form.monthlyPrice === "" || !(Number(form.monthlyPrice) >= 0)) return toast.error("Enter the monthly price");
    try {
      setSaving(true);
      const body = { ...form, monthlyPrice: Number(form.monthlyPrice), yearlyPrice: form.yearlyPrice === "" ? "" : Number(form.yearlyPrice), order: Number(form.order) || 0 };
      if (editing) await api.put(`/finance/plans/${editing._id}`, body);
      else await api.post("/finance/plans", body);
      toast.success(editing ? "Plan updated" : "Plan added");
      setOpen(false);
      load();
    } catch (error) {
      toast.error(apiError(error, "Failed to save plan"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/finance/plans/${toDelete._id}`);
      toast.success("Plan deleted");
      setToDelete(null);
      load();
    } catch (error) {
      toast.error(apiError(error, "Failed to delete"));
    }
  };

  const saveDiscount = async () => {
    try {
      await api.put("/finance/plans/yearly-discount", { yearlyDiscount: Number(discount) });
      toast.success("Yearly discount saved");
      load();
    } catch (error) {
      toast.error(apiError(error, "Failed to save"));
    }
  };

  const plans = data?.plans || [];
  const visible = canManage ? plans : plans.filter((p) => p.active);
  const featureNames = useMemo(() => [...new Set(visible.flatMap((p) => p.features.map((f) => f.name)))], [visible]);
  const valueOf = (p, name) => p.features.find((f) => f.name === name)?.value;
  const price = (p) => (yearly ? p.yearlyPrice : p.monthlyPrice);

  const cell = (v) => {
    if (v == null || isNo(v)) return <X size={16} className="mx-auto text-slate-300" />;
    if (isYes(v)) return <Check size={18} className="mx-auto text-emerald-500" />;
    return <span className="font-medium text-slate-800">{v}</span>;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Pricing Plans"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Finance" }, { label: "Plans" }]}
          actions={canManage && <PrimaryButton onClick={openAdd}><Plus size={18} /> Add Plan</PrimaryButton>}
        />

        {!data ? <Spinner /> : visible.length === 0 ? (
          <Card><EmptyState>No plans yet.{canManage ? " Click Add Plan to create your first pricing plan." : ""}</EmptyState></Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="inline-flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-3">
                <span className={`font-semibold ${!yearly ? "text-slate-900" : "text-slate-400"}`}>Monthly</span>
                <Toggle checked={yearly} onChange={setYearly} label="Yearly billing" />
                <span className={`font-semibold ${yearly ? "text-slate-900" : "text-slate-400"}`}>Yearly</span>
                {data.yearlyDiscount > 0 && <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-600">Save {data.yearlyDiscount}%</span>}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 items-stretch">
              {visible.map((p) => (
                <div key={p._id} className={`relative flex flex-col bg-white rounded-2xl border text-left overflow-hidden ${p.popular ? "border-brand border-2 shadow-lg" : "border-slate-200"} ${p.active ? "" : "opacity-60"}`}>
                  {p.popular && <div className="bg-brand text-white text-center text-sm font-bold tracking-wider py-2 flex items-center justify-center gap-2"><Star size={14} /> MOST POPULAR</div>}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 text-xl font-bold text-slate-900"><Sparkles size={18} className="text-brand" /> {p.name}</div>
                      {!p.active && <span className="flex items-center gap-1 text-xs text-slate-500"><EyeOff size={14} /> Hidden</span>}
                    </div>
                    <p className="mt-1 text-slate-500 min-h-6">{p.description}</p>
                    <p className="mt-6"><span className={`text-5xl font-bold ${p.popular ? "text-brand" : "text-slate-900"}`}>{fmtMoney(price(p))}</span><span className="text-slate-500">/{yearly ? "year" : "month"}</span></p>
                    <ul className="mt-6 space-y-3 flex-1">
                      {p.features.map((f) => {
                        const no = isNo(f.value);
                        const label = isYes(f.value) || no ? f.name : `${f.value} ${f.name}`;
                        return (
                          <li key={f.name} className={`flex items-center gap-3 ${no ? "text-slate-400" : "text-slate-700"}`}>
                            {no ? <X size={16} /> : <Check size={16} className="text-emerald-500" />}{label}
                          </li>
                        );
                      })}
                    </ul>
                    {canManage && (
                      <div className="mt-6 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                        <span className="text-sm text-slate-500">{p.subscribers} subscriber{p.subscribers === 1 ? "" : "s"}</span>
                        <div className="flex gap-2">
                          <IconButton onClick={() => openEdit(p)} aria-label="Edit"><Pencil size={15} /></IconButton>
                          <IconButton tone="danger" onClick={() => setToDelete(p)} aria-label="Delete"><Trash2 size={15} /></IconButton>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {featureNames.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Plan Comparison</div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-175 text-left">
                    <thead><tr className={THEAD}>
                      <th className="p-4">Feature</th>
                      {visible.map((p) => <th key={p._id} className="p-4 text-center">{p.name}</th>)}
                    </tr></thead>
                    <tbody>
                      {featureNames.map((n) => (
                        <tr key={n} className={TROW}>
                          <td className="p-4 font-semibold text-slate-900">{n}</td>
                          {visible.map((p) => <td key={p._id} className="p-4 text-center">{cell(valueOf(p, n))}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {canManage && (
              <Card title="Yearly discount" subtitle="Applied to every plan that has no yearly price of its own (monthly x 12, less this %).">
                <div className="flex items-end gap-3 max-w-sm">
                  <Field label="Discount (%)"><input type="number" min="0" max="100" value={discount} onChange={(e) => setDiscount(e.target.value)} className={inputClass} /></Field>
                  <PrimaryButton onClick={saveDiscount}>Save</PrimaryButton>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      <Modal
        open={open}
        wide
        title={editing ? "Edit Plan" : "Add Plan"}
        onClose={() => setOpen(false)}
        footer={<><GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton><PrimaryButton disabled={saving} onClick={save}>{editing ? "Save Changes" : "Add Plan"}</PrimaryButton></>}
      >
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Plan name" required><input value={form.name} onChange={set("name")} placeholder="e.g. Pro" className={inputClass} /></Field>
            <Field label="Tagline"><input value={form.description} onChange={set("description")} placeholder="Best for growing businesses" className={inputClass} /></Field>
            <Field label="Monthly price (₹)" required><input type="number" min="0" value={form.monthlyPrice} onChange={set("monthlyPrice")} className={inputClass} /></Field>
            <Field label="Yearly price (₹)" hint="Leave empty to use the yearly discount"><input type="number" min="0" value={form.yearlyPrice} onChange={set("yearlyPrice")} className={inputClass} /></Field>
            <Field label="Display order"><input type="number" value={form.order} onChange={set("order")} className={inputClass} /></Field>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3 text-slate-700 font-medium"><input type="checkbox" checked={form.popular} onChange={(e) => setForm((f) => ({ ...f, popular: e.target.checked }))} /> Mark as most popular</label>
            <label className="flex items-center gap-3 text-slate-700 font-medium"><input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} /> Visible to customers</label>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Features</p>
            <p className="text-xs text-slate-400 mb-2">Value can be a number or text ("25", "Unlimited"), "Yes" for included or "No" for not included.</p>
            <div className="space-y-3">
              {form.features.map((f, i) => (
                <div key={i} className="grid grid-cols-12 gap-3 items-center">
                  <input value={f.name} onChange={(e) => setFeature(i, "name", e.target.value)} placeholder="Feature (e.g. Users)" className={`${inputClass} col-span-6`} />
                  <input value={f.value} onChange={(e) => setFeature(i, "value", e.target.value)} placeholder="Value (e.g. 25)" className={`${inputClass} col-span-5`} />
                  <IconButton tone="danger" className="col-span-1" onClick={() => setForm((x) => ({ ...x, features: x.features.filter((_, idx) => idx !== i) }))} aria-label="Remove feature"><Trash2 size={15} /></IconButton>
                </div>
              ))}
            </div>
            <GhostButton className="mt-3 !py-2" onClick={() => setForm((x) => ({ ...x, features: [...x.features, { name: "", value: "" }] }))}><Plus size={16} /> Add feature</GhostButton>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!toDelete}
        title="Delete plan"
        onClose={() => setToDelete(null)}
        footer={<><GhostButton onClick={() => setToDelete(null)}>Cancel</GhostButton><DangerButton onClick={remove}>Delete</DangerButton></>}
      >
        <p className="text-slate-600">Delete the <strong>{toDelete?.name}</strong> plan? Existing subscriptions keep their own plan name and price.</p>
      </Modal>
    </Layout>
  );
}
