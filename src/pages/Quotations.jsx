import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Spinner, EmptyState, PrimaryButton, SearchBox, IconButton } from "../components/ui";
import { Pill } from "../components/analytics/parts";
import { THEAD, TROW } from "../components/finance/helpers";
import { fmtMoney, fmtDate } from "../utils/format";
import { can, homePath } from "../utils/permissions";

export default function Quotations() {
  const navigate = useNavigate();
  const canManage = can("leads.manage");
  const [rows, setRows] = useState(null);
  const [search, setSearch] = useState("");

  const load = () =>
    api
      .get("/quotations")
      .then((r) => setRows(r.data.quotations))
      .catch((e) => {
        toast.error(e?.response?.data?.message || "Failed to load quotations");
        setRows([]);
      });

  useEffect(() => {
    load();
  }, []);

  const q = search.trim().toLowerCase();
  const list = (rows || []).filter(
    (r) => !q || `${r.number} ${r.customer?.name} ${r.customer?.company || ""}`.toLowerCase().includes(q),
  );

  const remove = async (r) => {
    if (!window.confirm(`Delete quotation ${r.number}?`)) return;
    try {
      await api.delete(`/quotations/${r._id}`);
      toast.success("Quotation deleted");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Quotations"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "CRM" }, { label: "Quotations" }]}
          actions={canManage && <PrimaryButton onClick={() => navigate("/quotations/new")}><Plus size={18} /> Add Quotation</PrimaryButton>}
        />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
            <span className="text-lg font-semibold text-slate-900">All Quotations</span>
            <div className="sm:w-72"><SearchBox value={search} onChange={setSearch} placeholder="Search number or customer..." /></div>
          </div>

          {!rows ? <Spinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-175 text-left">
                <thead>
                  <tr className={THEAD}>
                    <th className="p-4">Number</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Total</th>
                    <th className="p-4 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r._id} className={`${TROW} cursor-pointer`} onClick={() => navigate(`/quotations/${r._id}`)}>
                      <td className="p-4 font-semibold text-brand">{r.number}</td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-900">{r.customer?.name}</p>
                        <p className="text-sm text-slate-500">{r.customer?.company || "-"}</p>
                        {r.lead && (
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/leads/${r.lead}`); }}
                            className="mt-1 text-xs font-semibold text-brand underline"
                          >
                            Open lead
                          </button>
                        )}
                      </td>
                      <td className="p-4">{fmtDate(r.date)}</td>
                      <td className="p-4"><Pill tone={r.status === "SENT" ? "green" : "slate"}>{r.status === "SENT" ? "Shared" : "Draft"}</Pill></td>
                      <td className="p-4 text-right font-semibold">{fmtMoney(r.total)}</td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        {canManage && <IconButton tone="danger" aria-label="Delete quotation" onClick={() => remove(r)}><Trash2 size={15} /></IconButton>}
                      </td>
                    </tr>
                  ))}
                  {!list.length && (
                    <tr><td colSpan={6}><EmptyState>{rows.length ? "No quotation matches." : "No quotations yet. Click Add Quotation to make one."}</EmptyState></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
