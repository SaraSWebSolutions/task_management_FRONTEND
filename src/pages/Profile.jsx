import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Mail, Phone, Building2, CalendarDays, ListTodo, CircleCheck, Clock, FolderKanban, KeyRound, Bell, CalendarRange, ShieldCheck, Sparkles, Pencil, Users, ExternalLink } from "lucide-react";
import { ComposedChart, Area, Line, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Card, Avatar, Spinner, EmptyState, Field, PrimaryButton, GhostButton, inputClass } from "../components/ui";
import { apiError } from "../components/finance/helpers";
import { fmtDate, timeAgo } from "../utils/format";
import { can, homePath } from "../utils/permissions";

// Shrinks a chosen photo to a small square-ish JPEG so it stays well under the 2 MB limit
const resizeImage = (file, max = 360) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That file isn't an image")); };
    img.src = url;
  });

// Keep the header (which reads the saved login) in step with the profile
const syncLogin = (u) => {
  try {
    const saved = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...saved, name: u.name, profileImage: u.profileImage || undefined }));
  } catch { /* ignore */ }
};

const tenure = (d) => {
  if (!d) return "";
  const months = Math.max(0, Math.floor((Date.now() - new Date(d)) / (30.44 * 86400000)));
  const y = Math.floor(months / 12), m = months % 12;
  return [y && `${y} year${y > 1 ? "s" : ""}`, m && `${m} month${m > 1 ? "s" : ""}`].filter(Boolean).join(", ") || "Just joined";
};

const blankPw = { currentPassword: "", newPassword: "", confirm: "" };

const PROJECT_STATUS = {
  PLANNING: { label: "Planning", cls: "bg-amber-100 text-amber-700" },
  IN_PROGRESS: { label: "In Progress", cls: "bg-indigo-100 text-indigo-700" },
  ON_HOLD: { label: "On Hold", cls: "bg-slate-100 text-slate-600" },
  COMPLETED: { label: "Completed", cls: "bg-emerald-100 text-emerald-700" },
};
const PROJECT_TINTS = [
  { tile: "bg-indigo-50 text-indigo-500", bar: "#6366f1" },
  { tile: "bg-emerald-50 text-emerald-500", bar: "#10b981" },
  { tile: "bg-amber-50 text-amber-500", bar: "#f59e0b" },
  { tile: "bg-pink-50 text-pink-500", bar: "#ec4899" },
  { tile: "bg-cyan-50 text-cyan-500", bar: "#06b6d4" },
];

