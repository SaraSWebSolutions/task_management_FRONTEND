import { useMemo, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Card, Spinner, EmptyState, GhostButton, PrimaryButton, Field, Pagination, SearchBox, inputClass } from "../components/ui";
import { THEAD, TROW, apiError } from "../components/finance/helpers";
import { ErrorNote } from "../components/analytics/parts";
import { useAnalytics, downloadXlsx, toRows } from "../components/analytics/helpers";
import { downloadCsv } from "../utils/format";
import { homePath } from "../utils/permissions";

const PER_PAGE = 20;

export default function AnalyticsCustom() {
  const meta = useAnalytics("/analytics/datasets");
  const [key, setKey] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [picked, setPicked] = useState(null); // selected column keys; null = all
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const datasets = useMemo(() => meta.data?.datasets || [], [meta.data]);
  const activeKey = key || datasets[0]?.key || "";
  const current = datasets.find((d) => d.key === activeKey);

  const run = async () => {
    if (!activeKey) return;
    if (from && to && to < from) return toast.error("End date can't be before the start date");
    try {
      setBusy(true);
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const { data } = await api.get(`/analytics/dataset/${activeKey}`, { params });
      setResult(data);
      setPage(1);
      setSearch("");
      if (data.truncated) toast("Showing the first 5,000 rows. Narrow the dates to see the rest.");
    } catch (error) {
      toast.error(apiError(error, "Failed to run report"));
    } finally {
      setBusy(false);
    }
  };

  const pickDataset = (k) => { setKey(k); setPicked(null); setResult(null); };

  const columns = useMemo(() => {
    if (!result) return [];
    return picked ? result.columns.filter((c) => picked.includes(c.key)) : result.columns;
  }, [result, picked]);

  const q = search.trim().toLowerCase();
  const rows = useMemo(
    () => (result?.rows || []).filter((r) => !q || columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(q))),
    [result, columns, q],
  );

  const toggle = (k) => {
    const all = current.columns.map((c) => c.key);
    const now = picked || all;
    const next = now.includes(k) ? now.filter((x) => x !== k) : [...now, k];
    setPicked(next.length === all.length ? null : next);
  };

  const fileBase = `${result?.label || "report"}`.toLowerCase().replace(/\s+/g, "-");

  if (!meta.data) {
    return (
      <Layout>
        <PageHeader title="Custom Reports" breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Reports" }, { label: "Custom Reports" }]} />
        {meta.error ? <ErrorNote message={meta.error} /> : <Spinner />}
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Custom Reports"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Reports" }, { label: "Custom Reports" }]}
          actions={result && meta.data.canExport && (
            <>
              <GhostButton onClick={() => downloadCsv(`${fileBase}.csv`, toRows(columns, rows))}><Download size={18} /> CSV</GhostButton>
              <PrimaryButton onClick={() => downloadXlsx(`${fileBase}.xlsx`, toRows(columns, rows), result.label)}><FileSpreadsheet size={18} /> Excel</PrimaryButton>
            </>
          )}
        />

        {datasets.length === 0 ? <Card><EmptyState>You don&apos;t have access to any data sets yet.</EmptyState></Card> : (
          <>
            <Card title="Build your report" subtitle="Pick the data, optionally limit the dates, choose the columns, then run it.">
              <div className="grid gap-5 md:grid-cols-3">
                <Field label="Data">
                  <select value={activeKey} onChange={(e) => pickDataset(e.target.value)} className={inputClass}>
                    {datasets.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
                  </select>
                </Field>
                <Field label="From" hint="Leave both empty for all time"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} /></Field>
                <Field label="To"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} /></Field>
              </div>

              {current && (
                <div className="mt-5">
                  <p className="text-sm font-semibold text-slate-800 mb-2">Columns</p>
                  <div className="flex flex-wrap gap-2">
                    {current.columns.map((c) => {
                      const on = !picked || picked.includes(c.key);
                      return (
                        <button key={c.key} onClick={() => toggle(c.key)} className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border ${on ? "bg-violet-50 border-brand text-brand" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>{c.label}</button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="mt-6"><PrimaryButton disabled={busy || !activeKey || (picked && picked.length === 0)} onClick={run}>{busy ? "Running..." : "Run Report"}</PrimaryButton></div>
            </Card>

            {result && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
                  <span className="text-lg font-semibold text-slate-900">{result.label} ({rows.length}{result.truncated ? "+" : ""})</span>
                  <div className="sm:w-72"><SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search results..." /></div>
                </div>
                {rows.length === 0 ? <EmptyState>No rows found.</EmptyState> : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead><tr className={THEAD}>{columns.map((c) => <th key={c.key} className="p-4 whitespace-nowrap">{c.label}</th>)}</tr></thead>
                        <tbody>
                          {rows.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((r, i) => (
                            <tr key={i} className={TROW}>{columns.map((c) => <td key={c.key} className="p-4 text-slate-700 whitespace-nowrap">{String(r[c.key] ?? "")}</td>)}</tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination page={page} perPage={PER_PAGE} total={rows.length} onChange={setPage} />
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
