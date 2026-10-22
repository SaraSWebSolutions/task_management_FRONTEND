import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  UserPlus,
  Eye,
  Pencil,
  Trash2,
  Users as UsersIcon,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import {
  PageHeader,
  StatCard,
  Badge,
  Avatar,
  Spinner,
  EmptyState,
  GhostButton,
  PrimaryButton,
  inputClass,
} from "../components/ui";
import { fmtDate, timeAgo, downloadCsv } from "../utils/format";
import { can, getUser } from "../utils/permissions";
import { errMsg } from "../constants/userOptions";

const PAGE_SIZE = 8;

const pageWindow = (page, pages) => {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page - 1, page, page + 1]);
  return [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
};

function Select({ value, onChange, children, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={onChange}
        className={`${inputClass} appearance-none pr-10`}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}

export default function Users() {
  const navigate = useNavigate();
  const me = getUser();

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [roles, setRoles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [selected, setSelected] = useState([]);
  const [bulk, setBulk] = useState("");
  const [working, setWorking] = useState(false);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    api
      .get("/user-management/meta")
      .then((res) => setRoles(res.data.roles))
      .catch(() => {});
  }, []);

  // Debounce search so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    api
      .get("/user-management", {
        params: {
          search: debouncedSearch || undefined,
          role: role || undefined,
          status: status || undefined,
          page,
          limit: PAGE_SIZE,
        },
      })
      .then((res) => {
        if (cancelled) return;
        setUsers(res.data.users);
        setStats(res.data.stats);
        setPagination(res.data.pagination);
        setSelected([]);
      })
      .catch((err) => {
        if (!cancelled) toast.error(errMsg(err, "Failed to load users"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, role, status, page, reloadKey]);

  const roleName = (key) => roles.find((r) => r.key === key)?.name || key;

  const allSelected = users.length > 0 && users.every((u) => selected.includes(u._id));
  const toggleAll = () => setSelected(allSelected ? [] : users.map((u) => u._id));
  const toggleOne = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/user-management/${u._id}`);
      toast.success("User deleted");
      if (users.length === 1 && page > 1) setPage((p) => p - 1);
      else reload();
    } catch (err) {
      toast.error(errMsg(err, "Failed to delete user"));
    }
  };

  const applyBulk = async () => {
    if (!bulk || selected.length === 0) return;
    if (
      bulk === "delete" &&
      !window.confirm(`Delete ${selected.length} user(s)? This cannot be undone.`)
    ) {
      return;
    }

    setWorking(true);
    try {
      const { data } = await api.post("/user-management/bulk", {
        ids: selected,
        action: bulk,
      });
      if (data.done) toast.success(`${data.done} user(s) updated`);
      if (data.failed.length) {
        toast.error(`${data.failed[0].name}: ${data.failed[0].reason}` +
          (data.failed.length > 1 ? ` (+${data.failed.length - 1} more)` : ""));
      }
      setBulk("");
      reload();
    } catch (err) {
      toast.error(errMsg(err, "Bulk action failed"));
    } finally {
      setWorking(false);
    }
  };

  const exportCsv = async () => {
    try {
      const { data } = await api.get("/user-management/export", {
        params: {
          search: debouncedSearch || undefined,
          role: role || undefined,
          status: status || undefined,
        },
      });
      downloadCsv("users.csv", [
        ["Name", "Email", "Phone", "Role", "Department", "Designation", "Status", "Join Date", "Last Login"],
        ...data.users.map((u) => [
          u.name,
          u.email,
          u.phone,
          roleName(u.roleKey),
          u.department,
          u.designation,
          u.status === "INACTIVE" ? "Inactive" : "Active",
          fmtDate(u.joinDate),
          u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never",
        ]),
      ]);
    } catch (err) {
      toast.error(errMsg(err, "Export failed"));
    }
  };

  const canCreate = can("users.create");
  const canEdit = can("users.edit");
  const canDelete = can("users.delete");
  const from = pagination.total === 0 ? 0 : (pagination.page - 1) * PAGE_SIZE + 1;
  const to = Math.min(pagination.page * PAGE_SIZE, pagination.total);

  return (
    <Layout>
      <div className="space-y-6 text-left">
        <PageHeader
          title="All Users"
          breadcrumbs={[
            { label: "Home", to: me?.role === "ADMIN" ? "/admin" : "/employee" },
            { label: "User Management" },
            { label: "All Users" },
          ]}
          actions={
            canCreate && (
              <PrimaryButton onClick={() => navigate("/users/add")}>
                <UserPlus size={18} /> Add User
              </PrimaryButton>
            )
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard label="Total Users" value={stats?.total ?? "-"} icon={<UsersIcon size={28} />} tone="indigo" />
          <StatCard label="Active Users" value={stats?.active ?? "-"} icon={<UserCheck size={28} />} tone="green" />
          <StatCard label="Inactive Users" value={stats?.inactive ?? "-"} icon={<UserX size={28} />} tone="red" />
          <StatCard label="New Users" value={stats?.newUsers ?? "-"} icon={<UserPlus size={28} />} tone="amber" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col xl:flex-row gap-3 xl:items-center">
          <div className="relative flex-1 min-w-0">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name or email..."
              className={`${inputClass} pl-11`}
            />
          </div>

          <Select
            className="xl:w-48"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r.key} value={r.key}>
                {r.name}
              </option>
            ))}
          </Select>

          <Select
            className="xl:w-48"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>

          {(canEdit || canDelete) && (
            <div className="flex gap-3">
              <Select className="w-44" value={bulk} onChange={(e) => setBulk(e.target.value)}>
                <option value="">Bulk Actions</option>
                {canEdit && <option value="activate">Activate</option>}
                {canEdit && <option value="deactivate">Deactivate</option>}
                {canDelete && <option value="delete">Delete</option>}
              </Select>
              <GhostButton onClick={applyBulk} disabled={!bulk || selected.length === 0 || working}>
                {working ? "Applying..." : "Apply"}
              </GhostButton>
            </div>
          )}

          <GhostButton onClick={exportCsv} className="xl:ml-auto">
            <Download size={18} /> Export
          </GhostButton>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 text-lg font-semibold text-slate-900">
            Users ({pagination.total})
          </div>

          {loading ? (
            <Spinner label="Loading users..." />
          ) : users.length === 0 ? (
            <EmptyState>No users match your filters.</EmptyState>
          ) : (
            <div className="overflow-x-auto px-4 pb-2">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="p-4 text-left w-12">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="h-4 w-4 accent-brand"
                        aria-label="Select all"
                      />
                    </th>
                    <th className="p-4 text-left">User</th>
                    <th className="p-4 text-left">Email</th>
                    <th className="p-4 text-left">Role</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Join Date</th>
                    <th className="p-4 text-left">Last Login</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isMe = String(u._id) === String(me?._id);
                    const active = u.status !== "INACTIVE";
                    return (
                      <tr key={u._id} className="border-b border-slate-100 last:border-0 text-left">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selected.includes(u._id)}
                            onChange={() => toggleOne(u._id)}
                            className="h-4 w-4 accent-brand"
                            aria-label={`Select ${u.name}`}
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} src={u.profileImage} size="h-12 w-12" text="text-base" />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">
                                {u.name}
                                {isMe && <span className="ml-2 text-xs font-normal text-slate-400">(you)</span>}
                              </p>
                              <p className="text-sm text-slate-500 truncate">{u.department || u.designation || "-"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-700">{u.email}</td>
                        <td className="p-4">
                          <Badge className="bg-violet-100 text-violet-700">{roleName(u.roleKey)}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={active ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-600"}>
                            {active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-4 text-slate-700">{fmtDate(u.joinDate)}</td>
                        <td className="p-4 text-slate-700">{timeAgo(u.lastLoginAt)}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/users/${u._id}`)}
                              className="h-9 w-11 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => navigate(`/users/${u._id}/edit`)}
                                className="h-9 w-11 rounded-lg bg-brand text-white hover:bg-brand-hover flex items-center justify-center"
                                title="Edit"
                              >
                                <Pencil size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => remove(u)}
                                disabled={isMe}
                                className="h-9 w-11 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                                title={isMe ? "You cannot delete yourself" : "Delete"}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && pagination.total > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 px-6 py-5">
              <span className="text-slate-600">
                Showing {from} to {to} of {pagination.total} entries
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  className="h-10 w-10 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>
                {pageWindow(pagination.page, pagination.pages).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`h-10 w-10 rounded-lg border font-semibold ${
                      n === pagination.page
                        ? "bg-brand border-brand text-white"
                        : "border-slate-200 text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.pages}
                  className="h-10 w-10 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
