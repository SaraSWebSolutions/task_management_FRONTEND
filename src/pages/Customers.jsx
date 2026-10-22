import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Pencil, Users, IndianRupee, Wallet, Star, Phone } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import {
  PageHeader,
  StatCard,
  Badge,
  Spinner,
  EmptyState,
  GhostButton,
  Pagination,
  SearchBox,
  IconButton,
  inputClass,
} from "../components/ui";
import { TIER_BADGE } from "../constants/crm";
import { downloadCsv, fmtDate, fmtMoney, labelize } from "../utils/format";
import { can, homePath } from "../utils/permissions";

const PER_PAGE = 10;
const TIERS = ["PLATINUM", "GOLD", "SILVER", "BRONZE"];

export default function Customers() {
  const navigate = useNavigate();
  const canManage = can("clients.manage");

  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    api
      .get("/crm/customers")
      .then((res) => setData(res.data))
      .catch(() => toast.error("Failed to load customers"));
  }, []);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.customers || []).filter(
      (c) =>
        (tier === "ALL" || c.tier === tier) &&
        (!q || [c.clientName, c.companyName, c.phone1].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [data, search, tier]);

  const exportCsv = () =>
    downloadCsv("customers.csv", [
      ["Customer", "Company", "Phone", "Type", "Total Cost", "Balance", "Payment", "Tier", "Since"],
      ...shown.map((c) => [
        c.clientName,
        c.companyName,
        c.phone1,
        c.basicType,
        c.totalCost,
        c.balance,
        c.paymentStatus,
        c.tier,
        fmtDate(c.createdAt),
      ]),
    ]);

  const stats = data?.stats;
  const rows = shown.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Customers"
          breadcrumbs={[
            { label: "Home", to: homePath() },
            { label: "Apps" },
            { label: "CRM" },
            { label: "Customers" },
          ]}
          actions={
            <GhostButton onClick={exportCsv} disabled={!shown.length}>
              <Download size={16} /> Export
            </GhostButton>
          }
        />

        {!data ? (
          <Spinner />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Customers" value={stats.totalCustomers} icon={<Users size={26} />} />
              <StatCard label="Total Revenue" value={fmtMoney(stats.totalRevenue)} icon={<IndianRupee size={26} />} tone="green" />
              <StatCard label="Pending Balance" value={fmtMoney(stats.pendingBalance)} icon={<Wallet size={26} />} tone="amber" />
              <StatCard label="Avg Customer Value" value={fmtMoney(stats.avgValue)} icon={<Star size={26} />} tone="indigo" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col lg:flex-row gap-4">
              <SearchBox
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
                placeholder="Search customers..."
              />
              <select
                value={tier}
                onChange={(e) => {
                  setTier(e.target.value);
                  setPage(1);
                }}
                className={`${inputClass} lg:w-56`}
              >
                <option value="ALL">All Tiers</option>
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {labelize(t)}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div role="heading" aria-level={2} className="text-lg font-semibold text-slate-900">
                  Customer List
                </div>
                <span className="text-slate-500">{shown.length} customers</span>
              </div>

              {shown.length === 0 ? (
                <EmptyState>No customers found.</EmptyState>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[1000px] w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {["Customer", "Company", "Phone", "Type", "Total Cost", "Balance", "Tier", "Since", "Actions"].map((h) => (
                          <th key={h} className="px-4 py-4">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((c) => (
                        <tr key={c._id} className="border-t border-slate-100 hover:bg-slate-50/60 text-slate-700">
                          <td className="px-4 py-4 font-semibold text-slate-900">{c.clientName}</td>
                          <td className="px-4 py-4">{c.companyName}</td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-2">
                              <Phone size={14} className="text-slate-400" /> {c.phone1}
                            </span>
                          </td>
                          <td className="px-4 py-4">{labelize(c.basicType)}</td>
                          <td className="px-4 py-4 font-bold text-slate-900">{fmtMoney(c.totalCost)}</td>
                          <td className={`px-4 py-4 font-semibold ${c.balance > 0 ? "text-red-500" : "text-emerald-600"}`}>
                            {fmtMoney(c.balance)}
                          </td>
                          <td className="px-4 py-4">
                            <Badge className={TIER_BADGE[c.tier]}>{labelize(c.tier)}</Badge>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                          <td className="px-4 py-4">
                            {canManage && (
                              <IconButton onClick={() => navigate(`/edit-client/${c._id}`)} aria-label="Edit customer">
                                <Pencil size={16} />
                              </IconButton>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <Pagination page={page} perPage={PER_PAGE} total={shown.length} onChange={setPage} />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
