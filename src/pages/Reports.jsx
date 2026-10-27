import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import toast from "react-hot-toast";
import { money } from "./Projects";
import { sourceLabel } from "../constants/leadSources";

const monthStart = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1)).toISOString().slice(0, 10);
};
const todayStr = () => new Date().toISOString().slice(0, 10);
const nice = (s) =>
  s ? s.charAt(0) + s.slice(1).toLowerCase().replaceAll("_", " ") : "-";
const dateOf = (d) => (d ? new Date(d).toLocaleDateString() : "-");

const inputClass =
  "border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand";

function Stat({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-4">
      <p className="text-slate-500 text-sm">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
  );
}

export default function Reports() {
  const [tab, setTab] = useState("quotation");
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(todayStr());
  const [loading, setLoading] = useState(false);
  const [quotation, setQuotation] = useState(null);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (!from || !to) return;
    setLoading(true);

    const request =
      tab === "quotation"
        ? api.get("/reports/quotations", { params: { from, to } }).then((r) => setQuotation(r.data))
        : api.get("/reports/employees", { params: { from, to } }).then((r) => setEmployees(r.data.rows || []));

    request
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to load report"))
      .finally(() => setLoading(false));
  }, [tab, from, to]);

  const tabBtn = (key, text) => (
    <button
      onClick={() => setTab(key)}
      className={`rounded-xl px-5 py-2.5 text-sm font-medium transition ${
        tab === key ? "bg-brand text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {text}
    </button>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border shadow-sm p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Reports</h1>
            <p className="text-slate-500 mt-1">Date wise quotation and employee reports</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
            <span className="text-slate-500">to</span>
            <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="flex gap-3">
          {tabBtn("quotation", "Quotation based")}
          {tabBtn("employee", "Employee based")}
        </div>

        {loading && <p className="text-center text-slate-500">Loading...</p>}

        {!loading && tab === "quotation" && quotation && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat label="Quotations sent" value={quotation.summary.sent} />
              <Stat label="Pending" value={quotation.summary.pending} />
              <Stat label="Converted to sales" value={quotation.summary.toSales} />
              <Stat label="Converted to project" value={quotation.summary.toProject} />
              <Stat label="Lost" value={quotation.summary.lost} />
              <Stat label="Conversion" value={`${quotation.summary.conversionPercent}%`} />
              <Stat label="Value won" value={money(quotation.summary.valueWon)} />
            </div>

            {quotation.daily.length > 0 && (
              <div className="bg-white rounded-3xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-3">Quotations per day</h2>
                <div className="flex flex-wrap gap-2">
                  {quotation.daily.map((d) => (
                    <span key={d.date} className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm">
                      {dateOf(d.date)}: <b>{d.sent}</b>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl border shadow-sm overflow-x-auto">
              <table className="min-w-200 w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 font-semibold">
                    <th className="p-4 text-left">Lead</th>
                    <th className="p-4 text-center">Source</th>
                    <th className="p-4 text-center">Quotation date</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Project value</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.rows.map((r) => (
                    <tr key={r._id} className="border-t">
                      <td className="p-4">
                        <p className="font-medium text-slate-800">{r.name}</p>
                        <p className="text-slate-500">{r.company || "-"}</p>
                      </td>
                      <td className="p-4 text-center">{sourceLabel(r.source)}</td>
                      <td className="p-4 text-center">{dateOf(r.quotationSentAt)}</td>
                      <td className="p-4 text-center">{nice(r.status)}</td>
                      <td className="p-4 text-right">{r.projectValue ? money(r.projectValue) : "-"}</td>
                    </tr>
                  ))}
                  {quotation.rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No quotations in this date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && tab === "employee" && (
          <>
            <div className="bg-white rounded-3xl border shadow-sm overflow-x-auto">
              <table className="min-w-250 w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 font-semibold">
                    <th className="p-4 text-left">Employee</th>
                    <th className="p-4 text-center">Demos (on / off)</th>
                    <th className="p-4 text-right">Demo spend</th>
                    <th className="p-4 text-center">Marketing hrs</th>
                    <th className="p-4 text-center">Project hrs*</th>
                    <th className="p-4 text-center">Support hrs</th>
                    <th className="p-4 text-right">Total cost</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e) => (
                    <tr key={e._id} className="border-t">
                      <td className="p-4">
                        <p className="font-medium text-slate-800">{e.name}</p>
                        <p className="text-slate-500">{e.designation}</p>
                      </td>
                      <td className="p-4 text-center">
                        {e.demos} ({e.onlineDemos} / {e.offlineDemos})
                      </td>
                      <td className="p-4 text-right">{money(e.demoSpend)}</td>
                      <td className="p-4 text-center">{e.marketingHours}</td>
                      <td className="p-4 text-center">{e.projectHours}</td>
                      <td className="p-4 text-center">{e.supportHours}</td>
                      <td className="p-4 text-right">{money(e.totalCost)}</td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No employee activity in this date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400">
              * Project hours are counted for projects started in the selected dates, because
              project time is saved without a date. Total cost = marketing + project + support
              (salary based).
            </p>
          </>
        )}
      </div>
    </Layout>
  );
}
