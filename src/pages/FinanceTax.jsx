import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Settings } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Card, Badge, Spinner, EmptyState, Modal, Field, PrimaryButton, GhostButton, DangerButton, IconButton, Toggle, inputClass } from "../components/ui";
import { apiError, THEAD, TROW } from "../components/finance/helpers";
import { TAX_TYPES, taxTypeMeta } from "../constants/finance";
import { fmtMoney } from "../utils/format";
import { can, homePath } from "../utils/permissions";

const blank = { region: "", rate: "", type: "GST", active: true };

function Tile({ label, value, hint }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 text-left">
      <p className="text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-2 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

export default function FinanceTax() {
  const canManage = can("tax.manage");

  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/finance/tax");
      setData(res.data);
      setSettings(res.data.settings);
    } catch {
      toast.error("Failed to load tax settings");
      setData({ rates: [], stats: {}, summary: [], settings: {} });
      setSettings({});
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(blank); setOpen(true); };
  const openEdit = (r) => { setEditing(r); setForm({ region: r.region, rate: r.rate, type: r.type, active: r.active }); setOpen(true); };

  const saveRate = async () => {
    if (!form.region.trim()) return toast.error("Region / tax name is required");
    if (form.rate === "" || !(Number(form.rate) >= 0 && Number(form.rate) <= 100)) return toast.error("Tax rate must be between 0 and 100");
    try {
      setSaving(true);
      const body = { ...form, rate: Number(form.rate) };
      if (editing) await api.put(`/finance/tax/rates/${editing._id}`, body);
      else await api.post("/finance/tax/rates", body);
      toast.success(editing ? "Tax rate updated" : "Tax rate added");
      setOpen(false);
      load();
    } catch (error) {
      toast.error(apiError(error, "Failed to save tax rate"));
    } finally {
      setSaving(false);
    }
  };

  const toggleRate = async (r) => {
    try {
      await api.put(`/finance/tax/rates/${r._id}`, { active: !r.active });
      load();
    } catch (error) {
      toast.error(apiError(error, "Failed to update"));
    }
  };

  const removeRate = async () => {
    try {
      await api.delete(`/finance/tax/rates/${toDelete._id}`);
      toast.success("Tax rate removed");
      setToDelete(null);
      load();
    } catch (error) {
      toast.error(apiError(error, "Failed to remove"));
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await api.put("/finance/tax/settings", { ...settings, defaultTaxRate: settings.defaultTaxRate });
      toast.success("Settings saved");
      load();
    } catch (error) {
      toast.error(apiError(error, "Failed to save settings"));
    } finally {
      setSaving(false);
    }
  };

  const s = data?.stats || {};

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Tax Settings"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Finance" }, { label: "Tax Settings" }]}
          actions={canManage && <PrimaryButton onClick={openAdd}><Plus size={18} /> Add Tax Rate</PrimaryButton>}
        />

        {!data ? <Spinner /> : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <Tile label="Total Tax Collected" value={fmtMoney(s.collected)} hint={`${fmtMoney(s.billed)} billed on invoices`} />
              <Tile label="Tax Payable" value={fmtMoney(s.payable)} hint="Collected minus tax credits" />
              <Tile label="Tax Credits" value={fmtMoney(s.credits)} hint="GST on expenses" />
              <Tile label="Effective Rate" value={`${s.effectiveRate || 0}%`} hint="Tax collected / taxable value received" />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Tax Rates</div>
                {data.rates.length === 0 ? <EmptyState>No tax rates yet. Add the GST slabs you use, e.g. 18%.</EmptyState> : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-150 text-left">
                      <thead><tr className={THEAD}><th className="p-4">Name</th><th className="p-4">Rate</th><th className="p-4">Type</th><th className="p-4">Active</th>{canManage && <th className="p-4">Actions</th>}</tr></thead>
                      <tbody>
                        {data.rates.map((r) => (
                          <tr key={r._id} className={TROW}>
                            <td className="p-4 font-semibold text-slate-900">{r.region}</td>
                            <td className="p-4 font-semibold text-brand">{Number(r.rate).toFixed(2)}%</td>
                            <td className="p-4"><Badge className={taxTypeMeta(r.type).badge}>{taxTypeMeta(r.type).label}</Badge></td>
                            <td className="p-4"><Toggle checked={r.active} onChange={() => toggleRate(r)} disabled={!canManage} color="#10b981" label={`Toggle ${r.region}`} /></td>
                            {canManage && (
                              <td className="p-4"><div className="flex gap-2">
                                <IconButton onClick={() => openEdit(r)} aria-label="Edit"><Pencil size={15} /></IconButton>
                                <IconButton tone="danger" onClick={() => setToDelete(r)} aria-label="Remove"><Trash2 size={15} /></IconButton>
                              </div></td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <Card title="Calculation Settings" action={<Settings size={18} className="text-slate-400" />}>
                {settings && (
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div><p className="font-semibold text-slate-900">Auto-Calculate Tax</p><p className="text-sm text-slate-500">New invoices start with the default rate</p></div>
                      <Toggle checked={!!settings.autoCalculateTax} onChange={(v) => setSettings((x) => ({ ...x, autoCalculateTax: v }))} disabled={!canManage} label="Auto-calculate tax" />
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div><p className="font-semibold text-slate-900">Tax Inclusive Pricing</p><p className="text-sm text-slate-500">Item prices already include tax</p></div>
                      <Toggle checked={!!settings.taxInclusive} onChange={(v) => setSettings((x) => ({ ...x, taxInclusive: v }))} disabled={!canManage} label="Tax inclusive pricing" />
                    </div>
                    <Field label="Default Tax Rate (%)"><input type="number" min="0" max="100" value={settings.defaultTaxRate ?? ""} onChange={(e) => setSettings((x) => ({ ...x, defaultTaxRate: e.target.value }))} disabled={!canManage} className={inputClass} /></Field>
                    <Field label="Company name"><input value={settings.companyName || ""} onChange={(e) => setSettings((x) => ({ ...x, companyName: e.target.value }))} disabled={!canManage} className={inputClass} /></Field>
                    <Field label="Company GSTIN" hint="15 characters"><input value={settings.gstin || ""} maxLength={15} onChange={(e) => setSettings((x) => ({ ...x, gstin: e.target.value.toUpperCase() }))} disabled={!canManage} className={inputClass} /></Field>
                    {canManage && <PrimaryButton className="w-full" disabled={saving} onClick={saveSettings}><Settings size={16} /> Save Settings</PrimaryButton>}
                  </div>
                )}
              </Card>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Tax Summary by Rate</div>
              {data.summary.length === 0 ? <EmptyState>No invoices yet.</EmptyState> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-175 text-left">
                    <thead><tr className={THEAD}><th className="p-4">Tax</th><th className="p-4">Invoices</th><th className="p-4">Taxable value</th><th className="p-4">Tax billed</th><th className="p-4">Tax collected</th></tr></thead>
                    <tbody>
                      {data.summary.map((g) => (
                        <tr key={`${g.label}-${g.rate}`} className={TROW}>
                          <td className="p-4 font-semibold text-slate-900">{g.label} <span className="text-slate-400 font-normal">({g.rate}%)</span></td>
                          <td className="p-4">{g.invoices}</td>
                          <td className="p-4">{fmtMoney(g.taxable)}</td>
                          <td className="p-4">{fmtMoney(g.billed)}</td>
                          <td className="p-4 font-semibold">{fmtMoney(g.collected)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Modal
        open={open}
        title={editing ? "Edit Tax Rate" : "Add Tax Rate"}
        onClose={() => setOpen(false)}
        footer={<><GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton><PrimaryButton disabled={saving} onClick={saveRate}>{editing ? "Save Changes" : "Add Tax Rate"}</PrimaryButton></>}
      >
        <div className="space-y-5">
          <Field label="Name / Region" required><input value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} placeholder="e.g., GST 18%" className={inputClass} /></Field>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Tax Rate (%)" required><input type="number" min="0" max="100" step="0.01" value={form.rate} onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} placeholder="0.00" className={inputClass} /></Field>
            <Field label="Tax Type">
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className={inputClass}>
                {TAX_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!toDelete}
        title="Remove tax rate"
        onClose={() => setToDelete(null)}
        footer={<><GhostButton onClick={() => setToDelete(null)}>Cancel</GhostButton><DangerButton onClick={removeRate}>Remove</DangerButton></>}
      >
        <p className="text-slate-600">Remove <strong>{toDelete?.region}</strong>? Existing invoices keep the rate they were created with.</p>
      </Modal>
    </Layout>
  );
}
