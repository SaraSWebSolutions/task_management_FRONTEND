import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, EllipsisVertical, Clock, Users, IndianRupee, TrendingUp, Flag } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, StatCard, Badge, Spinner, PrimaryButton } from "../components/ui";
import { LEAD_STATUSES, priorityMeta } from "../constants/crm";
import { fmtMoney } from "../utils/format";
import { can, homePath } from "../utils/permissions";

const daysSince = (d) => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000));

export default function LeadPipeline() {
  const navigate = useNavigate();
  const canManage = can("leads.manage");

  const [data, setData] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const menuRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/crm/pipeline");
      setData(res.data);
    } catch {
      toast.error("Failed to load pipeline");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Close the card menu on outside click.
  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuId(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const columns = useMemo(
    () =>
      LEAD_STATUSES.map((s) => ({
        ...s,
        leads: (data?.leads || []).filter((l) => l.status === s.value),
      })),
    [data],
  );

  // Moves that need extra details (demo setup, project creation) open the lead.
  const moveTo = async (lead, target) => {
    if (!canManage || lead.status === target) return;

    try {
      if (target === "NEW" || target === "LOST") {
        await api.patch(`/crm/pipeline/${lead._id}/stage`, { status: target });
      } else if (target === "QUOTATION_SENT") {
        await api.post(`/leads/${lead._id}/quotation`);
      } else if (target === "SALES") {
        await api.post(`/leads/${lead._id}/convert-sales`);
      } else {
        toast("Open the lead to complete this step", { icon: "ℹ️" });
        navigate(`/leads/${lead._id}`);
        return;
      }
      toast.success(`Moved to ${LEAD_STATUSES.find((s) => s.value === target).label}`);
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not move lead");
    }
  };

  const onDrop = (target) => {
    const lead = data?.leads.find((l) => l._id === dragId);
    setDragId(null);
    setOverCol(null);
    if (lead) moveTo(lead, target);
  };

  const stats = data?.stats;

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Lead Pipeline"
          breadcrumbs={[
            { label: "Home", to: homePath() },
            { label: "Apps" },
            { label: "CRM" },
            { label: "Lead Pipeline" },
          ]}
          actions={
            canManage && (
              <PrimaryButton onClick={() => navigate("/add-lead")}>
                <Plus size={18} /> Add Lead
              </PrimaryButton>
            )
          }
        />

        {!data ? (
          <Spinner />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Leads"
                value={stats.totalLeads}
                hint={`+${stats.newThisWeek} this week`}
                icon={<Users size={26} />}
              />
              <StatCard label="Pipeline Value" value={fmtMoney(stats.pipelineValue)} icon={<IndianRupee size={26} />} tone="green" />
              <StatCard label="Won Value" value={fmtMoney(stats.wonValue)} icon={<TrendingUp size={26} />} tone="amber" />
              <StatCard label="Win Rate" value={`${stats.winRate}%`} icon={<Flag size={26} />} tone="indigo" />
            </div>

            <div className="flex gap-5 overflow-x-auto pb-4 items-start">
              {columns.map((col) => (
                <div
                  key={col.value}
                  onDragOver={(e) => {
                    if (!canManage) return;
                    e.preventDefault();
                    setOverCol(col.value);
                  }}
                  onDragLeave={() => setOverCol((c) => (c === col.value ? null : c))}
                  onDrop={() => onDrop(col.value)}
                  className={`w-80 shrink-0 rounded-2xl p-2 transition ${
                    overCol === col.value ? "bg-brand-soft/60" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 px-2 pb-4">
                    <span className="h-3 w-3 rounded-full" style={{ background: col.color }} />
                    <span className="font-semibold text-slate-900">{col.label}</span>
                    <span className="ml-1 rounded-md bg-brand-soft px-2 py-0.5 text-sm font-semibold text-brand">
                      {col.leads.length}
                    </span>
                  </div>

                  <div className="space-y-4 min-h-24">
                    {col.leads.map((l) => {
                      const pr = priorityMeta(l.priority);
                      return (
                        <div
                          key={l._id}
                          draggable={canManage}
                          onDragStart={() => setDragId(l._id)}
                          onDragEnd={() => {
                            setDragId(null);
                            setOverCol(null);
                          }}
                          className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-left ${
                            canManage ? "cursor-grab active:cursor-grabbing" : ""
                          } ${dragId === l._id ? "opacity-40" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              onClick={() => navigate(`/leads/${l._id}`)}
                              className="text-left text-lg font-bold text-slate-900 hover:text-brand"
                            >
                              {l.name}
                            </button>

                            <div className="relative" ref={menuId === l._id ? menuRef : null}>
                              <button
                                onClick={() => setMenuId(menuId === l._id ? null : l._id)}
                                className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
                                aria-label="Lead actions"
                              >
                                <EllipsisVertical size={16} />
                              </button>
                              {menuId === l._id && (
                                <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                                  <MenuItem onClick={() => navigate(`/leads/${l._id}`)}>View details</MenuItem>
                                  {canManage && (
                                    <>
                                      <MenuItem onClick={() => navigate(`/edit-lead/${l._id}`)}>Edit lead</MenuItem>
                                      {l.status === "LOST" ? (
                                        <MenuItem onClick={() => moveTo(l, "NEW")}>Reopen lead</MenuItem>
                                      ) : (
                                        l.status !== "PROJECT" && (
                                          <MenuItem danger onClick={() => moveTo(l, "LOST")}>
                                            Mark as lost
                                          </MenuItem>
                                        )
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <p className="mt-2 text-slate-500">{l.company || "-"}</p>

                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-lg font-bold text-brand">{fmtMoney(l.value)}</span>
                            <Badge className={pr.badge}>{pr.label}</Badge>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-400">
                            <span className="truncate">{l.assignedTo?.name || ""}</span>
                            <span className="inline-flex items-center gap-1.5 shrink-0">
                              <Clock size={14} /> {daysSince(l.createdAt)}d
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {col.leads.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                        No leads
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function MenuItem({ children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${
        danger ? "text-red-600" : "text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}
