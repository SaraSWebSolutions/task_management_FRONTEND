import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  User as UserIcon,
  MapPin,
  Settings,
  ShieldCheck,
  Image as ImageIcon,
  UploadCloud,
  CircleCheck,
  RefreshCw,
  X,
  ChevronDown,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import {
  PageHeader,
  SectionCard,
  Field,
  inputClass,
  PrimaryButton,
  GhostButton,
  DangerButton,
  Spinner,
} from "../components/ui";
import {
  DESIGNATIONS,
  DEPARTMENTS,
  GENDERS,
  COUNTRIES,
  errMsg,
} from "../constants/userOptions";
import { getPermissions, getUser, isAdmin } from "../utils/permissions";

const MAX_PHOTO = 5 * 1024 * 1024;

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

function Select({ value, onChange, placeholder, children }) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange} className={`${inputClass} appearance-none pr-10`}>
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

const splitName = (name = "") => {
  const [first, ...rest] = name.trim().split(/\s+/);
  return { firstName: first || "", lastName: rest.join(" ") };
};

export default function UserForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [extras, setExtras] = useState([]);
  const [photo, setPhoto] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initial, setInitial] = useState(null); // snapshot for "Reset Form"

  const admin = isAdmin();
  const myPerms = getPermissions() || [];
  const me = getUser();

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.get("/user-management/meta"),
      editing ? api.get(`/user-management/${id}`) : Promise.resolve(null),
    ])
      .then(([metaRes, userRes]) => {
        if (cancelled) return;
        setMeta(metaRes.data);

        if (userRes) {
          const u = userRes.data;
          const state = {
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
          };
          setForm(state);
          setExtras(u.permissions || []);
          setPhoto(u.profileImage || "");
          setInitial({ form: state, extras: u.permissions || [], photo: u.profileImage || "" });
        } else {
          const first = metaRes.data.roles.find((r) => r.key === "EMPLOYEE") || metaRes.data.roles[0];
          const state = { ...EMPTY, roleKey: first?.key || "" };
          setForm(state);
          setInitial({ form: state, extras: [], photo: "" });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(errMsg(err, "Failed to load form"));
          navigate("/users");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, editing, navigate]);

  const role = meta?.roles.find((r) => r.key === form.roleKey);
  const rolePerms = useMemo(() => new Set(role?.permissions || []), [role]);
  const isAdminRole = role?.baseRole === "ADMIN";
  const total = meta?.totalPermissions || 0;
  const effective = isAdminRole
    ? total
    : new Set([...rolePerms, ...extras]).size;

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

  const reset = () => {
    if (!initial) return;
    setForm(initial.form);
    setExtras(initial.extras);
    setPhoto(initial.photo);
  };

  const save = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return toast.error("First name and last name are required");
    }
    if (!form.email.trim()) return toast.error("Email is required");
    if (!form.roleKey) return toast.error("Select a role");

    if (!editing || form.password || form.confirmPassword) {
      if (form.password.length < 8) {
        return toast.error("Password must be at least 8 characters");
      }
      if (form.password !== form.confirmPassword) {
        return toast.error("Passwords do not match");
      }
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
        await api.put(`/user-management/${id}`, payload);
        toast.success("User updated");
      } else {
        await api.post("/user-management", payload);
        toast.success("User created");
      }
      navigate("/users");
    } catch (err) {
      toast.error(errMsg(err, "Failed to save user"));
    } finally {
      setSaving(false);
    }
  };

  const title = editing ? "Edit User" : "Add User";

  return (
    <Layout>
      <div className="space-y-6 text-left">
        <PageHeader
          title={title}
          breadcrumbs={[
            { label: "Home", to: me?.role === "ADMIN" ? "/admin" : "/employee" },
            { label: "User Management", to: "/users" },
            { label: title },
          ]}
        />

        {loading || !meta ? (
          <Spinner label="Loading..." />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* LEFT */}
            <div className="xl:col-span-2 space-y-6">
              <SectionCard icon={<UserIcon size={22} />} iconClass="text-indigo-500" title="Personal Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="First Name" required>
                    <input className={inputClass} placeholder="Enter first name" value={form.firstName} onChange={set("firstName")} />
                  </Field>
                  <Field label="Last Name" required>
                    <input className={inputClass} placeholder="Enter last name" value={form.lastName} onChange={set("lastName")} />
                  </Field>
                  <Field label="Email Address" required>
                    <input type="email" className={inputClass} placeholder="Enter email address" value={form.email} onChange={set("email")} />
                  </Field>
                  <Field label="Phone Number">
                    <input className={inputClass} placeholder="+91 00000 00000" value={form.phone} onChange={set("phone")} />
                  </Field>
                  <Field label="Date of Birth">
                    <input type="date" className={inputClass} value={form.dob} onChange={set("dob")} />
                  </Field>
                  <Field label="Gender">
                    <Select value={form.gender} onChange={set("gender")} placeholder="Select Gender">
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </SectionCard>

              <SectionCard icon={<MapPin size={22} />} iconClass="text-emerald-500" title="Address Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <Field label="Street Address">
                      <input className={inputClass} placeholder="Enter street address" value={form.address} onChange={set("address")} />
                    </Field>
                  </div>
                  <Field label="City">
                    <input className={inputClass} placeholder="Enter city" value={form.city} onChange={set("city")} />
                  </Field>
                  <Field label="State / Province">
                    <input className={inputClass} placeholder="Enter state" value={form.state} onChange={set("state")} />
                  </Field>
                  <Field label="ZIP / Postal Code">
                    <input className={inputClass} placeholder="Enter ZIP code" value={form.zipCode} onChange={set("zipCode")} />
                  </Field>
                  <Field label="Country">
                    <Select value={form.country} onChange={set("country")} placeholder="Select Country">
                      {countries.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </SectionCard>

              <SectionCard icon={<Settings size={22} />} iconClass="text-amber-500" title="Account Settings">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Employee ID" hint="Optional, must be unique">
                    <input className={inputClass} placeholder="e.g. EMP-0021" value={form.employeeId} onChange={set("employeeId")} />
                  </Field>
                  <Field label="Role" required>
                    <Select value={form.roleKey} onChange={set("roleKey")} placeholder="Select Role">
                      {selectableRoles.map((r) => (
                        <option key={r.key} value={r.key}>{r.name}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={editing ? "Reset Password" : "Password"} required={!editing} hint={editing ? "Leave blank to keep the current password" : undefined}>
                    <input
                      type="password"
                      className={inputClass}
                      placeholder="Enter password (min 8 chars)"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={set("password")}
                    />
                  </Field>
                  <Field label="Department">
                    <Select value={form.department} onChange={set("department")} placeholder="Select Department">
                      {departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={editing ? "Confirm New Password" : "Confirm Password"} required={!editing}>
                    <input
                      type="password"
                      className={inputClass}
                      placeholder="Confirm password"
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={set("confirmPassword")}
                    />
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
                </div>
              </SectionCard>

              <SectionCard icon={<ShieldCheck size={22} />} iconClass="text-sky-500" title="Permissions">
                <p className="text-sm text-slate-500 mb-5">
                  {isAdminRole
                    ? "Admins have every permission."
                    : "Checked and greyed permissions come from the selected role. Tick others to grant this user extra access."}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-7">
                  {meta.groups.map((g) => (
                    <div key={g.key}>
                      <div className="font-semibold text-slate-900 mb-3">{g.label}</div>
                      <div className="space-y-2.5">
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
                              className={`flex items-center gap-2.5 ${disabled ? "text-slate-400" : "text-slate-700 cursor-pointer"}`}
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
              </SectionCard>
            </div>

            {/* RIGHT */}
            <div className="space-y-6 xl:sticky xl:top-28">
              <SectionCard icon={<ImageIcon size={22} />} iconClass="text-pink-500" title="Profile Photo">
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
                {photo ? (
                  <div className="flex flex-col items-center gap-4">
                    <img src={photo} alt="Profile preview" className="h-36 w-36 rounded-full object-cover border border-slate-200" />
                    <div className="flex gap-3">
                      <GhostButton type="button" onClick={() => fileRef.current?.click()} className="!px-4 !py-2">
                        <UploadCloud size={16} /> Change
                      </GhostButton>
                      <GhostButton type="button" onClick={() => setPhoto("")} className="!px-4 !py-2 !text-red-600">
                        <Trash2 size={16} /> Remove
                      </GhostButton>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      readPhoto(e.dataTransfer.files?.[0]);
                    }}
                    className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                      dragging ? "border-brand bg-brand-soft/40" : "border-slate-300 hover:border-brand"
                    }`}
                  >
                    <UploadCloud size={44} className="mx-auto text-brand" />
                    <p className="mt-3 font-semibold text-slate-900">Drop your photo here</p>
                    <p className="mt-1 text-sm text-slate-500">or click to browse (PNG, JPG up to 5MB)</p>
                  </div>
                )}
              </SectionCard>

              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">
                  Quick Summary
                </div>
                <dl className="px-6 py-2">
                  {[
                    ["Name", `${form.firstName} ${form.lastName}`.trim()],
                    ["Email", form.email],
                    ["Role", role?.name],
                    ["Department", form.department],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-4 py-3.5 border-b border-slate-100">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="text-slate-900 font-medium truncate max-w-[60%]">{v || "--"}</dd>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-4 py-3.5">
                    <dt className="text-slate-500">Permissions</dt>
                    <dd className="text-slate-900 font-semibold">
                      {effective} of {total} selected
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <PrimaryButton onClick={save} disabled={saving} className="w-full">
                  <CircleCheck size={18} /> {saving ? "Saving..." : editing ? "Save Changes" : "Create User"}
                </PrimaryButton>
                <GhostButton onClick={reset} disabled={saving} className="w-full">
                  <RefreshCw size={16} /> Reset Form
                </GhostButton>
                <DangerButton onClick={() => navigate("/users")} disabled={saving} className="w-full">
                  <X size={16} /> Cancel
                </DangerButton>
              </section>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
