import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Download, Pencil, Trash2, Plus, Users, IndianRupee, Wallet, CircleCheck, Clock, CalendarClock } from "lucide-react";
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
import { TIER_BADGE } from "../constants/crm";
import { downloadCsv, fmtDate, fmtMoney, labelize } from "../utils/format";
import { can, homePath } from "../utils/permissions";

const PER_PAGE = 8;
const TIERS = ["PLATINUM", "GOLD", "SILVER", "BRONZE"];

const PAY = {
  PAID: { label: "Paid", cls: "bg-emerald-100 text-emerald-700" },
  PARTIALLY_PAID: { label: "Partially Paid", cls: "bg-amber-100 text-amber-700" },
  PENDING: { label: "Pending", cls: "bg-red-100 text-red-700" },
};

const getRenewalStatus = (date) => {
  const daysLeft = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  return { daysLeft, expiringSoon: daysLeft <= 20, expired: daysLeft < 0 };
};

// Customers and clients are the same people: this one page lists, adds, edits and bills them.
export default function Customers() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { id: editId } = useParams();
  const canManage = can("clients.manage");

  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("ALL");
  const [payment, setPayment] = useState("ALL");
  const [page, setPage] = useState(1);
  const [billingClient, setBillingClient] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // /add-customer and /edit-customer/:id open the slide-over drawer on top of this list.
  const drawerOpen = pathname.replace(/\/+$/, "") === "/add-customer" || Boolean(editId);
  const closeDrawer = useCallback(() => navigate("/crm/customers"), [navigate]);
  const onSaved = useCallback(() => {
    navigate("/crm/customers");
    setReloadKey((k) => k + 1);
  }, [navigate]);

  useEffect(() => {
    api
      .get("/crm/customers")
      .then((res) => setData(res.data))
      .catch(() => toast.error("Failed to load customers"));
  }, [reloadKey]);

  const deleteCustomer = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success("Customer deleted successfully");
      setReloadKey((k) => k + 1);
    } catch {
      toast.error("Delete failed");
    }
  };

  const customers = data?.customers || [];

  const stats = useMemo(
    () => ({
      paid: customers.filter((c) => c.paymentStatus === "PAID").length,
      due: customers.filter((c) => c.paymentStatus !== "PAID").length,
      renewing: customers.filter((c) => {
        if (!c.renewalDate) return false;
        const r = getRenewalStatus(c.renewalDate);
        return r.expiringSoon && !r.expired;
      }).length,
    }),
    [customers],
  );

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter(
      (c) =>
        (tier === "ALL" || c.tier === tier) &&
        (payment === "ALL" || (c.paymentStatus || "PENDING") === payment) &&
        (!q || [c.clientName, c.companyName, c.domainName, c.softwareName, c.phone1].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [customers, search, tier, payment]);

  const rows = shown.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportCsv = () =>
    downloadCsv("customers.csv", [
      ["Customer", "Company", "Phone", "Type", "Domain / Software", "Renewal", "Total Cost", "Balance", "Payment", "Tier", "Since"],
      ...shown.map((c) => [
        c.clientName,
        c.companyName,
        c.phone1,
        c.basicType,
        detail(c),
        c.renewalDate ? fmtDate(c.renewalDate) : "",
        c.totalCost,
        c.balance,
        c.paymentStatus,
        c.tier,
        fmtDate(c.createdAt),
      ]),
    ]);

  const renewalText = (c) => {
    if (!c.renewalDate) return <span className="text-slate-400">-</span>;
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

  const actions = (c) =>
    !canManage ? null : (
      <>
        <IconButton onClick={() => navigate(`/edit-customer/${c._id}`)} aria-label="Edit customer" title="Edit">
          <Pencil size={15} />
        </IconButton>
        <IconButton tone="danger" onClick={() => deleteCustomer(c._id)} aria-label="Delete customer" title="Delete">
          <Trash2 size={15} />
        </IconButton>
      </>
    );

  function detail(c) {
    return c.basicType === "WEBSITE" || c.basicType === "E-COMMERCE" ? c.domainName || "-" : c.softwareName || "-";
  }

  const stat = data?.stats;

  return (
    <Layout>
      <div className="space-y-5 sm:space-y-6 text-left">
        <PageHeader
          title="Customers"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "CRM" }, { label: "Customers" }]}
          actions={
            <>
              <GhostButton onClick={exportCsv} disabled={!shown.length}>
                <Download size={16} /> Export
              </GhostButton>
              {canManage && (
                <PrimaryButton onClick={() => navigate("/add-customer")}>
                  <Plus size={18} /> Add Customer
                </PrimaryButton>
              )}
            </>
          }
        />

        {!data ? (
          <Spinner />
        ) : (
          <>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
              <StatCard label="Total Customers" value={stat.totalCustomers} icon={<Users size={26} />} tone="indigo" />
              <StatCard label="Total Revenue" value={fmtMoney(stat.totalRevenue)} icon={<IndianRupee size={26} />} tone="green" />
              <StatCard label="Pending Balance" value={fmtMoney(stat.pendingBalance)} icon={<Wallet size={26} />} tone="amber" />
              <StatCard label="Paid" value={stats.paid} icon={<CircleCheck size={26} />} tone="green" />
              <StatCard label="Payment Due" value={stats.due} icon={<Clock size={26} />} tone="amber" />
              <StatCard label="Renewing Soon" value={stats.renewing} icon={<CalendarClock size={26} />} tone="red" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-4 flex flex-col lg:flex-row gap-3">
              <SearchBox
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
                placeholder="Search by name, company, phone, domain or software..."
              />
              <select
                value={tier}
                onChange={(e) => {
                  setTier(e.target.value);
                  setPage(1);
                }}
                className={`${inputClass} lg:w-48`}
              >
                <option value="ALL">All Tiers</option>
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {labelize(t)}
                  </option>
                ))}
              </select>
              <select
                value={payment}
                onChange={(e) => {
                  setPayment(e.target.value);
                  setPage(1);
                }}
                className={`${inputClass} lg:w-48`}
              >
                <option value="ALL">All Payments</option>
                {Object.entries(PAY).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-100">
                <div role="heading" aria-level={2} className="text-base font-semibold text-slate-900">
                  Customers ({shown.length})
                </div>
              </div>

              {shown.length === 0 ? (
                <EmptyState>No customers found.</EmptyState>
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
                          <div className="flex gap-1.5 shrink-0">
                            <Badge className="bg-violet-100 text-violet-700 !text-xs">{c.basicType}</Badge>
                            <Badge className={`${TIER_BADGE[c.tier]} !text-xs`}>{labelize(c.tier)}</Badge>
                          </div>
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
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-3 py-3 hidden lg:table-cell">Type</th>
                          <th className="px-3 py-3 hidden xl:table-cell">Domain / Software</th>
                          <th className="px-3 py-3 hidden 2xl:table-cell">Mobile</th>
                          <th className="px-3 py-3">Renewal</th>
                          <th className="px-3 py-3 hidden lg:table-cell">Total Cost</th>
                          <th className="px-3 py-3 hidden xl:table-cell">Balance</th>
                          <th className="px-3 py-3 hidden lg:table-cell">Tier</th>
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
                            <td className="px-3 py-3 hidden lg:table-cell">
                              <Badge className={`${TIER_BADGE[c.tier]} !text-xs`}>{labelize(c.tier)}</Badge>
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
          </>
        )}
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
