// `color` is used by charts, `badge` by tables.
export const LEAD_STATUSES = [
  { value: "NEW", label: "New", color: "#3b82f6", badge: "bg-blue-100 text-blue-700" },
  { value: "DEMO_SCHEDULED", label: "Demo scheduled", color: "#f59e0b", badge: "bg-amber-100 text-amber-700" },
  { value: "QUOTATION_SENT", label: "Quotation sent", color: "#8b5cf6", badge: "bg-violet-100 text-violet-700" },
  { value: "SALES", label: "Sales", color: "#10b981", badge: "bg-emerald-100 text-emerald-700" },
  { value: "PROJECT", label: "Project", color: "#059669", badge: "bg-green-100 text-green-700" },
  { value: "LOST", label: "Lost", color: "#94a3b8", badge: "bg-slate-200 text-slate-600" },
];

export const statusMeta = (value) =>
  LEAD_STATUSES.find((s) => s.value === value) || {
    label: value || "-",
    color: "#94a3b8",
    badge: "bg-slate-100 text-slate-600",
  };

export const SOURCE_COLORS = {
  BNI: "#6366f1",
  EVENT: "#f59e0b",
  META: "#3b82f6",
  INDIAMART: "#10b981",
  OTHER: "#94a3b8",
};

export const PRIORITIES = [
  { value: "HIGH", label: "High", badge: "bg-red-100 text-red-600" },
  { value: "MEDIUM", label: "Medium", badge: "bg-amber-100 text-amber-700" },
  { value: "LOW", label: "Low", badge: "bg-cyan-100 text-cyan-700" },
];
export const priorityMeta = (v) =>
  PRIORITIES.find((p) => p.value === v) || { label: v || "-", badge: "bg-slate-100 text-slate-600" };

export const DEAL_STAGES = [
  { value: "DISCOVERY", label: "Discovery", color: "#17a2b8", badge: "bg-cyan-100 text-cyan-700" },
  { value: "PROPOSAL", label: "Proposal", color: "#f5a623", badge: "bg-amber-100 text-amber-700" },
  { value: "NEGOTIATION", label: "Negotiation", color: "#4f6bed", badge: "bg-indigo-100 text-indigo-700" },
  { value: "CLOSED_WON", label: "Closed Won", color: "#2ecc71", badge: "bg-emerald-100 text-emerald-700" },
  { value: "CLOSED_LOST", label: "Closed Lost", color: "#e74c3c", badge: "bg-red-100 text-red-600" },
];
export const stageMeta = (v) =>
  DEAL_STAGES.find((s) => s.value === v) || { label: v || "-", color: "#94a3b8", badge: "bg-slate-100 text-slate-600" };

export const DEAL_STATUS_BADGE = {
  IN_PROGRESS: { label: "In Progress", badge: "bg-indigo-100 text-indigo-700" },
  WON: { label: "Won", badge: "bg-emerald-100 text-emerald-700" },
  LOST: { label: "Lost", badge: "bg-red-100 text-red-600" },
};

export const TASK_STATUSES = [
  { value: "TODO", label: "Todo", badge: "bg-violet-100 text-violet-700" },
  { value: "IN_PROGRESS", label: "In Progress", badge: "bg-amber-100 text-amber-700" },
  { value: "REVIEW", label: "Review", badge: "bg-cyan-100 text-cyan-700" },
  { value: "COMPLETED", label: "Completed", badge: "bg-emerald-100 text-emerald-700" },
];
export const taskStatusMeta = (v) =>
  TASK_STATUSES.find((s) => s.value === v) || { label: v || "-", badge: "bg-slate-100 text-slate-600" };

export const FOLLOWUP_TYPES = [
  { value: "CALL", label: "Call", badge: "bg-emerald-100 text-emerald-700" },
  { value: "EMAIL", label: "Email", badge: "bg-violet-100 text-violet-700" },
  { value: "MEETING", label: "Meeting", badge: "bg-amber-100 text-amber-700" },
];
export const followUpTypeMeta = (v) =>
  FOLLOWUP_TYPES.find((t) => t.value === v) || { label: v || "-", badge: "bg-slate-100 text-slate-600" };

export const TIER_BADGE = {
  PLATINUM: "bg-violet-100 text-violet-700",
  GOLD: "bg-amber-100 text-amber-700",
  SILVER: "bg-cyan-100 text-cyan-700",
  BRONZE: "bg-rose-100 text-rose-600",
};
