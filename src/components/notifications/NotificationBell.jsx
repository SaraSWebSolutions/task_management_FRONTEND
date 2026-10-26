import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import api from "../../api/axios";
import { typeMeta } from "../../constants/notifications";
import { timeAgo } from "../../utils/format";

const POLL_MS = 2 * 60 * 1000;

// Bell in the header. Opening the app (and every couple of minutes after) asks the
// server for the latest notifications, which also creates today's reminders.
export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ unread: 0, notifications: [] });
  const box = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.get("/notifications", { params: { limit: 6 } });
      setData(d);
    } catch {
      /* the bell is optional, stay quiet */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  const go = async (n) => {
    setOpen(false);
    if (!n.read) {
      api.patch(`/notifications/${n._id}/read`).catch(() => {});
      setData((d) => ({ ...d, unread: Math.max(0, d.unread - 1), notifications: d.notifications.map((x) => (x._id === n._id ? { ...x, read: true } : x)) }));
    }
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    await api.patch("/notifications/read-all").catch(() => {});
    setData((d) => ({ ...d, unread: 0, notifications: d.notifications.map((x) => ({ ...x, read: true })) }));
  };

  return (
    <div className="relative" ref={box}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open) load(); }}
        aria-label={`Notifications${data.unread ? `, ${data.unread} unread` : ""}`}
        className="relative h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-100 transition"
      >
        <Bell size={19} />
        {data.unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
            {data.unread > 9 ? "9+" : data.unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-88 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-900">Notifications</p>
            {data.unread > 0 && <button onClick={markAll} className="text-sm font-semibold text-brand hover:underline">Mark all read</button>}
          </div>
          <ul className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {data.notifications.length === 0 && <li className="px-4 py-10 text-center text-slate-500 text-sm">You&apos;re all caught up.</li>}
            {data.notifications.map((n) => {
              const m = typeMeta(n.type);
              const Icon = m.icon;
              return (
                <li key={n._id}>
                  <button onClick={() => go(n)} className={`w-full flex gap-3 px-4 py-3 text-left hover:bg-slate-50 ${n.read ? "" : "bg-violet-50/40"}`}>
                    <span className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${m.tint}`}><Icon size={17} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={`text-sm truncate ${n.read ? "text-slate-700" : "font-semibold text-slate-900"}`}>{n.title}</span>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-brand shrink-0" />}
                      </span>
                      {n.message && <span className="block text-sm text-slate-500 truncate">{n.message}</span>}
                      <span className="block text-xs text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button onClick={() => { setOpen(false); navigate("/notifications"); }} className="w-full py-3 text-sm font-semibold text-brand border-t border-slate-100 hover:bg-slate-50">View all notifications</button>
        </div>
      )}
    </div>
  );
}
