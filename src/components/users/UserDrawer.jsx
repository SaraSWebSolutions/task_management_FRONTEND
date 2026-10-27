// Add / Edit user form shown in a right-side drawer (replaces the old full-page form).
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Drawer from "../Drawer";
import { Avatar, Field, GhostButton, PrimaryButton, Spinner, inputClass } from "../ui";
import { DESIGNATIONS, DEPARTMENTS, GENDERS, COUNTRIES, errMsg } from "../../constants/userOptions";
import { getPermissions, isAdmin } from "../../utils/permissions";

const MAX_PHOTO = 5 * 1024 * 1024;
const ic = `${inputClass} !py-2.5`;

const EMPTY = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dob: "",
  gender: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  roleKey: "",
  department: "",
  designation: "Developer",
  employeeId: "",
  status: "ACTIVE",
  password: "",
  confirmPassword: "",
};

const splitName = (name = "") => {
  const [first, ...rest] = name.trim().split(/\s+/);
  return { firstName: first || "", lastName: rest.join(" ") };
};

function Select({ value, onChange, placeholder, children }) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange} className={`${ic} appearance-none pr-10`}>
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}

function Group({ title, children }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand">{title}</span>
        <span className="h-px flex-1 bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">{children}</div>
    </section>
  );
}

const Full = ({ children }) => <div className="sm:col-span-2">{children}</div>;

