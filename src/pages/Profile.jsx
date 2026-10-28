import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Mail, Phone, Building2, CalendarDays, ListTodo, CircleCheck, Clock, FolderKanban, KeyRound, Bell, CalendarRange } from "lucide-react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Card, Avatar, Spinner, EmptyState, Field, PrimaryButton, GhostButton, inputClass } from "../components/ui";
import { KpiCard } from "../components/finance/bits";
import { apiError } from "../components/finance/helpers";
import { fmtDate, timeAgo } from "../utils/format";
import { can } from "../utils/permissions";

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

export default function Profile() {
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [pw, setPw] = useState(blankPw);
  const [saving, setSaving] = useState("");
  const fileRef = useRef(null);

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

  const crumbs = [{ label: "Home" }, { label: "My Profile" }];
  if (!user) return <Layout><PageHeader title="My Profile" breadcrumbs={crumbs} /><Spinner /></Layout>;

  const s = summary?.stats;
  const dirty = form.name.trim() !== (user.name || "") || form.phone.trim() !== (user.phone || "");

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader title="My Profile" breadcrumbs={crumbs} actions={<><Link to="/notifications"><GhostButton><Bell size={18} /> Notifications</GhostButton></Link>{can("calendar.view") && <Link to="/calendar"><GhostButton><CalendarRange size={18} /> Calendar</GhostButton></Link>}</>} />

        <div className="grid gap-6 xl:grid-cols-3 items-start">
          {/* Left: who I am */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-center">
              <div className="h-28 bg-linear-to-r from-indigo-500 via-violet-500 to-pink-500" />
              <div className="px-6 pb-6 -mt-14">
                <div className="relative inline-block">
                  <Avatar name={user.name} src={user.profileImage} size="h-28 w-28" text="text-3xl" />
                  <button onClick={() => fileRef.current?.click()} disabled={saving === "photo"} aria-label="Change photo" className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-brand text-white flex items-center justify-center border-2 border-white shadow hover:opacity-90 disabled:opacity-60"><Camera size={16} /></button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
                </div>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">{user.name}</h2>
                <p className="text-slate-500">{user.designation || user.role}</p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">{user.role}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.status === "INACTIVE" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{user.status === "INACTIVE" ? "Inactive" : "Active"}</span>
                </div>
                {user.profileImage && <button onClick={removePhoto} className="mt-3 text-sm text-slate-500 hover:text-red-600">Remove photo</button>}
              </div>
            </div>

            <Card title="Contact Information">
              <ul className="space-y-5">
                {[
                  [Mail, "Email", user.email, "bg-indigo-50 text-indigo-500"],
                  [Phone, "Phone", user.phone || "Not added", "bg-emerald-50 text-emerald-500"],
                  [Building2, "Department", user.department || "Not set", "bg-cyan-50 text-cyan-500"],
                  [CalendarDays, "Joined", user.joiningDate || user.createdAt ? `${fmtDate(user.joiningDate || user.createdAt)} (${tenure(user.joiningDate || user.createdAt)})` : "-", "bg-amber-50 text-amber-500"],
                ].map(([Icon, label, value, tint]) => (
                  <li key={label} className="flex items-center gap-4">
                    <span className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center ${tint}`}><Icon size={19} /></span>
                    <div className="min-w-0"><p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{label}</p><p className="font-semibold text-slate-900 break-words">{value}</p></div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Right: my work + settings */}
          <div className="xl:col-span-2 space-y-6">
            <div className="rounded-2xl border border-violet-100 bg-linear-to-r from-violet-50 to-pink-50 p-6">
              <p className="text-xs font-bold tracking-widest text-brand">WELCOME BACK</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">Hi, {user.name?.split(" ")[0]}!</p>
              <p className="mt-1 text-slate-600">
                {s ? <>You have <strong className="text-brand">{s.openTasks} open task{s.openTasks === 1 ? "" : "s"}</strong>{s.overdue ? <> and <strong className="text-red-600">{s.overdue} overdue</strong></> : null}.</> : "Loading your work..."}
              </p>
            </div>

            {s && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard label="Open Tasks" value={s.openTasks} icon={<ListTodo size={24} />} />
                <KpiCard label="Done This Month" value={s.doneMonth} icon={<CircleCheck size={24} />} tone="green" />
                <KpiCard label="Hours This Month" value={`${s.hoursMonth}h`} icon={<Clock size={24} />} tone="amber" />
                <KpiCard label="Projects" value={s.projects} icon={<FolderKanban size={24} />} tone="cyan" />
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Weekly Productivity" subtitle="Tasks completed and hours logged, last 7 days">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={summary?.week || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" />
                      <YAxis yAxisId="a" allowDecimals={false} />
                      <YAxis yAxisId="h" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="a" dataKey="done" name="Tasks done" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="h" type="monotone" dataKey="hours" name="Hours" stroke="#10b981" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Recent Activity">
                {!summary?.activity?.length ? <EmptyState>No activity yet. Finish a task or log time and it shows here.</EmptyState> : (
                  <ul className="space-y-4">
                    {summary.activity.map((a, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className={`mt-1 h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${a.kind === "task" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{a.kind === "task" ? <CircleCheck size={15} /> : <Clock size={15} />}</span>
                        <div className="min-w-0"><p className="text-slate-800 break-words">{a.text}</p><p className="text-xs text-slate-400">{timeAgo(a.at)}</p></div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
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
