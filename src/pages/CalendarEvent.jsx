import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Pencil, Trash2, CalendarDays, Clock, MapPin, CircleCheck, CircleX, CircleHelp, Repeat, Bell, Tag, Hourglass, Mail } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import EventModal from "../components/calendar/EventModal";
import { PageHeader, Card, Avatar, Spinner, Modal, GhostButton, DangerButton, PrimaryButton } from "../components/ui";
import { apiError } from "../components/finance/helpers";
import { CATEGORIES, RESPONSES, fmtLongDate, spanLabel, repeatLabel, reminderLabel, dayKey } from "../components/calendar/helpers";
import { homePath } from "../utils/permissions";

const RESPONSE_ICON = { ACCEPTED: CircleCheck, DECLINED: CircleX, MAYBE: CircleHelp, PENDING: Hourglass };

export default function CalendarEvent() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const at = params.get("at");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.get(`/calendar/events/${id}`, { params: at ? { at } : {} });
      setData(d);
    } catch (e) {
      setError(apiError(e, "Event not found"));
    }
  }, [id, at]);

  useEffect(() => { load(); }, [load]);

  const respond = async (response) => {
    try {
      await api.patch(`/calendar/events/${id}/response`, { response });
      toast.success("Response saved");
      load();
    } catch (e) {
      toast.error(apiError(e, "Failed to save response"));
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/calendar/events/${id}`);
      toast.success("Event deleted");
      navigate("/calendar");
    } catch (e) {
      toast.error(apiError(e, "Failed to delete"));
      setConfirm(false);
    }
  };

  const crumbs = [{ label: "Home", to: homePath() }, { label: "Calendar", to: "/calendar" }, { label: "Event Details" }];
  if (!data) {
    return (
      <Layout>
        <PageHeader title="Event Details" breadcrumbs={crumbs} />
        {error ? <Card><p className="py-8 text-center text-slate-600">{error}</p></Card> : <Spinner />}
      </Layout>
    );
  }

  const { event: e, occurrence, canEdit, myResponse, counts } = data;
  const shown = { ...e, start: occurrence.start, end: occurrence.end };
  const meta = CATEGORIES[e.category];
  const recurring = e.recurrence?.freq && e.recurrence.freq !== "NONE";

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Event Details"
          breadcrumbs={crumbs}
          actions={canEdit && <><GhostButton onClick={() => setEdit(true)}><Pencil size={18} /> Edit</GhostButton><DangerButton onClick={() => setConfirm(true)}><Trash2 size={18} /> Delete</DangerButton></>}
        />

        <div className="grid gap-6 xl:grid-cols-3 items-start">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-start gap-5">
                <span className="h-20 w-20 shrink-0 rounded-2xl flex items-center justify-center text-white" style={{ background: e.color }}><CalendarDays size={34} /></span>
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md px-2.5 py-1 text-xs font-semibold" style={{ background: `${e.color}22`, color: e.color }}>{meta?.label}</span>
                    {recurring && <span className="rounded-md bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">Recurring</span>}
                  </div>
                  <h2 className="mt-2 text-3xl font-bold text-slate-900 break-words">{e.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-slate-500">
                    <span className="flex items-center gap-2"><CalendarDays size={16} /> {fmtLongDate(shown.start)}</span>
                    <span className="flex items-center gap-2"><Clock size={16} /> {spanLabel(shown)}</span>
                  </div>
                  {e.location && <p className="mt-2 flex items-center gap-2 text-slate-500 break-all"><MapPin size={16} className="shrink-0" /> {e.location}</p>}
                </div>
              </div>

              {myResponse && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="font-semibold text-slate-800 mb-3">Your response: <span className={RESPONSES[myResponse].tone}>{RESPONSES[myResponse].label}</span></p>
                  <div className="flex flex-wrap gap-3">
                    {[["ACCEPTED", "Accept", CircleCheck], ["DECLINED", "Decline", CircleX], ["MAYBE", "Maybe", CircleHelp]].map(([v, label, Icon]) => (
                      myResponse === v ? <PrimaryButton key={v} onClick={() => respond(v)}><Icon size={17} /> {label}</PrimaryButton> : <GhostButton key={v} onClick={() => respond(v)}><Icon size={17} /> {label}</GhostButton>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Card title="Description">
              {e.description ? <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{e.description}</p> : <p className="text-slate-400">No description added.</p>}
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Organizer">
              <div className="flex items-center gap-4">
                <Avatar name={e.createdBy?.name} size="h-14 w-14" text="text-lg" />
                <div className="min-w-0"><p className="font-bold text-slate-900">{e.createdBy?.name}</p>{e.createdBy?.designation && <p className="text-slate-500">{e.createdBy.designation}</p>}</div>
              </div>
            </Card>

            <Card title="Event Info">
              <ul className="space-y-5">
                {[[Repeat, "Recurring", repeatLabel(e.recurrence), "bg-indigo-50 text-indigo-500"], [Bell, "Reminder", reminderLabel(e.reminderMinutes), "bg-emerald-50 text-emerald-500"], [Tag, "Category", meta?.label, "bg-amber-50 text-amber-500"]].map(([Icon, label, value, tint]) => (
                  <li key={label} className="flex items-center gap-4">
                    <span className={`h-11 w-11 rounded-xl flex items-center justify-center ${tint}`}><Icon size={19} /></span>
                    <div><p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{label}</p><p className="font-semibold text-slate-900">{value}</p></div>
                  </li>
                ))}
                {e.lead && <li className="flex items-center gap-4"><span className="h-11 w-11 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center"><Mail size={19} /></span><div><p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Lead</p><p className="font-semibold text-slate-900">{e.lead.name}</p></div></li>}
              </ul>
            </Card>

            <Card title="Attendees" action={<span className="text-sm text-slate-500">{e.attendees.length}</span>}>
              {e.attendees.length === 0 ? <p className="text-slate-400">No one else is invited.</p> : (
                <>
                  <ul className="space-y-4">
                    {e.attendees.map((a) => {
                      const Icon = RESPONSE_ICON[a.response];
                      return (
                        <li key={a.user?._id} className="flex items-center gap-3">
                          <Avatar name={a.user?.name} size="h-10 w-10" text="text-sm" />
                          <div className="min-w-0 flex-1"><p className="font-semibold text-slate-900 truncate">{a.user?.name}</p>{a.user?.designation && <p className="text-sm text-slate-500 truncate">{a.user.designation}</p>}</div>
                          <Icon size={19} className={RESPONSES[a.response].tone} aria-label={RESPONSES[a.response].label} />
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-5 pt-4 border-t border-slate-100 text-sm text-slate-500">{counts.ACCEPTED} accepted · {counts.MAYBE} tentative · {counts.DECLINED} declined · {counts.PENDING} pending</p>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>

      <EventModal open={edit} event={e} day={dayKey(e.start)} onClose={() => setEdit(false)} onSaved={load} />
      <Modal center open={confirm} title="Delete event" onClose={() => setConfirm(false)} footer={<><GhostButton onClick={() => setConfirm(false)}>Cancel</GhostButton><DangerButton onClick={remove}>Delete</DangerButton></>}>
        <p className="text-slate-600">Delete <strong>{e.title}</strong>?{recurring ? " This removes every repeat of it." : ""}{e.attendees.length ? " Invited people are told it was cancelled." : ""}</p>
      </Modal>
    </Layout>
  );
}
