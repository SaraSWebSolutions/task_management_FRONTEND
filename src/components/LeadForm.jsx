import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import toast from "react-hot-toast";
import { LEAD_SOURCES } from "../constants/leadSources";

const inputClass =
  "w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2b1247]";

const emptyForm = {
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

function Choice({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition ${
        selected
          ? "border-[#2b1247] bg-[#2b1247] text-white"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

export default function LeadForm({ title, subtitle, initial, onSubmit }) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm, ...initial });

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.email.trim()) return toast.error("Email is required");
    if (!form.source) return toast.error("Select lead source");
    if (!form.requestType)
      return toast.error("Select what the lead is asking for");
    if (form.requestType === "DEMO" && !form.demoType)
      return toast.error("Select demo type (Online / Offline)");

    try {
      setSaving(true);
      await onSubmit({
        ...form,
        demoType: form.requestType === "DEMO" ? form.demoType : undefined,
      });
      navigate("/leads");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="bg-white rounded-3xl border shadow-sm p-6 md:p-10">
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => navigate("/leads")}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
            <p className="text-slate-500 mt-1">{subtitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Name *
              </label>
              <input
                value={form.name}
                onChange={set("name")}
                placeholder="Contact person"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company
              </label>
              <input
                value={form.company}
                onChange={set("company")}
                placeholder="Company name"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="lead@company.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone
              </label>
              <input
                value={form.phone}
                onChange={set("phone")}
                placeholder="Phone number"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Lead source *
              </label>
              <select value={form.source} onChange={set("source")} className={inputClass}>
                <option value="">Select source</option>
                {LEAD_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Value (₹)
              </label>
              <input
                type="number"
                min="0"
                value={form.value}
                onChange={set("value")}
                placeholder="e.g. 150000"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Priority
              </label>
              <select value={form.priority} onChange={set("priority")} className={inputClass}>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Lead is asking for *
            </label>
            <div className="flex gap-3">
              <Choice
                label="Demo"
                selected={form.requestType === "DEMO"}
                onClick={() =>
                  setForm((p) => ({ ...p, requestType: "DEMO" }))
                }
              />
              <Choice
                label="Quotation"
                selected={form.requestType === "QUOTATION"}
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    requestType: "QUOTATION",
                    demoType: "",
                  }))
                }
              />
            </div>
          </div>

          {form.requestType === "DEMO" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Demo type *
              </label>
              <div className="flex gap-3">
                <Choice
                  label="Online"
                  selected={form.demoType === "ONLINE"}
                  onClick={() =>
                    setForm((p) => ({ ...p, demoType: "ONLINE" }))
                  }
                />
                <Choice
                  label="Offline"
                  selected={form.demoType === "OFFLINE"}
                  onClick={() =>
                    setForm((p) => ({ ...p, demoType: "OFFLINE" }))
                  }
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              rows={4}
              value={form.notes}
              onChange={set("notes")}
              placeholder="Anything the lead mentioned..."
              className={inputClass}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2b1247] px-6 py-3 text-white transition hover:bg-[#23163a] disabled:opacity-60"
            >
              <Save size={18} />
              {saving ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
