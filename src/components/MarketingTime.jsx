import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { Card, Field, Modal, PrimaryButton, GhostButton, EmptyState, inputClass } from "./ui";
import { fmtDate } from "../utils/format";
import { can } from "../utils/permissions";

const today = () => new Date().toISOString().slice(0, 10);
const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const blank = () => ({ user: "", hours: "", date: today(), note: "" });

// Marketing time spent to win a lead / project. Entries are listed here;
// adding or editing one opens a drawer (same style as Add Project).
export default function MarketingTime({ lead, users, onSaved }) {
  const canManage = can("leads.manage");
  const rows = lead.marketing || [];

  const [editing, setEditing] = useState(null); // null | "new" | index
  const [form, setForm] = useState(blank());
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const totalHours = rows.reduce((s, r) => s + Number(r.hours || 0), 0);
  const totalCost = rows.reduce(
    (s, r) => s + Number(r.hours || 0) * (r.hourlyRate || 0),
    0,
  );

  const payload = (list) =>
    list.map((r) => ({
      _id: r._id,
      user: r.user?._id || r.user,
      hours: r.hours,
      note: r.note,
      date: r.date,
    }));

  const persist = async (list, success) => {
    try {
      setSaving(true);
      await api.put(`/leads/${lead._id}/marketing`, { marketing: payload(list) });
      toast.success(success);
      setEditing(null);
      onSaved?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const openNew = () => {
    setForm(blank());
    setEditing("new");
  };

  const openEdit = (i) => {
    const r = rows[i];
    setForm({
      user: r.user?._id || r.user || "",
      hours: r.hours,
      date: r.date ? String(r.date).slice(0, 10) : today(),
      note: r.note || "",
    });
    setEditing(i);
  };

  const submit = () => {
    if (!form.user) return toast.error("Select a person");
    if (form.hours === "" || Number(form.hours) < 0) return toast.error("Enter the hours");
    const entry = { ...(editing === "new" ? {} : rows[editing]), ...form, hours: Number(form.hours) };
    const list = editing === "new" ? [...rows, entry] : rows.map((r, i) => (i === editing ? entry : r));
    persist(list, editing === "new" ? "Marketing time added" : "Marketing time updated");
  };

  const remove = (i) => persist(rows.filter((_, idx) => idx !== i), "Entry removed");

  return (
    <>
      <Card
        title="Marketing time"
        subtitle={`Time spent to win this project · ${totalHours} hrs${totalCost > 0 ? ` · ${money(totalCost)}` : ""}`}
        action={
          canManage && (
            <PrimaryButton className="!py-2" onClick={openNew}>
              <Plus size={16} /> Add time
            </PrimaryButton>
          )
        }
      >
        {rows.length === 0 ? (
          <EmptyState>No marketing time recorded yet.</EmptyState>
        ) : (
          <ul className="divide-y divide-slate-100 -my-2">
            {rows.map((r, i) => (
              <li key={r._id || i} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {r.user?.name || users.find((u) => u._id === r.user)?.name || "-"}
                    <span className="ml-2 font-normal text-slate-500">{r.hours} hrs</span>
                  </p>
                  <p className="text-sm text-slate-500">
                    {fmtDate(r.date)}
                    {r.note ? ` · ${r.note}` : ""}
                  </p>
                </div>
                {canManage && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => openEdit(i)}
                      aria-label="Edit entry"
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      disabled={saving}
                      onClick={() => remove(i)}
                      aria-label="Remove entry"
                      className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={editing !== null}
        title={editing === "new" ? "Add Marketing Time" : "Edit Marketing Time"}
        onClose={() => setEditing(null)}
        footer={
          <>
            <GhostButton onClick={() => setEditing(null)}>Cancel</GhostButton>
            <PrimaryButton disabled={saving} onClick={submit}>
              {editing === "new" ? "Add Time" : "Save Changes"}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Person" required>
            <select value={form.user} onChange={set("user")} className={inputClass}>
              <option value="">Select person</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Date">
              <input type="date" value={form.date} onChange={set("date")} className={inputClass} />
            </Field>
            <Field label="Hours" required>
              <input
                type="number"
                min="0"
                step="0.25"
                value={form.hours}
                onChange={set("hours")}
                placeholder="0"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="What was done">
            <textarea
              rows={3}
              value={form.note}
              onChange={set("note")}
              placeholder="Calls, emails, meetings, proposal work..."
              className={inputClass}
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}
