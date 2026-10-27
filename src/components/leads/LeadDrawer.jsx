// Add / Edit lead form shown in a right-side drawer.
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Drawer from "../Drawer";
import { Field, GhostButton, PrimaryButton, Spinner, inputClass } from "../ui";
import { LEAD_SOURCES } from "../../constants/leadSources";

const ic = `${inputClass} !py-2.5`;

const EMPTY = {
  name: "",
  company: "",
  email: "",
  phone: "",
  source: "",
  value: "",
  priority: "MEDIUM",
  requestType: "",
  demoType: "",
  notes: "",
};

function Select({ value, onChange, children }) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange} className={`${ic} appearance-none pr-10`}>
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}

function Choice({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
        selected
          ? "border-brand bg-brand text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

export default function LeadDrawer({ leadId, onClose, onSaved }) {
  const editing = Boolean(leadId);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;

    api
      .get(`/leads/${leadId}`)
      .then((res) => {
        if (cancelled) return;
        const l = res.data.lead;
        setForm({
          name: l.name || "",
          company: l.company || "",
          email: l.email || "",
          phone: l.phone || "",
          source: l.source || "OTHER",
          value: l.value || "",
          priority: l.priority || "MEDIUM",
          requestType: l.requestType || "",
          demoType: l.demoType || "",
          notes: l.notes || "",
        });
      })
      .catch(() => {
        if (cancelled) return;
        toast.error("Failed to load lead");
        onClose();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.email.trim()) return toast.error("Email is required");
    if (!form.source) return toast.error("Select lead source");
    if (!form.requestType) return toast.error("Select what the lead is asking for");
    if (form.requestType === "DEMO" && !form.demoType) {
      return toast.error("Select demo type (Online / Offline)");
    }

    const payload = {
      ...form,
      demoType: form.requestType === "DEMO" ? form.demoType : undefined,
    };

    try {
      setSaving(true);
      if (editing) {
        await api.put(`/leads/${leadId}`, payload);
        toast.success("Lead updated successfully");
      } else {
        await api.post("/leads", payload);
        toast.success("Lead created successfully");
      }
      onSaved();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={editing ? "Edit Lead" : "Add Lead"}
      subtitle={editing ? "Update the lead details" : "Someone replied or contacted the team? Add them here"}
      onClose={onClose}
      footer={
        <>
          <GhostButton type="button" onClick={onClose} disabled={saving} className="!py-2.5">
            Cancel
          </GhostButton>
          <PrimaryButton type="button" onClick={save} disabled={saving || loading} className="!py-2.5">
            {saving ? "Saving..." : editing ? "Save Changes" : "Save Lead"}
          </PrimaryButton>
        </>
      }
    >
      {loading ? (
        <Spinner label="Loading..." />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4"
        >
          <Field label="Name" required>
            <input value={form.name} onChange={set("name")} placeholder="Contact person" className={ic} />
          </Field>
          <Field label="Company">
            <input value={form.company} onChange={set("company")} placeholder="Company name" className={ic} />
          </Field>
          <Field label="Email" required>
            <input type="email" value={form.email} onChange={set("email")} placeholder="lead@company.com" className={ic} />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={set("phone")} placeholder="Phone number" className={ic} />
          </Field>

          <Field label="Lead Source" required>
            <Select value={form.source} onChange={set("source")}>
              <option value="">Select source</option>
              {LEAD_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Value (₹)">
            <input type="number" min="0" value={form.value} onChange={set("value")} placeholder="e.g. 150000" className={ic} />
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={set("priority")}>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </Select>
          </Field>
          <span className="hidden sm:block" />

          <div className="sm:col-span-2">
            <span className="block text-sm font-semibold text-slate-800 mb-2">Lead is asking for *</span>
            <div className="flex gap-3">
              <Choice
                label="Demo"
                selected={form.requestType === "DEMO"}
                onClick={() => setForm((p) => ({ ...p, requestType: "DEMO" }))}
              />
              <Choice
                label="Quotation"
                selected={form.requestType === "QUOTATION"}
                onClick={() => setForm((p) => ({ ...p, requestType: "QUOTATION", demoType: "" }))}
              />
            </div>
          </div>

          {form.requestType === "DEMO" && (
            <div className="sm:col-span-2">
              <span className="block text-sm font-semibold text-slate-800 mb-2">Demo type *</span>
              <div className="flex gap-3">
                <Choice
                  label="Online"
                  selected={form.demoType === "ONLINE"}
                  onClick={() => setForm((p) => ({ ...p, demoType: "ONLINE" }))}
                />
                <Choice
                  label="Offline"
                  selected={form.demoType === "OFFLINE"}
                  onClick={() => setForm((p) => ({ ...p, demoType: "OFFLINE" }))}
                />
              </div>
            </div>
          )}

          <div className="sm:col-span-2">
            <Field label="Notes">
              <textarea
                rows={4}
                value={form.notes}
                onChange={set("notes")}
                placeholder="Anything the lead mentioned..."
                className={ic}
              />
            </Field>
          </div>

          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
        </form>
      )}
    </Drawer>
  );
}
