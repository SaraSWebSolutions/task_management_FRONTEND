import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, Users, UserPlus, Hourglass, Trophy, Mail } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import LeadDrawer from "../components/leads/LeadDrawer";
import api from "../api/axios";
import {
  PageHeader,
  StatCard,
  Badge,
  Spinner,
  EmptyState,
  PrimaryButton,
  Pagination,
  SearchBox,
  IconButton,
  inputClass,
} from "../components/ui";
import { LEAD_STATUSES, statusMeta } from "../constants/crm";
import { LEAD_SOURCES, sourceLabel } from "../constants/leadSources";
import { fmtDate, fmtMoney } from "../utils/format";
import { can, homePath } from "../utils/permissions";

const PER_PAGE = 10;
const ACTIVE = ["NEW", "DEMO_SCHEDULED", "QUOTATION_SENT"];
const CONVERTED = ["SALES", "PROJECT"];

export default function Leads() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { id: editId } = useParams();
  const canManage = can("leads.manage");

  // /add-lead and /edit-lead/:id open the slide-over drawer on top of this list.
  const drawerOpen = pathname.replace(/\/+$/, "") === "/add-lead" || Boolean(editId);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [page, setPage] = useState(1);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    api
      .get("/leads")
      .then((res) => setLeads(res.data.leads || []))
      .catch(() => toast.error("Failed to load leads"))
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const closeDrawer = useCallback(() => navigate("/leads"), [navigate]);
  const onSaved = useCallback(() => {
    navigate("/leads");
    setReloadKey((k) => k + 1);
  }, [navigate]);

  const remove = async (id) => {
    if (!window.confirm("Delete this lead?")) return;
    try {
      await api.delete(`/leads/${id}`);
      toast.success("Lead deleted");
      setLeads((prev) => prev.filter((l) => l._id !== id));
    } catch {
      toast.error("Failed to delete lead");
    }
  };

  const stats = useMemo(
    () => ({
      total: leads.length,
      fresh: leads.filter((l) => l.status === "NEW").length,
      active: leads.filter((l) => ACTIVE.includes(l.status) && l.status !== "NEW").length,
      converted: leads.filter((l) => CONVERTED.includes(l.status)).length,
    }),
    [leads],
  );

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter(
      (l) =>
        (status === "ALL" || l.status === status) &&
        (source === "ALL" || l.source === source) &&
        (!q || [l.name, l.email, l.company, l.phone].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [leads, search, status, source]);

  const pageRows = shown.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Any filter change goes back to page 1.
  const onFilter = (setter) => (v) => {
    setter(v);
    setPage(1);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Leads"
          breadcrumbs={[
            { label: "Home", to: homePath() },
            { label: "Apps" },
            { label: "CRM" },
            { label: "Leads" },
          ]}
          actions={
            canManage && (
              <PrimaryButton onClick={() => navigate("/add-lead")}>
                <Plus size={18} /> Add Lead
              </PrimaryButton>
            )
          }
        />

        <div className="grid gap-3 sm:gap-5 grid-cols-1 min-[420px]:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Leads" value={stats.total} icon={<Users size={26} />} />
          <StatCard label="New Leads" value={stats.fresh} icon={<UserPlus size={26} />} tone="green" />
          <StatCard label="Demo / Quotation" value={stats.active} icon={<Hourglass size={26} />} tone="amber" />
          <StatCard label="Converted" value={stats.converted} icon={<Trophy size={26} />} tone="indigo" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-5 flex flex-col lg:flex-row gap-3 sm:gap-4">
          <SearchBox value={search} onChange={onFilter(setSearch)} placeholder="Search leads..." />
          <select value={status} onChange={(e) => onFilter(setStatus)(e.target.value)} className={`${inputClass} lg:w-56`}>
            <option value="ALL">All Status</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select value={source} onChange={(e) => onFilter(setSource)(e.target.value)} className={`${inputClass} lg:w-56`}>
            <option value="ALL">All Sources</option>
            {LEAD_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div role="heading" aria-level={2} className="text-lg font-semibold text-slate-900">
              All Leads
            </div>
            <span className="text-slate-500">{shown.length} leads found</span>
          </div>

          {loading ? (
            <Spinner />
          ) : shown.length === 0 ? (
            <EmptyState>No leads found.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {[
                      ["Name", ""],
                      ["Company", "hidden lg:table-cell"],
                      ["Email", "hidden xl:table-cell"],
                      ["Phone", "hidden 2xl:table-cell"],
                      ["Source", "hidden md:table-cell"],
                      ["Status", ""],
                      ["Value", "hidden sm:table-cell"],
                      ["Assigned To", "hidden xl:table-cell"],
                      ["Date", "hidden 2xl:table-cell"],
                      ["Actions", ""],
                    ].map(([h, cls]) => (
                      <th key={h} className={`px-3 py-3 ${cls}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((l) => {
                    const meta = statusMeta(l.status);
                    return (
                      <tr key={l._id} className="border-t border-slate-100 hover:bg-slate-50/60 text-slate-700">
                        <td className="px-3 py-3 font-semibold text-slate-900">
                          {l.name}
                          <span className="block text-[13px] font-normal text-slate-500 xl:hidden truncate max-w-[14rem]">{l.email}</span>
                        </td>
                        <td className="px-3 py-3 hidden lg:table-cell">{l.company || "-"}</td>
                        <td className="px-3 py-3 hidden xl:table-cell">
                          <span className="inline-flex items-center gap-2">
                            <Mail size={14} className="text-slate-400" /> {l.email}
                          </span>
                        </td>
                        <td className="px-3 py-3 hidden 2xl:table-cell">{l.phone || "-"}</td>
                        <td className="px-3 py-3 hidden md:table-cell">{sourceLabel(l.source)}</td>
                        <td className="px-3 py-3">
                          <Badge className={`${meta.badge} !text-xs whitespace-nowrap`}>{meta.label}</Badge>
                        </td>
                        <td className="px-3 py-3 font-bold text-slate-900 hidden sm:table-cell">{fmtMoney(l.value)}</td>
                        <td className="px-3 py-3 hidden xl:table-cell">{l.assignedTo?.name || "-"}</td>
                        <td className="px-3 py-3 whitespace-nowrap hidden 2xl:table-cell">{fmtDate(l.createdAt)}</td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1.5">
                            <IconButton onClick={() => navigate(`/leads/${l._id}`)} aria-label="View">
                              <Eye size={16} />
                            </IconButton>
                            {canManage && (
                              <>
                                <IconButton onClick={() => navigate(`/edit-lead/${l._id}`)} aria-label="Edit">
                                  <Pencil size={16} />
                                </IconButton>
                                <IconButton tone="danger" onClick={() => remove(l._id)} aria-label="Delete">
                                  <Trash2 size={16} />
                                </IconButton>
                              </>
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

          <Pagination page={page} perPage={PER_PAGE} total={shown.length} onChange={setPage} />
        </div>
      </div>

      {drawerOpen && (
        <LeadDrawer key={editId || "new"} leadId={editId} onClose={closeDrawer} onSaved={onSaved} />
      )}
    </Layout>
  );
}
