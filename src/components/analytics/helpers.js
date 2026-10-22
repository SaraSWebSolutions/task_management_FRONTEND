import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import api from "../../api/axios";

// Local calendar date as YYYY-MM-DD (toISOString would shift it to UTC)
export const localYmd = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

export const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localYmd(d);
};

export const yearStartYmd = () => `${new Date().getFullYear()}-01-01`;

export const downloadXlsx = (filename, rows, sheet = "Data") => {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet.slice(0, 31));
  XLSX.writeFile(wb, filename);
};

// Dataset response -> [[header...], [row...]] for the chosen columns
export const toRows = (columns, rows) => [
  columns.map((c) => c.label),
  ...rows.map((r) => columns.map((c) => r[c.key] ?? "")),
];

// GET with params. Keeps the last good data on screen while a new range loads.
export function useAnalytics(path, params = {}) {
  const key = JSON.stringify(params);
  const [res, setRes] = useState({ key: null, data: null, error: null });

  useEffect(() => {
    let alive = true;
    api
      .get(path, { params: JSON.parse(key) })
      .then((r) => alive && setRes({ key, data: r.data, error: null }))
      .catch((e) => {
        if (!alive) return;
        const denied = e?.response?.status === 403;
        setRes((s) => ({
          key,
          data: s.data,
          error: denied ? "You don't have access to this data." : e?.response?.data?.message || "Failed to load",
        }));
      });
    return () => { alive = false; };
  }, [path, key]);

  return { data: res.data, error: res.key === key ? res.error : null, loading: res.key !== key };
}
