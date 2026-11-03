import { useEffect, useState } from "react";
import { Download, Plus, Send, Clock, Handshake, FolderKanban, XCircle, Percent, Wallet, Presentation, IndianRupee, Timer, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Card, Spinner, EmptyState, GhostButton, PrimaryButton, SearchBox } from "../components/ui";
import { KpiCard } from "../components/finance/bits";
import { THEAD, TROW } from "../components/finance/helpers";
import { DateFilter, Segmented, Pill } from "../components/analytics/parts";
import { daysAgo, localYmd } from "../components/analytics/helpers";
import { fmtMoney, fmtShort, fmtDate, downloadCsv, labelize } from "../utils/format";
import { sourceLabel } from "../constants/leadSources";
import { can, homePath } from "../utils/permissions";

const STATUS_TONE = { PROJECT: "green", SALES: "violet", QUOTATION_SENT: "amber", LOST: "red" };
const shortDay = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

export default function Reports() {
  const navigate = useNavigate();
  const canManage = can("leads.manage");
  const [tab, setTab] = useState("quotation");
  const [range, setRange] = useState({ from: daysAgo(new Date().getDate() - 1), to: localYmd() });
  const [loading, setLoading] = useState(false);
  const [quotation, setQuotation] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!range.from || !range.to) return;
    setLoading(true);

    const params = { from: range.from, to: range.to };
    const request =
      tab === "quotation"
        ? api.get("/reports/quotations", { params }).then((r) => setQuotation(r.data))
        : api.get("/reports/employees", { params }).then((r) => setEmployees(r.data.rows || []));

    request
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to load report"))
      .finally(() => setLoading(false));
  }, [tab, range]);

  useEffect(() => setSearch(""), [tab]);

  const q = search.trim().toLowerCase();
  const qRows = (quotation?.rows || []).filter(
    (r) => !q || `${r.name} ${r.company || ""}`.toLowerCase().includes(q),
  );
  const eRows = employees.filter((e) => !q || `${e.name} ${e.designation || ""}`.toLowerCase().includes(q));

  const exportCsv = () => {
    if (tab === "quotation") {
      downloadCsv(`quotation-report-${range.from}-to-${range.to}.csv`, [
        ["Lead", "Company", "Source", "Quotation date", "Status", "Project value"],
        ...qRows.map((r) => [r.name, r.company || "", r.standalone ? `Quotation ${r.number}` : sourceLabel(r.source), r.quotationSentAt ? fmtDate(r.quotationSentAt) : "", labelize(r.status), r.projectValue || ""]),
      ]);
    } else {
      downloadCsv(`employee-report-${range.from}-to-${range.to}.csv`, [
        ["Employee", "Designation", "Demos", "Online", "Offline", "Demo spend", "Marketing hrs", "Project hrs", "Support hrs", "Total cost"],
        ...eRows.map((e) => [e.name, e.designation || "", e.demos, e.onlineDemos, e.offlineDemos, e.demoSpend, e.marketingHours, e.projectHours, e.supportHours, e.totalCost]),
      ]);
    }
  };

  const noData = tab === "quotation" ? !quotation?.rows?.length : !employees.length;
  const s = quotation?.summary;
  const empTotal = (k) => employees.reduce((sum, e) => sum + (Number(e[k]) || 0), 0);

  return (
    <Layout>
      <div className={`space-y-6 ${loading ? "opacity-60 transition-opacity" : ""}`}>
        <PageHeader
          title="Date-wise Reports"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Reports" }, { label: "Date-wise Reports" }]}
          actions={
            <>
              {canManage && <PrimaryButton onClick={() => navigate("/quotations/new")}><Plus size={18} /> Add Quotation</PrimaryButton>}
              <GhostButton onClick={exportCsv} disabled={noData}><Download size={18} /> Download CSV</GhostButton>
            </>
          }
        />
        <p className="text-sm text-slate-500 -mt-2">Quotation and employee activity between the selected dates.</p>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[{ value: "quotation", label: "Quotation based" }, { value: "employee", label: "Employee based" }]}
          />
        </div>

        <DateFilter from={range.from} to={range.to} onApply={(from, to) => setRange({ from, to })} />

        {loading && !quotation && tab === "quotation" ? <Spinner /> : null}

        {tab === "quotation" && s && (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Quotations Sent" value={s.sent} icon={<Send size={26} />} />
              <KpiCard label="Pending" value={s.pending} icon={<Clock size={26} />} tone="amber" />
              <KpiCard label="Converted to Sales" value={s.toSales} icon={<Handshake size={26} />} tone="cyan" />
              <KpiCard label="Converted to Project" value={s.toProject} icon={<FolderKanban size={26} />} tone="green" />
              <KpiCard label="Lost" value={s.lost} icon={<XCircle size={26} />} tone="red" />
              <KpiCard label="Conversion" value={`${s.conversionPercent}%`} icon={<Percent size={26} />} />
              <KpiCard label="Value Won" value={fmtShort(s.valueWon)} icon={<Wallet size={26} />} tone="green" hint={fmtMoney(s.valueWon)} />
            </div>

            {quotation.daily.length > 0 && (
              <Card title="Quotations per Day">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={quotation.daily.map((d) => ({ label: shortDay(d.date), sent: d.sent }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" interval="preserveStartEnd" minTickGap={20} />
                      <YAxis allowDecimals={false} width={40} />
                      <Tooltip />
                      <Bar dataKey="sent" name="Quotations" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
                <span className="text-lg font-semibold text-slate-900">Quotations</span>
                <div className="sm:w-72"><SearchBox value={search} onChange={setSearch} placeholder="Search lead or company..." /></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-200 text-left">
                  <thead>
                    <tr className={THEAD}>
                      <th className="p-4">Lead</th>
                      <th className="p-4">Source</th>
                      <th className="p-4">Quotation Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Project Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qRows.map((r) => (
                      <tr
                        key={r._id}
                        className={`${TROW} cursor-pointer`}
                        onClick={() => navigate(r.standalone ? `/quotations/${r._id}` : `/leads/${r._id}`)}
                      >
                        <td className="p-4">
                          <p className="font-semibold text-slate-900">{r.name}</p>
                          <p className="text-sm text-slate-500">{r.company || "-"}</p>
                        </td>
                        <td className="p-4">{r.standalone ? <span className="text-slate-500">Quotation {r.number}</span> : sourceLabel(r.source)}</td>
                        <td className="p-4">{r.quotationSentAt ? fmtDate(r.quotationSentAt) : "-"}</td>
                        <td className="p-4"><Pill tone={STATUS_TONE[r.status] || "slate"}>{labelize(r.status)}</Pill></td>
                        <td className="p-4 text-right font-semibold">{r.projectValue ? fmtMoney(r.projectValue) : "-"}</td>
                      </tr>
                    ))}
                    {!qRows.length && (
                      <tr><td colSpan={5}><EmptyState>{quotation.rows.length ? "No lead matches." : "No quotations in this date range."}</EmptyState></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === "employee" && !(loading && !employees.length) && (
          <>
            {employees.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard label="Employees Active" value={employees.length} icon={<Users size={26} />} />
                <KpiCard label="Demos" value={empTotal("demos")} icon={<Presentation size={26} />} tone="cyan" hint={`${empTotal("onlineDemos")} online · ${empTotal("offlineDemos")} offline`} />
                <KpiCard label="Marketing Hours" value={empTotal("marketingHours")} icon={<Timer size={26} />} tone="amber" hint={`Demo spend ${fmtMoney(empTotal("demoSpend"))}`} />
                <KpiCard label="Total Cost" value={fmtShort(empTotal("totalCost"))} icon={<IndianRupee size={26} />} tone="red" hint={fmtMoney(empTotal("totalCost"))} />
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
                <span className="text-lg font-semibold text-slate-900">Employee Activity</span>
                <div className="sm:w-72"><SearchBox value={search} onChange={setSearch} placeholder="Search employee..." /></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-250 text-left">
                  <thead>
                    <tr className={THEAD}>
                      <th className="p-4">Employee</th>
                      <th className="p-4">Demos (on / off)</th>
                      <th className="p-4">Demo Spend</th>
                      <th className="p-4">Marketing Hrs</th>
                      <th className="p-4">Project Hrs*</th>
                      <th className="p-4">Support Hrs</th>
                      <th className="p-4 text-right">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eRows.map((e) => (
                      <tr key={e._id} className={TROW}>
                        <td className="p-4">
                          <p className="font-semibold text-slate-900">{e.name}</p>
                          <p className="text-sm text-slate-500">{e.designation || "-"}</p>
                        </td>
                        <td className="p-4">{e.demos} <span className="text-slate-400">({e.onlineDemos} / {e.offlineDemos})</span></td>
                        <td className="p-4">{fmtMoney(e.demoSpend)}</td>
                        <td className="p-4">{e.marketingHours}</td>
                        <td className="p-4">{e.projectHours}</td>
                        <td className="p-4">{e.supportHours}</td>
                        <td className="p-4 text-right font-semibold">{fmtMoney(e.totalCost)}</td>
                      </tr>
                    ))}
                    {!eRows.length && (
                      <tr><td colSpan={7}><EmptyState>{employees.length ? "No employee matches." : "No employee activity in this date range."}</EmptyState></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              * Project hours are counted for projects started in the selected dates, because project time is
              saved without a date. Total cost = marketing + project + support (salary based).
            </p>
          </>
        )}

        <p className="text-xs text-slate-400">Period: {fmtDate(range.from)} to {fmtDate(range.to)}</p>
      </div>
    </Layout>
  );
}
