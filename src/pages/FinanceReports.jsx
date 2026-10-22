import { useEffect, useState } from "react";
import { Download, FileText, Percent, Wallet, Scale, Hourglass, Printer } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Card, Spinner, GhostButton, PrimaryButton, Field, inputClass } from "../components/ui";
import { KpiCard } from "../components/finance/bits";
import { moneyTick, apiError, THEAD, TROW } from "../components/finance/helpers";
import { fmtMoney, fmtDate, fmtShort, toDateInput } from "../utils/format";
import { homePath } from "../utils/permissions";

const yearStartInput = () => `${new Date().getFullYear()}-01-01`;

export default function FinanceReports() {
  const [from, setFrom] = useState(yearStartInput());
  const [to, setTo] = useState(toDateInput(new Date()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async (f = from, t = to) => {
    if (!f || !t) return toast.error("Choose both dates");
    if (t < f) return toast.error("End date can't be before the start date");
    try {
      setLoading(true);
      const res = await api.get("/finance/reports", { params: { from: f, to: t } });
      setData(res.data);
    } catch (error) {
      toast.error(apiError(error, "Failed to generate report"));
      setData((d) => d || { kpis: {}, pnl: { expenses: [] }, chart: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { generate(); /* first load only */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const k = data?.kpis || {};
  const p = data?.pnl;

  // Table rows shared by the screen, Excel and print.
  const lines = p
    ? [
        ["Revenue (payments received)", p.revenue, "head"],
        ["Team cost (logged time x hourly rate)", -p.teamCost, "sub"],
        ["Gross Profit", p.grossProfit, "total"],
        ...p.expenses.map((e) => [e.category, -e.amount, "sub"]),
        ["Total Operating Expenses", -p.totalExpenses, "total"],
        ["Net Profit", p.netProfit, "grand"],
      ]
    : [];

  const rangeLabel = data ? `${fmtDate(data.range.from)} to ${fmtDate(data.range.to)}` : "";

  const exportExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([["Profit & Loss", rangeLabel], [], ["Item", "Amount (INR)"], ...lines.map(([a, b]) => [a, b])]);
    ws["!cols"] = [{ wch: 42 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Profit & Loss");
    XLSX.writeFile(wb, `profit-loss-${from}-to-${to}.xlsx`);
  };

  const exportPdf = () => {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return toast.error("Allow pop-ups to export");
    const rows = lines
      .map(([a, b, t]) => `<tr class="${t}"><td>${a.replace(/&/g, "&amp;")}</td><td class="r">${b < 0 ? "-" : ""}${fmtMoney(Math.abs(b))}</td></tr>`)
      .join("");
    w.document.write(`<html><head><title>Profit & Loss</title><style>
      body{font-family:Arial,sans-serif;padding:40px;color:#0f172a;max-width:720px;margin:auto} h1{margin:0}
      p{color:#64748b} table{width:100%;border-collapse:collapse;margin-top:24px} td{padding:10px;border-bottom:1px solid #e2e8f0}
      .r{text-align:right} .total td,.grand td{font-weight:bold} .grand td{font-size:18px;border-top:2px solid #0f172a} .sub td:first-child{padding-left:28px}
    </style></head><body><h1>Profit & Loss</h1><p>${rangeLabel}</p><table>${rows}</table></body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Finance Reports"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Finance" }, { label: "Reports" }]}
          actions={
            <>
              <GhostButton onClick={exportPdf} disabled={!p}><Printer size={18} /> Export PDF</GhostButton>
              <PrimaryButton onClick={exportExcel} disabled={!p}><Download size={18} /> Export Excel</PrimaryButton>
            </>
          }
        />

        <Card title="Generate Report" subtitle="Profit & Loss on a cash basis for the dates you choose">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <Field label="Start date"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} /></Field>
            <Field label="End date"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} /></Field>
            <PrimaryButton disabled={loading} onClick={() => generate()}><FileText size={18} /> {loading ? "Generating..." : "Generate"}</PrimaryButton>
          </div>
        </Card>

        {!data ? <Spinner /> : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Gross Margin" value={`${k.grossMargin || 0}%`} icon={<Percent size={26} />} hint="(Revenue - team cost) / revenue" />
              <KpiCard label="Net Profit Margin" value={`${k.netMargin || 0}%`} icon={<Scale size={26} />} tone="green" hint="Net profit / revenue" />
              <KpiCard label="Net Profit" value={fmtShort(k.netProfit)} icon={<Wallet size={26} />} tone="cyan" hint={k.netProfit < 0 ? "Loss in this period" : undefined} />
              <KpiCard label="Receivables" value={fmtShort(k.receivables)} icon={<Hourglass size={26} />} tone="amber" hint={`${fmtShort(k.overdue)} overdue`} />
            </div>

            <Card title={`Revenue vs Expenses (${data.chartYear})`} subtitle="Expenses include team cost from time tracking">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={moneyTick} width={70} />
                    <Tooltip formatter={(v) => fmtMoney(v)} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <span className="text-lg font-semibold text-slate-900">Profit & Loss Summary</span>
                <span className="ml-3 text-sm text-slate-500">{rangeLabel}</span>
              </div>
              <table className="w-full text-left">
                <thead><tr className={THEAD}><th className="p-4">Item</th><th className="p-4 text-right">Amount</th></tr></thead>
                <tbody>
                  {lines.map(([label, amount, kind]) => (
                    <tr key={label} className={`${TROW} ${kind === "grand" ? "bg-slate-50" : ""}`}>
                      <td className={`p-4 ${kind === "sub" ? "pl-10 text-slate-600" : "font-semibold text-slate-900"}`}>{label}</td>
                      <td className={`p-4 text-right ${kind === "sub" ? "text-slate-600" : "font-semibold"} ${kind === "grand" ? (amount >= 0 ? "text-emerald-600 text-lg" : "text-red-600 text-lg") : ""} ${kind === "head" ? "text-brand" : ""}`}>
                        {amount < 0 ? "-" : ""}{fmtMoney(Math.abs(amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
