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
  whatsapp: "",
  source: "",
  value: "",
  priority: "MEDIUM",
  requestType: "",
  demoType: "",
  assignedTo: "",
  location: "",
  demoNotes: "",
  notes: "",
};

const hasDemo = (type) => type === "DEMO" || type === "BOTH";

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

export default function LeadDrawer({ leadId, onClose, onSaved }) {
  const editing = Boolean(leadId);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [sameWhatsapp, setSameWhatsapp] = useState(false);

  // People who can be given the demo
  useEffect(() => {
    api
      .get("/leads/assignees")
      .then((res) => setUsers(res.data.users || []))
      .catch(() => {});
  }, []);

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
          whatsapp: l.whatsapp || "",
          source: l.source || "OTHER",
          value: l.value || "",
          priority: l.priority || "MEDIUM",
          requestType: l.requestType || "",
          demoType: l.demoType || "",
          assignedTo: l.assignedTo?._id || l.assignedTo || "",
          location: l.location || "",
          demoNotes: l.demoNotes || "",
          notes: l.notes || "",
        });
        setSameWhatsapp(Boolean(l.phone) && l.phone === l.whatsapp);
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

  const setPhone = (e) => {
    const phone = e.target.value;
    setForm((p) => ({ ...p, phone, ...(sameWhatsapp && { whatsapp: phone }) }));
  };

  const toggleSame = (e) => {
    const on = e.target.checked;
    setSameWhatsapp(on);
    if (on) setForm((p) => ({ ...p, whatsapp: p.phone }));
  };

  const pickRequest = (e) => {
    const requestType = e.target.value;
    setForm((p) =>
      hasDemo(requestType)
        ? { ...p, requestType }
        : { ...p, requestType, demoType: "", assignedTo: "", location: "", demoNotes: "" },
    );
  };

  const pickDemoType = (e) => {
    const demoType = e.target.value;
    setForm((p) => ({ ...p, demoType, ...(demoType !== "OFFLINE" && { location: "" }) }));
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.email.trim()) return toast.error("Email is required");
    if (!form.phone.trim()) return toast.error("Phone number is required");
    if (!form.whatsapp.trim()) return toast.error("WhatsApp number is required");
    if (!form.source) return toast.error("Select lead source");
    if (!form.requestType) return toast.error("Select what the lead is asking for");

    if (hasDemo(form.requestType)) {
      if (!form.demoType) return toast.error("Select demo type (Online / Offline)");
      if (!form.assignedTo) return toast.error("Select who will give the demo");
      if (form.demoType === "OFFLINE" && !form.location.trim()) {
        return toast.error("Location is required for an offline demo");
      }
    }

    const demo = hasDemo(form.requestType);
    const payload = {
      ...form,
      demoType: demo ? form.demoType : undefined,
      assignedTo: demo ? form.assignedTo : undefined,
      location: demo && form.demoType === "OFFLINE" ? form.location.trim() : undefined,
      demoNotes: demo ? form.demoNotes : undefined,
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
          <Field label="Phone Number" required>
            <input value={form.phone} onChange={setPhone} placeholder="Phone number" className={ic} />
          </Field>
          <div>
            <Field label="WhatsApp Number" required>
              <input
                value={form.whatsapp}
                onChange={set("whatsapp")}
                disabled={sameWhatsapp}
                placeholder="WhatsApp number"
                className={ic}
              />
            </Field>
            <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={sameWhatsapp} onChange={toggleSame} />
              Same as phone number
            </label>
          </div>

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
            <Field label="Lead is asking for" required>
              <Select value={form.requestType} onChange={pickRequest}>
                <option value="">Select</option>
                <option value="DEMO">Demo</option>
                <option value="QUOTATION">Quotation</option>
                <option value="BOTH">Both (Demo + Quotation)</option>
              </Select>
            </Field>
          </div>

          {hasDemo(form.requestType) && (
            <>
              <Field label="Demo Type" required>
                <Select value={form.demoType} onChange={pickDemoType}>
                  <option value="">Select demo type</option>
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline</option>
                </Select>
              </Field>

              {form.demoType && (
                <Field label="Assign Demo To" required>
                  <Select value={form.assignedTo} onChange={set("assignedTo")}>
                    <option value="">Select person</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} {u.designation ? `(${u.designation})` : ""}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}

              {form.demoType === "OFFLINE" && (
                <div className="sm:col-span-2">
                  <Field label="Demo Location" required>
                    <input
                      value={form.location}
                      onChange={set("location")}
                      placeholder="Where is the demo?"
                      className={ic}
                    />
                  </Field>
                </div>
              )}

              {form.demoType && (
                <div className="sm:col-span-2">
                  <Field label="Demo Notes">
                    <textarea
                      rows={3}
                      value={form.demoNotes}
                      onChange={set("demoNotes")}
                      placeholder="Anything the person giving the demo should know..."
                      className={ic}
                    />
                  </Field>
                </div>
              )}
            </>
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