// Small stat card with a faint trend line along the bottom (flat when there is no series)
function MiniStat({ id, icon, tile, color, label, value, pill, series }) {
  const data = series?.length > 1 ? series.map((v) => ({ v })) : [{ v: 0 }, { v: 0 }];
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 pb-0 text-left shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center ${tile}`}>{icon}</span>
        {pill && <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">{pill}</span>}
      </div>
      <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      <div className="-mx-5 mt-1 h-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#g-${id})`} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [pw, setPw] = useState(blankPw);
  const [saving, setSaving] = useState("");
  const fileRef = useRef(null);
  const detailsRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([api.get("/profile"), api.get("/profile/summary")]);
      setUser(p.data);
      setSummary(s.data);
      setForm({ name: p.data.name || "", phone: p.data.phone || "" });
      syncLogin(p.data);
    } catch (e) {
      toast.error(apiError(e, "Failed to load profile"));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveDetails = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    try {
      setSaving("details");
      const { data } = await api.put("/profile", { name: form.name, phone: form.phone });
      setUser(data);
      syncLogin(data);
      toast.success("Profile updated");
    } catch (e) {
      toast.error(apiError(e, "Failed to update profile"));
    } finally {
      setSaving("");
    }
  };

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setSaving("photo");
      const profileImage = await resizeImage(file);
      const { data } = await api.put("/profile", { profileImage });
      setUser(data);
      syncLogin(data);
      toast.success("Photo updated");
    } catch (err) {
      toast.error(apiError(err, err.message || "Failed to update photo"));
    } finally {
      setSaving("");
    }
  };

  const removePhoto = async () => {
    try {
      setSaving("photo");
      const { data } = await api.put("/profile", { profileImage: "" });
      setUser(data);
      syncLogin(data);
    } catch (err) {
      toast.error(apiError(err, "Failed to remove photo"));
    } finally {
      setSaving("");
    }
  };

  const savePassword = async () => {
    if (!pw.currentPassword || !pw.newPassword) return toast.error("Enter your current and new password");
    if (pw.newPassword.length < 6) return toast.error("New password must be at least 6 characters");
    if (pw.newPassword !== pw.confirm) return toast.error("The two new passwords don't match");
    try {
      setSaving("password");
      await api.put("/profile/change-password", { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success("Password updated");
      setPw(blankPw);
    } catch (e) {
      toast.error(apiError(e, "Failed to change password"));
    } finally {
      setSaving("");
    }
  };

  const crumbs = [{ label: "Home", to: homePath() }, { label: "My Profile" }];
  if (!user) return <Layout><PageHeader title="My Profile" breadcrumbs={crumbs} /><Spinner /></Layout>;

  const s = summary?.stats;
  const week = summary?.week || [];
  const projects = summary?.projects || [];
  const dirty = form.name.trim() !== (user.name || "") || form.phone.trim() !== (user.phone || "");
  const active = user.status !== "INACTIVE";
  const joined = user.joiningDate || user.createdAt;
  const handle = (user.email || "").split("@")[0];
  const cleared = s && s.doneMonth + s.openTasks > 0 ? Math.round((s.doneMonth / (s.doneMonth + s.openTasks)) * 100) : 0;

  const contact = [
    [Mail, "Email", user.email, "bg-indigo-50 text-indigo-500"],
    [Phone, "Phone", user.phone || "Not added", "bg-emerald-50 text-emerald-500"],
    [Building2, "Department", user.department || "Not set", "bg-cyan-50 text-cyan-500"],
    [CalendarDays, "Joined", joined ? fmtDate(joined) : "-", "bg-amber-50 text-amber-500", joined ? tenure(joined) : ""],
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="My Profile"
          breadcrumbs={crumbs}
          actions={<><Link to="/notifications"><GhostButton><Bell size={18} /> Notifications</GhostButton></Link>{can("calendar.view") && <Link to="/calendar"><GhostButton><CalendarRange size={18} /> Calendar</GhostButton></Link>}</>}
        />

        <div className="grid gap-6 xl:grid-cols-3 items-start">
          {/* ---------------- Left: who I am ---------------- */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-center">
              <div className="relative h-40 bg-linear-to-br from-indigo-500 via-violet-500 to-pink-500">
                <button onClick={() => fileRef.current?.click()} disabled={saving === "photo"} aria-label="Change photo" title="Change photo" className="absolute right-4 top-4 h-10 w-10 rounded-full bg-white/25 text-white backdrop-blur flex items-center justify-center hover:bg-white/35 disabled:opacity-60"><Camera size={18} /></button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
              </div>
              <div className="px-6 pb-6 -mt-16">
                <div className="relative inline-block rounded-full ring-4 ring-white">
                  <Avatar name={user.name} src={user.profileImage} size="h-32 w-32" text="text-4xl" />
                  <span className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border-[3px] border-white ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
                </div>
                <h2 className="mt-3 flex items-center justify-center gap-2 text-2xl font-bold text-slate-900">{user.name} <ShieldCheck size={20} className="text-brand" /></h2>
                <p className="text-slate-600">{user.designation || user.role}</p>
                {handle && <p className="text-sm text-slate-400">@{handle}</p>}
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">{user.role}</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-red-500"}`} />{active ? "Available" : "Inactive"}</span>
                </div>

                {s && (
                  <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50/50 p-4 text-left">
                    <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-brand uppercase">
                      <span>Tasks this month</span>
                      <span className="text-slate-500 normal-case">{s.doneMonth} done · {s.openTasks} open</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white overflow-hidden"><div className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500" style={{ width: `${cleared}%` }} /></div>
                  </div>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <PrimaryButton onClick={() => { detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }}><Pencil size={16} /> Edit</PrimaryButton>
                  <GhostButton onClick={() => fileRef.current?.click()} disabled={saving === "photo"}><Camera size={16} /> Photo</GhostButton>
                </div>
                {user.profileImage && <button onClick={removePhoto} className="mt-3 text-sm text-slate-500 hover:text-red-600">Remove photo</button>}
              </div>
            </div>

            <Card title="Contact Information">
              <ul className="-my-1 divide-y divide-slate-100">
                {contact.map(([Icon, label, value, tint, note]) => (
                  <li key={label} className="flex items-center gap-4 py-4">
                    <span className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center ${tint}`}><Icon size={20} /></span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{label}</p>
                      <p className="font-semibold text-slate-900 break-words">{value}</p>
                      {note && <p className="text-sm text-slate-400">{note}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* ---------------- Right: my work + settings ---------------- */}
          <div className="xl:col-span-2 space-y-6">
            <div className="rounded-3xl border border-violet-100 bg-linear-to-r from-violet-50 via-white to-pink-50 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-brand"><Sparkles size={15} /> WELCOME BACK</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">Hi, {user.name?.split(" ")[0]}!</p>
                <p className="mt-1 text-slate-600">
                  {s ? <>You have <strong className="text-brand">{s.openTasks} open task{s.openTasks === 1 ? "" : "s"}</strong>{s.overdue ? <> and <strong className="text-pink-600">{s.overdue} overdue</strong></> : null}.</> : "Loading your work..."}
                </p>
              </div>
              {s && (
                <div className="flex gap-3">
                  {[["Open", s.openTasks, "text-brand"], ["Overdue", s.overdue, s.overdue ? "text-pink-600" : "text-slate-400"], ["Done", s.doneMonth, "text-emerald-600"]].map(([l, v, c]) => (
                    <div key={l} className="min-w-20 rounded-2xl bg-white/80 px-4 py-3 text-center shadow-sm">
                      <p className={`text-2xl font-bold ${c}`}>{v}</p>
                      <p className="text-xs font-medium text-slate-500">{l}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {s && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <MiniStat id="open" icon={<ListTodo size={22} />} tile="bg-indigo-50 text-indigo-500" color="#6366f1" label="Open Tasks" value={s.openTasks} pill={s.overdue ? `${s.overdue} overdue` : "On track"} />
                <MiniStat id="done" icon={<CircleCheck size={22} />} tile="bg-emerald-50 text-emerald-500" color="#10b981" label="Done This Month" value={s.doneMonth} pill="Last 7 days" series={week.map((d) => d.done)} />
                <MiniStat id="hours" icon={<Clock size={22} />} tile="bg-amber-50 text-amber-500" color="#f59e0b" label="Hours This Month" value={`${s.hoursMonth}h`} pill="Last 7 days" series={week.map((d) => d.hours)} />
                <MiniStat id="projects" icon={<FolderKanban size={22} />} tile="bg-pink-50 text-pink-500" color="#ec4899" label="Projects" value={s.projects} />
              </div>
            )}

            <Card
              title="Current Projects"
              subtitle="Active assignments and progress"
              action={can("projects.view") && <Link to="/projects" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">View All <ExternalLink size={14} /></Link>}
            >
              {!projects.length ? <EmptyState>No running projects yet.</EmptyState> : (
                <ul className="-my-2 divide-y divide-slate-100">
                  {projects.map((p, i) => {
                    const tint = PROJECT_TINTS[i % PROJECT_TINTS.length];
                    const st = PROJECT_STATUS[p.status] || PROJECT_STATUS.PLANNING;
                    return (
                      <li key={p._id} className="flex items-center gap-4 py-4">
                        <span className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center ${tint.tile}`}><FolderKanban size={20} /></span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                            <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                          </div>
                          <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: tint.bar }} /></div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xl font-bold" style={{ color: tint.bar }}>{p.progress}%</p>
                          <p className="flex items-center justify-end gap-1 text-xs text-slate-400"><Users size={12} /> {p.members}{p.daysLeft !== null && <> · {p.daysLeft >= 0 ? `${p.daysLeft}d left` : `${Math.abs(p.daysLeft)}d overdue`}</>}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Weekly Productivity" subtitle="Tasks completed and hours logged, last 7 days" action={<span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">{week.reduce((t, d) => t + d.done, 0)} done</span>}>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={week}>
                      <defs>
                        <linearGradient id="g-week" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" />
                      <YAxis yAxisId="a" allowDecimals={false} width={30} />
                      <YAxis yAxisId="h" orientation="right" width={30} />
                      <Tooltip />
                      <Legend />
                      <Area yAxisId="a" type="monotone" dataKey="done" name="Tasks done" stroke="#7c3aed" strokeWidth={2} fill="url(#g-week)" />
                      <Line yAxisId="h" type="monotone" dataKey="hours" name="Hours" stroke="#10b981" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Recent Activity">
                {!summary?.activity?.length ? <EmptyState>No activity yet. Finish a task or log time and it shows here.</EmptyState> : (
                  <ul className="relative space-y-5 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                    {summary.activity.map((a, i) => (
                      <li key={i} className="relative pl-12">
                        <span className={`absolute left-0 top-0 h-8 w-8 rounded-full border bg-white flex items-center justify-center ${a.kind === "task" ? "border-emerald-200 text-emerald-600" : "border-amber-200 text-amber-600"}`}>{a.kind === "task" ? <CircleCheck size={15} /> : <Clock size={15} />}</span>
                        <p className="text-slate-800 break-words">{a.text}</p>
                        <p className="text-xs text-slate-400">{timeAgo(a.at)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <div ref={detailsRef} className="grid gap-6 lg:grid-cols-2 scroll-mt-24">
              <Card title="Personal Details" subtitle="Role, designation and department are managed by your admin">
                <div className="space-y-5">
                  <Field label="Full name" required><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} /></Field>
                  <Field label="Phone"><input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" className={inputClass} /></Field>
                  <Field label="Email" hint="Used to sign in. Ask your admin to change it."><input value={user.email || ""} disabled className={`${inputClass} bg-slate-50 text-slate-500`} /></Field>
                  <PrimaryButton disabled={!dirty || saving === "details"} onClick={saveDetails}>{saving === "details" ? "Saving..." : "Save Changes"}</PrimaryButton>
                </div>
              </Card>

              <Card title="Change Password" action={<KeyRound size={18} className="text-slate-400" />}>
                <div className="space-y-5">
                  <Field label="Current password" required><input type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} className={inputClass} /></Field>
                  <Field label="New password" required hint="At least 6 characters"><input type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} className={inputClass} /></Field>
                  <Field label="Confirm new password" required><input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} className={inputClass} /></Field>
                  <PrimaryButton disabled={saving === "password"} onClick={savePassword}>{saving === "password" ? "Updating..." : "Update Password"}</PrimaryButton>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
