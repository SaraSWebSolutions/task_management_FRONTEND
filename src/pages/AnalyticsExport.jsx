import { useState } from "react";
import { Download, FileSpreadsheet, Database } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Card, Spinner, EmptyState, GhostButton, PrimaryButton, Field, inputClass } from "../components/ui";
import { apiError } from "../components/finance/helpers";
import { ErrorNote } from "../components/analytics/parts";
import { useAnalytics, downloadXlsx, toRows } from "../components/analytics/helpers";
import { downloadCsv } from "../utils/format";
import { homePath } from "../utils/permissions";

export default function AnalyticsExport() {
  const meta = useAnalytics("/analytics/datasets");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState("");

  const download = async (d, kind) => {
    if (from && to && to < from) return toast.error("End date can't be before the start date");
    try {
      setBusy(`${d.key}-${kind}`);
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const { data } = await api.get(`/analytics/dataset/${d.key}`, { params });
      if (!data.rows.length) return toast("Nothing to export for these dates");
      const rows = toRows(data.columns, data.rows);
      const name = `${d.key}${from || to ? `-${from || "start"}-to-${to || "today"}` : ""}`;
      if (kind === "csv") downloadCsv(`${name}.csv`, rows);
      else downloadXlsx(`${name}.xlsx`, rows, d.label);
      toast.success(`${data.rows.length} rows exported${data.truncated ? " (first 5,000 only)" : ""}`);
    } catch (error) {
      toast.error(apiError(error, "Export failed"));
    } finally {
      setBusy("");
    }
  };

  const crumbs = [{ label: "Home", to: homePath() }, { label: "Reports" }, { label: "Export Data" }];

  if (!meta.data) {
    return (
      <Layout>
        <PageHeader title="Export Data" breadcrumbs={crumbs} />
        {meta.error ? <ErrorNote message={meta.error} /> : <Spinner />}
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader title="Export Data" breadcrumbs={crumbs} />
        <p className="text-sm text-slate-500 -mt-2">Download your records as CSV or Excel. You only see the data sets your role can open. Salary, bank details and hourly rates are never included.</p>

        <Card title="Date range" subtitle="Optional. Limits each data set by its own date (created, issued, paid...). Leave empty to export everything.">
          <div className="grid gap-5 sm:grid-cols-2 max-w-xl">
            <Field label="From"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} /></Field>
            <Field label="To"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} /></Field>
          </div>
        </Card>

        {meta.data.datasets.length === 0 ? <Card><EmptyState>You don&apos;t have access to any data sets yet.</EmptyState></Card> : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {meta.data.datasets.map((d) => (
              <div key={d.key} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center"><Database size={22} /></span>
                  <div><p className="text-lg font-bold text-slate-900">{d.label}</p><p className="text-sm text-slate-500">{d.columns.length} columns</p></div>
                </div>
                <p className="mt-4 text-sm text-slate-500 flex-1">{d.columns.slice(0, 5).map((c) => c.label).join(", ")}{d.columns.length > 5 ? "..." : ""}</p>
                <div className="mt-5 flex gap-3">
                  <GhostButton className="flex-1 justify-center" disabled={!!busy} onClick={() => download(d, "csv")}><Download size={16} /> {busy === `${d.key}-csv` ? "..." : "CSV"}</GhostButton>
                  <PrimaryButton className="flex-1 justify-center" disabled={!!busy} onClick={() => download(d, "xlsx")}><FileSpreadsheet size={16} /> {busy === `${d.key}-xlsx` ? "..." : "Excel"}</PrimaryButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
