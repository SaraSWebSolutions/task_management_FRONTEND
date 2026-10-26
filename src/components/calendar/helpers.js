export const CATEGORIES = {
  MEETING: { label: "Meeting", color: "#3b82f6" },
  DEMO: { label: "Demo", color: "#06b6d4" },
  FOLLOW_UP: { label: "Follow-up", color: "#f59e0b" },
  DEADLINE: { label: "Deadline", color: "#ef4444" },
  REMINDER: { label: "Reminder", color: "#8b5cf6" },
  OTHER: { label: "Other", color: "#64748b" },
};
export const categoryLabel = (c) => CATEGORIES[c]?.label || "Event";

export const EVENT_COLORS = ["#3b82f6", "#7c3aed", "#10b981", "#f97316", "#ec4899", "#ef4444", "#06b6d4", "#64748b"];

export const REPEATS = [
  { value: "NONE", label: "Does not repeat" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];
export const repeatLabel = (r) => {
  if (!r || r.freq === "NONE") return "Does not repeat";
  const unit = { DAILY: "day", WEEKLY: "week", MONTHLY: "month", YEARLY: "year" }[r.freq];
  const every = r.interval > 1 ? `Every ${r.interval} ${unit}s` : `Every ${unit}`;
  return r.until ? `${every}, until ${new Date(r.until).toLocaleDateString("en-IN", { dateStyle: "medium" })}` : every;
};

export const REMINDERS = [
  { value: "", label: "No reminder" },
  { value: 0, label: "At start time" },
  { value: 5, label: "5 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 1440, label: "1 day before" },
];
export const reminderLabel = (m) => (m == null ? "No reminder" : REMINDERS.find((r) => r.value === m)?.label || `${m} minutes before`);

export const RESPONSES = {
  ACCEPTED: { label: "Accepted", tone: "text-emerald-600" },
  MAYBE: { label: "Tentative", tone: "text-amber-600" },
  DECLINED: { label: "Declined", tone: "text-red-600" },
  PENDING: { label: "Pending", tone: "text-slate-400" },
};

// ---- dates (all in the browser's local time, which is IST for your team)
export const pad = (n) => String(n).padStart(2, "0");
export const dayKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
export const timeKey = (d) => { const x = new Date(d); return `${pad(x.getHours())}:${pad(x.getMinutes())}`; };
export const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const startOfWeek = (d) => addDays(startOfDay(d), -((new Date(d).getDay() + 6) % 7)); // Monday
export const monthGridStart = (d) => startOfWeek(new Date(d.getFullYear(), d.getMonth(), 1));

export const fmtTime = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
export const fmtLongDate = (d) => new Date(d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export const spanLabel = (e) => {
  const s = new Date(e.start), en = new Date(e.end);
  if (e.allDay) return dayKey(s) === dayKey(en) ? "All day" : `All day, until ${en.toLocaleDateString("en-IN", { dateStyle: "medium" })}`;
  const mins = Math.round((en - s) / 60000);
  const dur = mins >= 60 ? `${Math.round((mins / 60) * 10) / 10} hour${mins === 60 ? "" : "s"}` : `${mins} min`;
  return `${fmtTime(s)} - ${fmtTime(en)} (${dur})`;
};

// events that touch a given day
export const onDay = (events, day) => {
  const a = startOfDay(day).getTime(), b = a + 86400000;
  return events.filter((e) => new Date(e.start).getTime() < b && new Date(e.end).getTime() >= a);
};
