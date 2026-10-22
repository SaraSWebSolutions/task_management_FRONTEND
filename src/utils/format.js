export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "-";

export const timeAgo = (d) => {
  if (!d) return "Never";
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(d);
};

export const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#0ea5e9", "#a855f7",
];

export const avatarColor = (name = "") => {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

// Colors used for role columns / cards (cycled by position).
export const ROLE_COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#0ea5e9", "#ef4444",
];
export const roleColor = (index) => ROLE_COLORS[index % ROLE_COLORS.length];

export const downloadCsv = (filename, rows) => {
  const esc = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const fmtMoney = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

// <input type="date"> value (YYYY-MM-DD) from a stored date
export const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

// <input type="datetime-local"> value in the user's own timezone
export const toLocalInput = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

export const labelize = (s) =>
  s ? s.charAt(0) + s.slice(1).toLowerCase().replaceAll("_", " ") : "-";

// ₹1.2Cr / ₹3.4L / ₹56K for chart axes and compact cards
export const fmtShort = (n) => {
  const v = Number(n) || 0;
  const a = Math.abs(v);
  const s = v < 0 ? "-" : "";
  if (a >= 1e7) return `${s}₹${+(a / 1e7).toFixed(2)}Cr`;
  if (a >= 1e5) return `${s}₹${+(a / 1e5).toFixed(2)}L`;
  if (a >= 1e3) return `${s}₹${+(a / 1e3).toFixed(1)}K`;
  return `${s}₹${Math.round(a)}`;
};

export const fmtPct = (n) => `${Number(n || 0) > 0 ? "+" : ""}${Number(n || 0)}%`;
