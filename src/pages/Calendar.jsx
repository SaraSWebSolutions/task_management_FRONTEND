import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, MapPin, Repeat } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import EventModal from "../components/calendar/EventModal";
import { PageHeader, Card, Spinner, EmptyState, PrimaryButton, GhostButton } from "../components/ui";
import { Segmented } from "../components/analytics/parts";
import { apiError } from "../components/finance/helpers";
import { CATEGORIES, dayKey, startOfDay, addDays, startOfWeek, monthGridStart, fmtTime, fmtLongDate, onDay } from "../components/calendar/helpers";
import { homePath } from "../utils/permissions";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Calendar() {
  const navigate = useNavigate();
  const today = startOfDay(new Date());
  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState(today); // any date inside the period being shown
  const [selected, setSelected] = useState(dayKey(today));
  const [hidden, setHidden] = useState([]); // categories switched off
  const [events, setEvents] = useState(null);
  const [modal, setModal] = useState({ open: false, day: dayKey(today) });

  // the dates on screen
  const range = useMemo(() => {
    if (view === "month") { const s = monthGridStart(cursor); return { from: s, days: 42 }; }
    if (view === "week") return { from: startOfWeek(cursor), days: 7 };
    return { from: startOfDay(cursor), days: 30 };
  }, [view, cursor]);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/calendar", { params: { from: dayKey(range.from), to: dayKey(addDays(range.from, range.days - 1)) } });
      setEvents(data.events);
    } catch (e) {
      toast.error(apiError(e, "Failed to load calendar"));
      setEvents([]);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const shown = (events || []).filter((e) => !hidden.includes(e.category));
  const move = (dir) => {
    if (view === "month") setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1));
    else setCursor(addDays(cursor, dir * (view === "week" ? 7 : 30)));
  };
  const title = view === "month"
    ? cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : `${range.from.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${addDays(range.from, range.days - 1).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;

  const open = (e) => (e.link ? navigate(e.link) : null);
  const addOn = (day) => setModal({ open: true, day });
  const toggle = (k) => setHidden((h) => (h.includes(k) ? h.filter((x) => x !== k) : [...h, k]));

  const Pill = ({ e }) => (
    <button onClick={(ev) => { ev.stopPropagation(); open(e); }} title={e.title} className="w-full flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left text-xs font-medium text-white truncate hover:opacity-90" style={{ background: e.color }}>
      {!e.allDay && <span className="opacity-80 shrink-0">{fmtTime(e.start).replace(" ", "").toLowerCase()}</span>}
      <span className="truncate">{e.title}</span>
    </button>
  );

  const Row = ({ e }) => (
    <button onClick={() => open(e)} className="w-full flex gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left hover:bg-slate-50" >
      <span className="w-1.5 rounded-full shrink-0" style={{ background: e.color }} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-slate-900 truncate">{e.title}</span>
        <span className="block text-sm text-slate-500">{e.allDay ? "All day" : `${fmtTime(e.start)} - ${fmtTime(e.end)}`}{e.readOnly ? ` · ${CATEGORIES[e.category]?.label || ""}` : ""}</span>
        {(e.location || e.recurring) && (
          <span className="mt-0.5 flex items-center gap-3 text-xs text-slate-400">
            {e.location && <span className="flex items-center gap-1 truncate"><MapPin size={12} /> {e.location}</span>}
            {e.recurring && <span className="flex items-center gap-1"><Repeat size={12} /> Repeats</span>}
          </span>
        )}
      </span>
    </button>
  );

  const selectedEvents = onDay(shown, selected);

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader title="Calendar" breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Calendar" }]} actions={<PrimaryButton onClick={() => addOn(selected)}><Plus size={18} /> Add Event</PrimaryButton>} />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <GhostButton className="!px-3" onClick={() => move(-1)} aria-label="Previous"><ChevronLeft size={18} /></GhostButton>
            <GhostButton className="!px-3" onClick={() => move(1)} aria-label="Next"><ChevronRight size={18} /></GhostButton>
            <GhostButton onClick={() => { setCursor(today); setSelected(dayKey(today)); }}>Today</GhostButton>
          </div>
          <p className="text-xl font-bold text-slate-900 mr-auto">{title}</p>
          <Segmented value={view} onChange={setView} options={[{ value: "month", label: "Month" }, { value: "week", label: "Week" }, { value: "agenda", label: "Agenda" }]} />
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <button key={k} onClick={() => toggle(k)} aria-pressed={!hidden.includes(k)} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-sm font-medium ${hidden.includes(k) ? "border-slate-200 text-slate-400 bg-white" : "border-slate-300 text-slate-700 bg-white"}`}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: hidden.includes(k) ? "#cbd5e1" : v.color }} /> {v.label}
            </button>
          ))}
        </div>

        {events === null ? <Spinner /> : (
          <div className="grid gap-6 xl:grid-cols-3 items-start">
            <div className="xl:col-span-2">
              {view === "month" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    {WEEKDAYS.map((d) => <div key={d} className="p-3 text-center">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7">
                    {Array.from({ length: 42 }, (_, i) => {
                      const d = addDays(range.from, i);
                      const key = dayKey(d);
                      const list = onDay(shown, d);
                      const other = d.getMonth() !== cursor.getMonth();
                      return (
                        <div key={key} role="button" tabIndex={0} onClick={() => setSelected(key)} onDoubleClick={() => addOn(key)} onKeyDown={(e) => e.key === "Enter" && setSelected(key)} className={`min-h-28 border-b border-r border-slate-100 p-1.5 cursor-pointer hover:bg-slate-50 ${key === selected ? "bg-violet-50/60" : other ? "bg-slate-50/60" : ""}`}>
                          <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${key === dayKey(today) ? "bg-brand text-white" : other ? "text-slate-400" : "text-slate-700"}`}>{d.getDate()}</span>
                          <div className="mt-1 space-y-1">
                            {list.slice(0, 3).map((e) => <Pill key={e.id} e={e} />)}
                            {list.length > 3 && <p className="text-xs text-slate-500 px-1">+{list.length - 3} more</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {view === "week" && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = addDays(range.from, i);
                    const key = dayKey(d);
                    const list = onDay(shown, d);
                    return (
                      <div key={key} onClick={() => setSelected(key)} className={`bg-white rounded-2xl border p-4 cursor-pointer ${key === selected ? "border-brand" : "border-slate-200"}`}>
                        <p className={`font-semibold ${key === dayKey(today) ? "text-brand" : "text-slate-900"}`}>{d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</p>
                        <div className="mt-3 space-y-1.5">{list.length ? list.map((e) => <Pill key={e.id} e={e} />) : <p className="text-sm text-slate-400">Nothing planned</p>}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {view === "agenda" && (
                <Card title="Next 30 days">
                  {(() => {
                    const days = Array.from({ length: 30 }, (_, i) => addDays(range.from, i)).map((d) => [d, onDay(shown, d)]).filter(([, l]) => l.length);
                    if (!days.length) return <EmptyState>Nothing scheduled in this period.</EmptyState>;
                    return <div className="space-y-6">{days.map(([d, list]) => (
                      <div key={dayKey(d)}><p className="text-sm font-semibold text-slate-500 mb-2">{fmtLongDate(d)}</p><div className="space-y-2">{list.map((e) => <Row key={e.id} e={e} />)}</div></div>
                    ))}</div>;
                  })()}
                </Card>
              )}
            </div>

            <Card title={fmtLongDate(selected)} action={<GhostButton className="!py-1.5 text-sm" onClick={() => addOn(selected)}><Plus size={15} /> Add</GhostButton>}>
              {selectedEvents.length === 0 ? <EmptyState>Nothing planned for this day.</EmptyState> : <div className="space-y-3">{selectedEvents.map((e) => <Row key={e.id} e={e} />)}</div>}
              <p className="mt-4 text-xs text-slate-400">Tasks, follow-ups, milestones and invoice due dates are added automatically.</p>
            </Card>
          </div>
        )}
      </div>

      <EventModal open={modal.open} day={modal.day} onClose={() => setModal((m) => ({ ...m, open: false }))} onSaved={load} />
    </Layout>
  );
}
