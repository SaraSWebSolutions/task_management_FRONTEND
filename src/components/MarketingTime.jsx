import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const input =
  "w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand";
const today = () => new Date().toISOString().slice(0, 10);
const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const toRows = (list = []) =>
  list.map((e) => ({
    _id: e._id,
    user: e.user?._id || "",
    name: e.user?.name || "",
    hours: e.hours,
    rate: e.hourlyRate,
    note: e.note || "",
    date: e.date ? e.date.slice(0, 10) : today(),
  }));

// Marketing time spent to win a lead / project: person + hours + date + note
export default function MarketingTime({ lead, users, onSaved }) {
  const [rows, setRows] = useState(toRows(lead.marketing));
  const [pick, setPick] = useState("");
  const [hours, setHours] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRows(toRows(lead.marketing));
  }, [lead]);

  const add = () => {
    if (!pick) return toast.error("Select a person");
    if (hours === "" || Number(hours) < 0) return toast.error("Enter hours");
    const user = users.find((u) => u._id === pick);
    setRows((r) => [
      ...r,
      { user: pick, name: user?.name || "", hours: Number(hours), rate: null, note, date },
    ]);
    setPick("");
    setHours("");
    setNote("");
  };

  const totalHours = rows.reduce((s, r) => s + Number(r.hours || 0), 0);
  const totalCost = rows.reduce((s, r) => s + Number(r.hours || 0) * (r.rate || 0), 0);

  const save = async () => {
    try {
      setSaving(true);
      await api.put(`/leads/${lead._id}/marketing`, {
        marketing: rows.map((r) => ({
          _id: r._id,
          user: r.user,
          hours: r.hours,
          note: r.note,
          date: r.date,
        })),
      });
      toast.success("Marketing time saved");
      onSaved?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Marketing time</h2>
        <p className="text-sm text-slate-500 mt-1">
          Time spent on marketing to win this project. Total: {totalHours} hrs
          {totalCost > 0 && ` · ${money(totalCost)}`}
        </p>
      </div>

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-3 text-left">Person</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-center w-28">Hours</th>
                <th className="p-3 text-left">Note</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r._id || i} className="border-t">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.date}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="0"
                      value={r.hours}
                      onChange={(e) =>
                        setRows((all) =>
                          all.map((x, idx) => (idx === i ? { ...x, hours: e.target.value } : x)),
                        )
                      }
                      className={input}
                    />
                  </td>
                  <td className="p-3 text-slate-600">{r.note || "-"}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setRows((all) => all.filter((_, idx) => idx !== i))}
                      className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid sm:grid-cols-[1fr_9rem_6rem_1fr_auto] gap-3">
        <select value={pick} onChange={(e) => setPick(e.target.value)} className={input}>
          <option value="">Select person</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name}
            </option>
          ))}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
        <input
          type="number"
          min="0"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="Hours"
          className={input}
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What was done"
          className={input}
        />
        <button
          onClick={add}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-100"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      <button
        disabled={saving}
        onClick={save}
        className="rounded-xl bg-brand px-5 py-2.5 text-white transition hover:bg-brand-hover disabled:opacity-60"
      >
        Save
      </button>
    </div>
  );
}
