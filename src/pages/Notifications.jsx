import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCheck, Trash2, Filter, Clock } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Card, Spinner, EmptyState, PrimaryButton, GhostButton, IconButton, Toggle } from "../components/ui";
import { apiError } from "../components/finance/helpers";
import { NOTIFICATION_TYPES, typeMeta } from "../constants/notifications";
import { timeAgo } from "../utils/format";
import { homePath } from "../utils/permissions";

const dayKey = (d) => new Date(d).toDateString();

export default function Notifications() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [type, setType] = useState("");
  const [prefs, setPrefs] = useState(null);

  const load = useCallback(async () => {
    try {
      const [n, p] = await Promise.all([
        api.get("/notifications", { params: { limit: 200, ...(type ? { type } : {}) } }),
        api.get("/notifications/preferences"),
      ]);
      setData(n.data);
      setPrefs(p.data.notify);
    } catch (e) {
      toast.error(apiError(e, "Failed to load notifications"));
      setData({ notifications: [], unread: 0, total: 0 });
    }
  }, [type]);

  useEffect(() => { load(); }, [load]);

  const open = async (n) => {
    if (!n.read) {
      await api.patch(`/notifications/${n._id}/read`).catch(() => {});
      setData((d) => ({ ...d, unread: Math.max(0, d.unread - 1), notifications: d.notifications.map((x) => (x._id === n._id ? { ...x, read: true } : x)) }));
    }
    if (n.link) navigate(n.link);
  };

  const remove = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setData((d) => ({ ...d, notifications: d.notifications.filter((x) => x._id !== id), unread: d.notifications.find((x) => x._id === id && !x.read) ? d.unread - 1 : d.unread, total: d.total - 1 }));
    } catch (e) {
      toast.error(apiError(e, "Failed to delete"));
    }
  };

  const markAll = async () => {
    try {
      await api.patch("/notifications/read-all");
      load();
    } catch (e) {
      toast.error(apiError(e, "Failed to update"));
    }
  };

  const clearRead = async () => {
    try {
      const { data: r } = await api.delete("/notifications/read");
      toast.success(r.deleted ? `${r.deleted} cleared` : "Nothing to clear");
      load();
    } catch (e) {
      toast.error(apiError(e, "Failed to clear"));
    }
  };

  const toggle = async (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try {
      await api.put("/notifications/preferences", { notify: next });
    } catch (e) {
      setPrefs(prefs);
      toast.error(apiError(e, "Failed to save"));
    }
  };

  const crumbs = [{ label: "Home", to: homePath() }, { label: "Notifications" }];
  if (!data) return <Layout><PageHeader title="Notifications" breadcrumbs={crumbs} /><Spinner /></Layout>;

  const today = dayKey(new Date());
  const groups = [
    ["Today", data.notifications.filter((n) => dayKey(n.createdAt) === today)],
    ["Earlier", data.notifications.filter((n) => dayKey(n.createdAt) !== today)],
  ].filter(([, list]) => list.length);

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Notifications"
          breadcrumbs={crumbs}
          actions={
            <>
              <GhostButton onClick={clearRead}><Trash2 size={18} /> Clear read</GhostButton>
              <PrimaryButton onClick={markAll} disabled={!data.unread}><CheckCheck size={18} /> Mark All Read ({data.unread})</PrimaryButton>
            </>
          }
        />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 font-semibold text-slate-700"><Filter size={17} /> Filter by Type:</span>
          {[["", "All"], ...Object.entries(NOTIFICATION_TYPES).map(([k, v]) => [k, v.label])].map(([k, label]) => (
            <button key={k || "all"} onClick={() => setType(k)} className={`px-4 py-2 rounded-xl text-sm font-semibold border ${type === k ? "bg-brand text-white border-brand" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>{label}</button>
          ))}
          <span className="ml-auto text-slate-500">{data.total} notifications</span>
        </div>

        <div className="grid gap-6 xl:grid-cols-3 items-start">
          <div className="xl:col-span-2 space-y-6">
            {groups.length === 0 ? <Card><EmptyState>No notifications{type ? " of this type" : ""}. Task, lead, calendar and finance alerts will show up here.</EmptyState></Card> : groups.map(([label, list]) => (
              <div key={label}>
                <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase mb-3">{label}</p>
                <ul className="space-y-3">
                  {list.map((n) => {
                    const m = typeMeta(n.type);
                    const Icon = m.icon;
                    return (
                      <li key={n._id} className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${n.read ? "border-l-slate-200" : "border-l-brand"} shadow-sm`}>
                        <div className="flex items-start gap-4 p-5">
                          <button onClick={() => open(n)} className="flex items-start gap-4 flex-1 min-w-0 text-left">
                            <span className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center ${m.tint}`}><Icon size={21} /></span>
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className={`text-lg ${n.read ? "text-slate-700" : "font-bold text-slate-900"}`}>{n.title}</span>
                                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${m.chip}`}>{m.label}</span>
                              </span>
                              {n.message && <span className="block mt-1 text-slate-500">{n.message}</span>}
                              {!n.read && <span className="mt-2 inline-block h-2.5 w-2.5 rounded-full bg-brand" />}
                            </span>
                          </button>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="hidden sm:flex items-center gap-1.5 text-sm text-slate-400"><Clock size={14} /> {timeAgo(n.createdAt)}</span>
                            <IconButton tone="danger" onClick={() => remove(n._id)} aria-label="Delete notification"><Trash2 size={15} /></IconButton>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <Card title="Notification Preferences" subtitle="Choose what shows up in your bell">
            <ul className="divide-y divide-slate-100">
              {prefs && Object.entries(NOTIFICATION_TYPES).map(([k, v]) => (
                <li key={k} className="flex items-center justify-between gap-4 py-4">
                  <div><p className="font-semibold text-slate-900">{v.label}</p><p className="text-sm text-slate-500">{v.hint}</p></div>
                  <Toggle checked={prefs[k] !== false} onChange={(val) => toggle(k, val)} label={`${v.label} notifications`} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
