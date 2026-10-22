import { useCallback, useEffect, useState } from "react";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Users as UsersIcon,
  ShieldCheck,
  FolderKanban,
  User as UserIcon,
  KeyRound,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import {
  PageHeader,
  Card,
  Badge,
  Spinner,
  Modal,
  Field,
  Toggle,
  inputClass,
  PrimaryButton,
  GhostButton,
} from "../components/ui";
import { roleColor } from "../utils/format";
import { can, getPermissions, getUser, isAdmin, refreshPermissions } from "../utils/permissions";
import { errMsg } from "../constants/userOptions";

const ICONS = { ADMIN: ShieldCheck, MANAGER: FolderKanban, EMPLOYEE: UserIcon };
const roleIcon = (key) => ICONS[key] || KeyRound;
const CHIPS = 6;

const EMPTY_FORM = { id: null, key: "", name: "", description: "", baseRole: "EMPLOYEE", permissions: [], isSystem: false };

export default function Roles() {
  const me = getUser();
  const [data, setData] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const manage = can("roles.manage");
  const admin = isAdmin();
  const myPerms = getPermissions() || [];
  const holds = (p) => admin || myPerms.includes(p);

  const load = useCallback(() => {
    return api
      .get("/roles")
      .then((res) => setData(res.data))
      .catch((err) => toast.error(errMsg(err, "Failed to load roles")));
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/roles")
      .then((res) => !cancelled && setData(res.data))
      .catch((err) => !cancelled && toast.error(errMsg(err, "Failed to load roles")));
    return () => {
      cancelled = true;
    };
  }, []);

  // Role edits can change the caller's own access, so re-sync it.
  const afterChange = async () => {
    await load();
    refreshPermissions({ force: true }).catch(() => {});
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal(true);
  };

  const openEdit = (r) => {
    setForm({
      id: r._id,
      key: r.key,
      name: r.name,
      description: r.description || "",
      baseRole: r.baseRole,
      permissions: r.permissions,
      isSystem: r.isSystem,
    });
    setModal(true);
  };

  const saveRole = async () => {
    if (!form.name.trim()) return toast.error("Role name is required");
    setSaving(true);
    try {
      const body = {
        name: form.name,
        description: form.description,
        baseRole: form.baseRole,
        permissions: form.permissions,
      };
      if (form.id) await api.put(`/roles/${form.id}`, body);
      else await api.post("/roles", body);
      toast.success(form.id ? "Role updated" : "Role created");
      setModal(false);
      await afterChange();
    } catch (err) {
      toast.error(errMsg(err, "Failed to save role"));
    } finally {
      setSaving(false);
    }
  };

  const removeRole = async (r) => {
    if (!window.confirm(`Delete the "${r.name}" role?`)) return;
    try {
      await api.delete(`/roles/${r._id}`);
      toast.success("Role deleted");
      await afterChange();
    } catch (err) {
      toast.error(errMsg(err, "Failed to delete role"));
    }
  };

  // Matrix toggle: optimistic update, revert on failure.
  const togglePermission = async (role, permKey, on) => {
    const prev = data;
    const next = on
      ? [...role.permissions, permKey]
      : role.permissions.filter((p) => p !== permKey);

    setData({
      ...data,
      roles: data.roles.map((r) => (r._id === role._id ? { ...r, permissions: next } : r)),
    });

    try {
      await api.put(`/roles/${role._id}`, { permissions: next });
      refreshPermissions({ force: true }).catch(() => {});
    } catch (err) {
      setData(prev);
      toast.error(errMsg(err, "Failed to update permission"));
    }
  };

  const formToggle = (key) =>
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }));

  const labelOf = (key) =>
    data?.groups.flatMap((g) => g.permissions).find((p) => p.key === key)?.label || key;

  return (
    <Layout>
      <div className="space-y-6 text-left">
        <PageHeader
          title="Roles & Permissions"
          breadcrumbs={[
            { label: "Home", to: me?.role === "ADMIN" ? "/admin" : "/employee" },
            { label: "User Management" },
            { label: "Roles & Permissions" },
          ]}
          actions={
            manage && (
              <PrimaryButton onClick={openCreate}>
                <PlusCircle size={18} /> Add Role
              </PrimaryButton>
            )
          }
        />

        {!data ? (
          <Spinner label="Loading roles..." />
        ) : (
          <>
            {/* Role cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {data.roles.map((r, i) => {
                const color = roleColor(i);
                const Icon = roleIcon(r.key);
                const shown = r.permissions.slice(0, CHIPS);
                const more = r.permissions.length - shown.length;
                return (
                  <section key={r._id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className="h-14 w-14 shrink-0 rounded-xl flex items-center justify-center"
                          style={{ background: `${color}1a`, color }}
                        >
                          <Icon size={26} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xl font-bold text-slate-900 truncate">{r.name}</p>
                          <p className="flex items-center gap-1.5 text-slate-500">
                            <UsersIcon size={14} /> {r.userCount} {r.userCount === 1 ? "user" : "users"}
                          </p>
                        </div>
                      </div>
                      {manage && (
                        <div className="flex gap-2">
                          {r.key !== "ADMIN" && (
                            <button
                              onClick={() => openEdit(r)}
                              className="h-9 w-11 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center"
                              title="Edit role"
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {!r.isSystem && (
                            <button
                              onClick={() => removeRole(r)}
                              className="h-9 w-11 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center justify-center"
                              title="Delete role"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="mt-5 text-slate-600 leading-relaxed">{r.description || "No description."}</p>

                    <p className="mt-5 font-semibold text-slate-900">
                      Permissions ({r.permissions.length}/{data.totalPermissions})
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {shown.map((p) => (
                        <Badge key={p} className="bg-emerald-50 text-emerald-600">{labelOf(p)}</Badge>
                      ))}
                      {more > 0 && <Badge className="bg-violet-100 text-violet-700">+{more} more</Badge>}
                      {r.permissions.length === 0 && <span className="text-sm text-slate-400">None</span>}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Matrix */}
            <Card title="Permissions Matrix" className="!p-0 overflow-hidden">
              <div className="overflow-x-auto px-4 pb-4">
                <table className="w-full" style={{ minWidth: 420 + data.roles.length * 130 }}>
                  <thead>
                    <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wider">
                      <th className="p-4 text-left text-slate-500">Permission</th>
                      {data.roles.map((r, i) => (
                        <th key={r._id} className="p-4 text-center" style={{ color: roleColor(i) }}>
                          {r.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.groups.map((g) => (
                      <GroupRows
                        key={g.key}
                        group={g}
                        roles={data.roles}
                        manage={manage}
                        holds={holds}
                        onToggle={togglePermission}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Add / edit role */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        wide
        title={form.id ? `Edit ${form.name}` : "Add Role"}
        footer={
          <>
            <GhostButton onClick={() => setModal(false)} disabled={saving}>Cancel</GhostButton>
            <PrimaryButton onClick={saveRole} disabled={saving}>
              {saving ? "Saving..." : form.id ? "Save changes" : "Create role"}
            </PrimaryButton>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Role name" required>
            <input
              className={inputClass}
              value={form.name}
              disabled={form.isSystem}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Support"
            />
          </Field>
          {!form.isSystem && (
            <Field label="Dashboard type" hint="Which home screen users of this role land on">
              <div className="relative">
                <select
                  className={`${inputClass} appearance-none pr-10`}
                  value={form.baseRole}
                  onChange={(e) => setForm((f) => ({ ...f, baseRole: e.target.value }))}
                >
                  <option value="EMPLOYEE">Employee dashboard</option>
                  <option value="MANAGER">Manager dashboard</option>
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </Field>
          )}
          <div className="md:col-span-2">
            <Field label="Description">
              <textarea
                rows={2}
                className={inputClass}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What can this role do?"
              />
            </Field>
          </div>
        </div>

        <p className="mt-6 mb-3 font-semibold text-slate-900">
          Permissions ({form.permissions.length}/{data?.totalPermissions})
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
          {data?.groups.map((g) => (
            <div key={g.key}>
              <div className="font-semibold text-slate-900 mb-2.5">{g.label}</div>
              <div className="space-y-2">
                {g.permissions.map((p) => {
                  const disabled = !holds(p.key);
                  return (
                    <label
                      key={p.key}
                      title={disabled ? "You can only grant permissions you have" : undefined}
                      className={`flex items-center gap-2.5 ${disabled ? "text-slate-400" : "text-slate-700 cursor-pointer"}`}
                    >
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={form.permissions.includes(p.key)}
                        onChange={() => formToggle(p.key)}
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
      </Modal>
    </Layout>
  );
}

function GroupRows({ group, roles, manage, holds, onToggle }) {
  return (
    <>
      <tr className="bg-slate-50/70">
        <td colSpan={roles.length + 1} className="px-4 py-3 font-semibold text-slate-900 text-left">
          {group.label}
        </td>
      </tr>
      {group.permissions.map((p) => (
        <tr key={p.key} className="border-b border-slate-100 last:border-0">
          <td className="px-4 py-3.5 pl-8 text-slate-700 text-left">{p.label}</td>
          {roles.map((r, i) => {
            const locked = r.key === "ADMIN";
            const on = r.permissions.includes(p.key);
            // Turning a permission on needs you to hold it yourself.
            const blocked = !manage || locked || (!on && !holds(p.key));
            return (
              <td key={r._id} className="px-4 py-3.5">
                <div className="flex justify-center">
                  <Toggle
                    checked={on}
                    color={roleColor(i)}
                    disabled={blocked}
                    label={`${r.name}: ${p.label}`}
                    onChange={(v) => onToggle(r, p.key, v)}
                  />
                </div>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