export default function UserDrawer({ userId, onClose, onSaved }) {
  const editing = Boolean(userId);
  const fileRef = useRef(null);

  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [extras, setExtras] = useState([]);
  const [photo, setPhoto] = useState("");
  const [showPerms, setShowPerms] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const admin = isAdmin();
  const myPerms = getPermissions() || [];

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.get("/user-management/meta"),
      editing ? api.get(`/user-management/${userId}`) : Promise.resolve(null),
    ])
      .then(([metaRes, userRes]) => {
        if (cancelled) return;
        setMeta(metaRes.data);

        if (userRes) {
          const u = userRes.data;
          setForm({
            ...EMPTY,
            ...splitName(u.name),
            email: u.email || "",
            phone: u.phone || "",
            dob: u.dob ? String(u.dob).slice(0, 10) : "",
            gender: u.gender || "",
            address: u.address || "",
            city: u.city || "",
            state: u.state || "",
            zipCode: u.zipCode || "",
            country: u.country || "",
            roleKey: u.roleKey || u.role,
            department: u.department || "",
            designation: u.designation || "Developer",
            employeeId: u.employeeId || "",
            status: u.status || "ACTIVE",
          });
          setExtras(u.permissions || []);
          setPhoto(u.profileImage || "");
        } else {
          const first = metaRes.data.roles.find((r) => r.key === "EMPLOYEE") || metaRes.data.roles[0];
          setForm({ ...EMPTY, roleKey: first?.key || "" });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(errMsg(err, "Failed to load form"));
        onClose();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const role = meta?.roles.find((r) => r.key === form.roleKey);
  const rolePerms = useMemo(() => new Set(role?.permissions || []), [role]);
  const isAdminRole = role?.baseRole === "ADMIN";
  const total = meta?.totalPermissions || 0;
  const effective = isAdminRole ? total : new Set([...rolePerms, ...extras]).size;

  // Non-admins can only pick roles that don't exceed their own access.
  const selectableRoles = (meta?.roles || []).filter(
    (r) =>
      admin ||
      r.key === form.roleKey ||
      (r.baseRole !== "ADMIN" && r.permissions.every((p) => myPerms.includes(p))),
  );

  const departments = useMemo(
    () =>
      form.department && !DEPARTMENTS.includes(form.department)
        ? [form.department, ...DEPARTMENTS]
        : DEPARTMENTS,
    [form.department],
  );
  const countries = useMemo(
    () =>
      form.country && !COUNTRIES.includes(form.country)
        ? [form.country, ...COUNTRIES]
        : COUNTRIES,
    [form.country],
  );

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const togglePerm = (key) =>
    setExtras((x) => (x.includes(key) ? x.filter((k) => k !== key) : [...x, key]));

  const readPhoto = (file) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      return toast.error("Photo must be a PNG, JPG or WebP image");
    }
    if (file.size > MAX_PHOTO) return toast.error("Photo must be 5MB or smaller");

    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.onerror = () => toast.error("Could not read the image");
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return toast.error("First name and last name are required");
    }
    if (!form.email.trim()) return toast.error("Email is required");
    if (!form.roleKey) return toast.error("Select a role");

    if (!editing || form.password || form.confirmPassword) {
      if (form.password.length < 8) return toast.error("Password must be at least 8 characters");
      if (form.password !== form.confirmPassword) return toast.error("Passwords do not match");
    }

    const payload = {
      name: `${form.firstName.trim()} ${form.lastName.trim()}`,
      email: form.email.trim(),
      phone: form.phone,
      dob: form.dob,
      gender: form.gender,
      address: form.address,
      city: form.city,
      state: form.state,
      zipCode: form.zipCode,
      country: form.country,
      roleKey: form.roleKey,
      department: form.department,
      designation: form.designation,
      employeeId: form.employeeId,
      status: form.status,
      // Only extras beyond the role's own permissions are stored on the user.
      permissions: isAdminRole ? [] : extras.filter((p) => !rolePerms.has(p)),
      profileImage: photo || "",
    };
    if (form.password) payload.password = form.password;

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/user-management/${userId}`, payload);
        toast.success("User updated");
      } else {
        await api.post("/user-management", payload);
        toast.success("User created");
      }
      onSaved();
    } catch (err) {
      toast.error(errMsg(err, "Failed to save user"));
    } finally {
      setSaving(false);
    }
  };

  const fullName = `${form.firstName} ${form.lastName}`.trim();

  return (
    <Drawer
      title={editing ? "Edit User" : "Add User"}
      subtitle="Account details and role"
      onClose={onClose}
      footer={
        <>
          <GhostButton type="button" onClick={onClose} disabled={saving} className="!py-2.5">
            Cancel
          </GhostButton>
          <PrimaryButton type="button" onClick={save} disabled={saving || loading} className="!py-2.5">
            {saving ? "Saving..." : editing ? "Save Changes" : "Save User"}
          </PrimaryButton>
        </>
      }
    >
      {loading || !meta ? (
        <Spinner label="Loading..." />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-8"
          autoComplete="off"
        >
          {/* Photo */}
          <div className="flex items-center gap-4">
            <Avatar name={fullName || "New User"} src={photo} size="h-16 w-16" text="text-lg" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">Profile Image</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    readPhoto(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <GhostButton type="button" onClick={() => fileRef.current?.click()} className="!px-3 !py-1.5">
                  <UploadCloud size={16} /> {photo ? "Change" : "Choose file"}
                </GhostButton>
                {photo && (
                  <GhostButton type="button" onClick={() => setPhoto("")} className="!px-3 !py-1.5 !text-red-600">
                    <Trash2 size={16} /> Remove
                  </GhostButton>
                )}
              </div>
              <p className="mt-1.5 text-xs text-slate-400">PNG, JPG or WebP up to 5MB</p>
            </div>
          </div>

          <Group title="Basic details">
            <Field label="First Name" required>
              <input className={ic} placeholder="Enter first name" value={form.firstName} onChange={set("firstName")} />
            </Field>
            <Field label="Last Name" required>
              <input className={ic} placeholder="Enter last name" value={form.lastName} onChange={set("lastName")} />
            </Field>
            <Field label="Email" required>
              <input type="email" className={ic} placeholder="name@company.com" autoComplete="off" value={form.email} onChange={set("email")} />
            </Field>
            <Field label="Mobile Number">
              <input className={ic} placeholder="+91 00000 00000" value={form.phone} onChange={set("phone")} />
            </Field>
            <Field label="Date of Birth">
              <input type="date" className={ic} value={form.dob} onChange={set("dob")} />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={set("gender")} placeholder="Select gender">
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </Select>
            </Field>
          </Group>

          <Group title="Account">
            <Field label="Role" required>
              <Select value={form.roleKey} onChange={set("roleKey")} placeholder="Select role">
                {selectableRoles.map((r) => (
                  <option key={r.key} value={r.key}>{r.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Employee ID" hint="Optional, must be unique">
              <input className={ic} placeholder="e.g. EMP-0021" value={form.employeeId} onChange={set("employeeId")} />
            </Field>
            <Field label="Department">
              <Select value={form.department} onChange={set("department")} placeholder="Select department">
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </Field>
            <Field label="Designation">
              <Select value={form.designation} onChange={set("designation")}>
                {DESIGNATIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={set("status")}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </Field>
            <span className="hidden sm:block" />
            <Field
              label={editing ? "Reset Password" : "Password"}
              required={!editing}
              hint={editing ? "Leave blank to keep the current password" : "Minimum 8 characters"}
            >
              <input
                type="password"
                className={ic}
                placeholder="Enter password"
                autoComplete="new-password"
                value={form.password}
                onChange={set("password")}
              />
            </Field>
            <Field label={editing ? "Confirm New Password" : "Confirm Password"} required={!editing}>
              <input
                type="password"
                className={ic}
                placeholder="Confirm password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
              />
            </Field>
          </Group>

          <Group title="Address">
            <Full>
              <Field label="Street Address">
                <input className={ic} placeholder="Enter street address" value={form.address} onChange={set("address")} />
              </Field>
            </Full>
            <Field label="City">
              <input className={ic} placeholder="Enter city" value={form.city} onChange={set("city")} />
            </Field>
            <Field label="State / Province">
              <input className={ic} placeholder="Enter state" value={form.state} onChange={set("state")} />
            </Field>
            <Field label="ZIP / Postal Code">
              <input className={ic} placeholder="Enter ZIP code" value={form.zipCode} onChange={set("zipCode")} />
            </Field>
            <Field label="Country">
              <Select value={form.country} onChange={set("country")} placeholder="Select country">
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
          </Group>

          {/* Permissions (collapsible) */}
          <section className="rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setShowPerms((v) => !v)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              aria-expanded={showPerms}
            >
              <ShieldCheck size={20} className="text-sky-500 shrink-0" />
              <span className="flex-1">
                <span className="block font-semibold text-slate-900">Permissions</span>
                <span className="block text-xs text-slate-500">
                  {effective} of {total} selected{role ? ` · ${role.name} role` : ""}
                </span>
              </span>
              <ChevronDown size={18} className={`text-slate-500 transition-transform ${showPerms ? "rotate-180" : ""}`} />
            </button>

            {showPerms && (
              <div className="border-t border-slate-100 px-4 py-5">
                <p className="text-sm text-slate-500 mb-5">
                  {isAdminRole
                    ? "Admins have every permission."
                    : "Checked and greyed permissions come from the selected role. Tick others to grant this user extra access."}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                  {meta.groups.map((g) => (
                    <div key={g.key}>
                      <div className="font-semibold text-slate-900 mb-2.5 text-sm">{g.label}</div>
                      <div className="space-y-2">
                        {g.permissions.map((p) => {
                          const fromRole = isAdminRole || rolePerms.has(p.key);
                          const heldByMe = admin || myPerms.includes(p.key);
                          const checked = fromRole || extras.includes(p.key);
                          const disabled = fromRole || !heldByMe;
                          return (
                            <label
                              key={p.key}
                              title={
                                fromRole
                                  ? "Included in the selected role"
                                  : !heldByMe
                                    ? "You can only grant permissions you have"
                                    : undefined
                              }
                              className={`flex items-center gap-2.5 text-sm ${disabled ? "text-slate-400" : "text-slate-700 cursor-pointer"}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={disabled}
                                onChange={() => togglePerm(p.key)}
                                className="h-4 w-4 accent-brand"
                              />
                              {p.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* lets Enter submit the form */}
          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
        </form>
      )}
    </Drawer>
  );
}
