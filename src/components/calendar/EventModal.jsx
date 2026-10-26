import { useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { Modal, Field, PrimaryButton, GhostButton, Avatar, inputClass } from "../ui";
import { apiError } from "../finance/helpers";
import { CATEGORIES, EVENT_COLORS, REPEATS, REMINDERS, dayKey, timeKey } from "./helpers";

const blank = (day) => ({
  title: "", category: "MEETING", allDay: false,
  startDate: day, startTime: "10:00", endDate: day, endTime: "11:00",
  location: "", description: "", color: CATEGORIES.MEETING.color,
  freq: "NONE", interval: 1, until: "", reminder: 30, attendees: [],
});

const fromEvent = (e) => ({
  title: e.title, category: e.category, allDay: e.allDay,
  startDate: dayKey(e.start), startTime: timeKey(e.start), endDate: dayKey(e.end), endTime: timeKey(e.end),
  location: e.location || "", description: e.description || "", color: e.color || CATEGORIES[e.category].color,
  freq: e.recurrence?.freq || "NONE", interval: e.recurrence?.interval || 1, until: e.recurrence?.until ? dayKey(e.recurrence.until) : "",
  reminder: e.reminderMinutes ?? "", attendees: e.attendees.map((a) => a.user?._id || a.user),
});

// Add or edit a calendar event. `event` = existing event (edit), `day` = YYYY-MM-DD for a new one.
export default function EventModal({ open, onClose, onSaved, event, day = dayKey(new Date()) }) {
  const [form, setForm] = useState(blank(day));
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(event ? fromEvent(event) : blank(day));
    setSearch("");
    api.get("/calendar/options").then((r) => setUsers(r.data.users)).catch(() => {});
  }, [open, event, day]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const me = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}")?._id || JSON.parse(localStorage.getItem("user") || "{}")?.id, []);
  const q = search.trim().toLowerCase();
  const people = users.filter((u) => String(u._id) !== String(me) && (!q || u.name.toLowerCase().includes(q)));

  const pickCategory = (e) => {
    const category = e.target.value;
    setForm((f) => ({ ...f, category, color: EVENT_COLORS.includes(f.color) && f.color !== CATEGORIES[f.category].color ? f.color : CATEGORIES[category].color }));
  };

  const toggleAttendee = (id) =>
    setForm((f) => ({ ...f, attendees: f.attendees.includes(id) ? f.attendees.filter((x) => x !== id) : [...f.attendees, id] }));

  const save = async () => {
    if (!form.title.trim()) return toast.error("Enter the event title");
    if (!form.startDate || !form.endDate) return toast.error("Select the dates");
    const start = new Date(`${form.startDate}T${form.allDay ? "00:00" : form.startTime || "00:00"}`);
    const end = new Date(`${form.endDate}T${form.allDay ? "23:59" : form.endTime || "00:00"}`);
    if (end < start) return toast.error("End can't be before the start");
    if (form.freq !== "NONE" && form.until && form.until < form.startDate) return toast.error("Repeat end date can't be before the event");

    const body = {
      title: form.title, category: form.category, allDay: form.allDay,
      start: start.toISOString(), end: end.toISOString(),
      location: form.location, description: form.description, color: form.color,
      recurrence: { freq: form.freq, interval: Number(form.interval) || 1, until: form.freq !== "NONE" && form.until ? form.until : undefined },
      reminderMinutes: form.reminder === "" ? "" : Number(form.reminder),
      attendees: form.attendees,
    };
    try {
      setSaving(true);
      if (event) await api.put(`/calendar/events/${event._id}`, body);
      else await api.post("/calendar/events", body);
      toast.success(event ? "Event updated" : "Event added");
      onClose();
      onSaved?.();
    } catch (e) {
      toast.error(apiError(e, "Failed to save event"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      wide
      title={event ? "Edit Event" : "Add Event"}
      onClose={onClose}
      footer={<><GhostButton onClick={onClose}>Cancel</GhostButton><PrimaryButton disabled={saving} onClick={save}>{event ? "Save Changes" : "Save Event"}</PrimaryButton></>}
    >
      <div className="space-y-5">
        <Field label="Event title" required><input value={form.title} onChange={set("title")} placeholder="Enter event title" className={inputClass} /></Field>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Type">
            <select value={form.category} onChange={pickCategory} className={inputClass}>
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Colour">
            <div className="flex flex-wrap gap-2.5 pt-1.5">
              {EVENT_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))} aria-label={`Colour ${c}`} className="h-8 w-8 rounded-full flex items-center justify-center ring-offset-2" style={{ background: c, boxShadow: form.color === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : "none" }}>
                  {form.color === c && <Check size={15} className="text-white" />}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <label className="flex items-center gap-3 text-slate-700 font-medium"><input type="checkbox" checked={form.allDay} onChange={(e) => setForm((f) => ({ ...f, allDay: e.target.checked }))} /> All day event</label>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Start date" required><input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value, endDate: f.endDate < e.target.value ? e.target.value : f.endDate }))} className={inputClass} /></Field>
          {!form.allDay && <Field label="Start time"><input type="time" value={form.startTime} onChange={set("startTime")} className={inputClass} /></Field>}
          <Field label="End date" required><input type="date" min={form.startDate} value={form.endDate} onChange={set("endDate")} className={inputClass} /></Field>
          {!form.allDay && <Field label="End time"><input type="time" value={form.endTime} onChange={set("endTime")} className={inputClass} /></Field>}
        </div>

        <Field label="Location"><input value={form.location} onChange={set("location")} placeholder="Enter location or meeting link" className={inputClass} /></Field>
        <Field label="Description"><textarea rows={3} value={form.description} onChange={set("description")} className={inputClass} /></Field>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Repeat">
            <select value={form.freq} onChange={set("freq")} className={inputClass}>{REPEATS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select>
          </Field>
          <Field label="Reminder">
            <select value={form.reminder} onChange={set("reminder")} className={inputClass}>{REMINDERS.map((r) => <option key={String(r.value)} value={r.value}>{r.label}</option>)}</select>
          </Field>
          {form.freq !== "NONE" && (
            <>
              <Field label="Repeat every"><input type="number" min="1" max="52" value={form.interval} onChange={set("interval")} className={inputClass} /></Field>
              <Field label="Repeat until" hint="Leave empty to repeat forever"><input type="date" min={form.startDate} value={form.until} onChange={set("until")} className={inputClass} /></Field>
            </>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2"><p className="text-sm font-semibold text-slate-800">Attendees</p><span className="text-sm text-slate-500">{form.attendees.length} selected</span></div>
          <div className="relative mb-2"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people to add..." className={`${inputClass} pl-10`} /></div>
          <ul className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
            {people.length === 0 && <li className="px-4 py-5 text-center text-sm text-slate-500">No one found.</li>}
            {people.map((u) => {
              const on = form.attendees.includes(String(u._id));
              return (
                <li key={u._id}>
                  <button type="button" onClick={() => toggleAttendee(String(u._id))} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 ${on ? "bg-violet-50/60" : ""}`}>
                    <Avatar name={u.name} size="h-8 w-8" text="text-xs" />
                    <span className="flex-1 min-w-0"><span className="block text-sm font-medium text-slate-900 truncate">{u.name}</span>{u.designation && <span className="block text-xs text-slate-500 truncate">{u.designation}</span>}</span>
                    {on && <Check size={17} className="text-brand" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
