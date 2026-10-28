import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Pencil, Trash2, Plus, Building2, CircleCheck, Clock, CalendarClock } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import ClientDrawer from "../components/clients/ClientDrawer";
import api from "../api/axios";
import {
  PageHeader,
  StatCard,
  Badge,
  Spinner,
  EmptyState,
  PrimaryButton,
  GhostButton,
  Pagination,
  SearchBox,
  IconButton,
  Modal,
  Field,
  inputClass,
} from "../components/ui";
import { fmtDate, fmtMoney } from "../utils/format";
import { can, homePath } from "../utils/permissions";

const PER_PAGE = 8;

const getRenewalStatus = (date) => {
  const daysLeft = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  return { daysLeft, expiringSoon: daysLeft <= 20, expired: daysLeft < 0 };
};

const PAY = {
  PAID: { label: "Paid", cls: "bg-emerald-100 text-emerald-700" },
  PARTIALLY_PAID: { label: "Partially Paid", cls: "bg-amber-100 text-amber-700" },
  PENDING: { label: "Pending", cls: "bg-red-100 text-red-700" },
};

export default function Clients() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { id: editId } = useParams();
  const canManage = can("clients.manage");

  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [billingClient, setBillingClient] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // /add-client and /edit-client/:id open the slide-over drawer on top of this list.
  const drawerOpen = pathname.replace(/\/+$/, "") === "/add-client" || Boolean(editId);
  const closeDrawer = useCallback(() => navigate("/clients"), [navigate]);
  const onSaved = useCallback(() => {
    navigate("/clients");
    setReloadKey((k) => k + 1);
  }, [navigate]);

  useEffect(() => {
    api
      .get("/clients")
      .then((res) => setClients(res.data.clients || []))
      .catch(() => toast.error("Failed to load clients"))
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const deleteClient = async (id) => {
    if (!window.confirm("Delete this client?")) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success("Client deleted successfully");
      setReloadKey((k) => k + 1);
    } catch {
      toast.error("Delete failed");
    }
  };

  const stats = useMemo(
    () => ({
      total: clients.length,
      paid: clients.filter((c) => c.paymentStatus === "PAID").length,
      pending: clients.filter((c) => c.paymentStatus !== "PAID").length,
      renewing: clients.filter((c) => {
        const r = getRenewalStatus(c.renewalDate);
        return c.renewalDate && r.expiringSoon && !r.expired;
      }).length,
    }),
    [clients],
  );

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.clientName, c.companyName, c.domainName, c.softwareName].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [clients, search]);

  const rows = shown.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const renewalText = (c) => {
    const r = getRenewalStatus(c.renewalDate);
    const color = r.expired ? "text-red-600" : r.expiringSoon ? "text-orange-600" : "text-emerald-600";
    return (
      <span className={`font-medium ${color}`}>
        {fmtDate(c.renewalDate)}
        <span className="block text-xs font-normal">{r.expired ? "Expired" : `${r.daysLeft} days left`}</span>
      </span>
    );
  };

  const payBadge = (c) => {
    const p = PAY[c.paymentStatus] || PAY.PENDING;
    if (c.paymentStatus === "PAID" || !canManage) return <Badge className={`${p.cls} !text-xs`}>{p.label}</Badge>;
    return (
      <button type="button" onClick={() => setBillingClient(c)} title="Update billing">
        <Badge className={`${p.cls} !text-xs cursor-pointer hover:opacity-80 whitespace-nowrap`}>{p.label}</Badge>
      </button>
    );
  };

  const actions = (c) => !canManage ? null : (
    <>
      <IconButton onClick={() => navigate(`/edit-client/${c._id}`)} aria-label="Edit client" title="Edit">
        <Pencil size={15} />
      </IconButton>
      <IconButton tone="danger" onClick={() => deleteClient(c._id)} aria-label="Delete client" title="Delete">
        <Trash2 size={15} />
      </IconButton>
    </>
  );

  const detail = (c) =>
    c.basicType === "WEBSITE" || c.basicType === "E-COMMERCE" ? c.domainName || "-" : c.softwareName || "-";

  return (
    <Layout>
      <div className="space-y-5 sm:space-y-6 text-left">
        <PageHeader
          title="Client Management"
          breadcrumbs={[
            { label: "Home", to: homePath() },
            { label: "Apps" },
            { label: "Clients" },
          ]}
          actions={
            canManage ? (
              <PrimaryButton onClick={() => navigate("/add-client")}>
                <Plus size={18} /> Add Client
              </PrimaryButton>
            ) : null
          }
        />

        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
          <StatCard label="Total Clients" value={stats.total} icon={<Building2 size={26} />} tone="indigo" />
          <StatCard label="Paid" value={stats.paid} icon={<CircleCheck size={26} />} tone="green" />
          <StatCard label="Payment Due" value={stats.pending} icon={<Clock size={26} />} tone="amber" />
          <StatCard label="Renewing Soon" value={stats.renewing} icon={<CalendarClock size={26} />} tone="red" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-4">
          <SearchBox
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by name, company, domain or software..."
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-100">
            <div role="heading" aria-level={2} className="text-base font-semibold text-slate-900">
              Clients ({shown.length})
            </div>
          </div>

          {loading ? (
            <Spinner label="Loading clients..." />
          ) : shown.length === 0 ? (
            <EmptyState>No clients found.</EmptyState>
          ) : (
            <>
              {/* Phones: card list */}
              <ul className="md:hidden divide-y divide-slate-100">
                {rows.map((c) => (
                  <li key={c._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{c.clientName}</p>
                        {c.companyName && <p className="text-[13px] text-slate-500 truncate">{c.companyName}</p>}
                      </div>
                      <Badge className="bg-violet-100 text-violet-700 !text-xs shrink-0">{c.basicType}</Badge>
                    </div>
                    <p className="mt-2 text-[13px] text-slate-500 truncate">
                      {detail(c)} · {c.phone1 || "-"}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                      {renewalText(c)}
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{fmtMoney(c.totalCost ?? 0)}</p>
                        <p className={`text-xs ${c.balance > 0 ? "text-orange-600" : "text-emerald-600"}`}>
                          Balance {fmtMoney(c.balance ?? 0)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      {payBadge(c)}
                      <div className="flex gap-2">{actions(c)}</div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Tablet / desktop table that fits the window */}
              <div className="hidden md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Client</th>
                      <th className="px-3 py-3 hidden lg:table-cell">Type</th>
                      <th className="px-3 py-3 hidden xl:table-cell">Domain / Software</th>
                      <th className="px-3 py-3 hidden 2xl:table-cell">Mobile</th>
                      <th className="px-3 py-3">Renewal</th>
                      <th className="px-3 py-3 hidden lg:table-cell">Total Cost</th>
                      <th className="px-3 py-3 hidden xl:table-cell">Balance</th>
                      <th className="px-3 py-3">Payment</th>
                      <th className="px-3 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr key={c._id} className="border-t border-slate-100 hover:bg-slate-50/60 text-slate-700">
                        <td className="px-4 py-3">
                          <div className="max-w-[14rem]">
                            <p className="font-semibold text-slate-900 truncate">{c.clientName}</p>
                            {c.companyName && <p className="text-[13px] text-slate-500 truncate">{c.companyName}</p>}
                          </div>
                        </td>
                        <td className="px-3 py-3 hidden lg:table-cell">
                          <Badge className="bg-violet-100 text-violet-700 !text-xs">{c.basicType}</Badge>
                        </td>
                        <td className="px-3 py-3 hidden xl:table-cell">
                          <span className="block max-w-[12rem] truncate">{detail(c)}</span>
                        </td>
                        <td className="px-3 py-3 hidden 2xl:table-cell">{c.phone1 || "-"}</td>
                        <td className="px-3 py-3 whitespace-nowrap">{renewalText(c)}</td>
                        <td className="px-3 py-3 font-semibold text-slate-900 hidden lg:table-cell">
                          {fmtMoney(c.totalCost ?? 0)}
                        </td>
                        <td className="px-3 py-3 hidden xl:table-cell">
                          <span className={`font-medium ${c.balance > 0 ? "text-orange-600" : "text-emerald-600"}`}>
                            {fmtMoney(c.balance ?? 0)}
                          </span>
                        </td>
                        <td className="px-3 py-3">{payBadge(c)}</td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1.5">{actions(c)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <Pagination page={page} perPage={PER_PAGE} total={shown.length} onChange={setPage} />
        </div>
      </div>

      {drawerOpen && (
        <ClientDrawer key={editId || "new"} clientId={editId} onClose={closeDrawer} onSaved={onSaved} />
      )}

      {billingClient && (
        <BillingModal
          client={billingClient}
          onClose={() => setBillingClient(null)}
          onSaved={() => {
            setBillingClient(null);
            setReloadKey((k) => k + 1);
          }}
        />
      )}
    </Layout>
  );
}

function BillingModal({ client, onClose, onSaved }) {
  const [form, setForm] = useState({
    totalCost: client.totalCost ?? "",
    advanceAmount: client.advanceAmount ?? "",
    advanceReceivedDate: client.advanceReceivedDate ? client.advanceReceivedDate.split("T")[0] : "",
    balance: client.balance ?? 0,
    balanceReceivedExpectedDate: client.balanceReceivedExpectedDate
      ? client.balanceReceivedExpectedDate.split("T")[0]
      : "",
    renewalDate: client.renewalDate ? client.renewalDate.split("T")[0] : "",
    paymentStatus: client.paymentStatus || "PENDING",
    amcAmount: client.amcAmount ?? "",
  });
  const [saving, setSaving] = useState(false);

  // Balance is derived for display; the server recalculates on save.
  const balance = Math.max(0, (parseFloat(form.totalCost) || 0) - (parseFloat(form.advanceAmount) || 0));

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const ic = `${inputClass} !py-2.5`;

  const save = async () => {
    if (!form.totalCost) return toast.error("Total Cost is required");
    if (!form.renewalDate) return toast.error("Renewal Date is required");

    try {
      setSaving(true);
      await api.put(`/clients/${client._id}`, { ...form, balance });
      toast.success("Billing details updated");
      onSaved();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update billing details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title={`Renewal & Billing · ${client.clientName}`}
      onClose={onClose}
      footer={
        <>
          <GhostButton onClick={onClose} disabled={saving} className="!py-2.5">
            Cancel
          </GhostButton>
          <PrimaryButton onClick={save} disabled={saving} className="!py-2.5">
            {saving ? "Saving..." : "Save"}
          </PrimaryButton>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
        <Field label="Total Cost" required>
          <input type="number" value={form.totalCost} onChange={set("totalCost")} className={ic} />
        </Field>
        <Field label="Payment Status">
          <select value={form.paymentStatus} onChange={set("paymentStatus")} className={ic}>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PENDING">Pending</option>
          </select>
        </Field>
        <Field label="Advance Amount">
          <input type="number" value={form.advanceAmount} onChange={set("advanceAmount")} className={ic} />
        </Field>
        <Field label="Advance Received Date">
          <input type="date" value={form.advanceReceivedDate} onChange={set("advanceReceivedDate")} className={ic} />
        </Field>
        <Field label="Balance">
          <input type="number" value={balance} readOnly className={`${ic} bg-slate-50 text-slate-500 cursor-not-allowed`} />
        </Field>
        <Field label="Balance Expected Date">
          <input
            type="date"
            value={form.balanceReceivedExpectedDate}
            onChange={set("balanceReceivedExpectedDate")}
            className={ic}
          />
        </Field>
        <Field label="Renewal Date" required>
          <input type="date" value={form.renewalDate} onChange={set("renewalDate")} className={ic} />
        </Field>
        <Field label="AMC Amount">
          <input type="number" value={form.amcAmount} onChange={set("amcAmount")} className={ic} />
        </Field>
      </div>
    </Modal>
  );
}
