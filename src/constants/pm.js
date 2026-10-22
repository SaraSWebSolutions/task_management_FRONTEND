// Project Management constants. `color` is for charts, `badge` for tables/cards.
export const PROJECT_STATUSES = [
  { value: "PLANNING", label: "Planning", badge: "bg-blue-100 text-blue-700" },
  { value: "IN_PROGRESS", label: "Active", badge: "bg-emerald-100 text-emerald-700" },
  { value: "ON_HOLD", label: "On Hold", badge: "bg-amber-100 text-amber-700" },
  { value: "COMPLETED", label: "Completed", badge: "bg-violet-100 text-violet-700" },
];
export const projectStatusMeta = (v) =>
  PROJECT_STATUSES.find((s) => s.value === v) || {
    label: v || "-",
    badge: "bg-slate-100 text-slate-600",
  };

export const PM_TASK_STATUSES = [
  { value: "TODO", label: "Todo", color: "#94a3b8", badge: "bg-slate-100 text-slate-700" },
  { value: "IN_PROGRESS", label: "In Progress", color: "#3b82f6", badge: "bg-blue-100 text-blue-700" },
  { value: "REVIEW", label: "Review", color: "#f59e0b", badge: "bg-amber-100 text-amber-700" },
  { value: "DONE", label: "Done", color: "#10b981", badge: "bg-emerald-100 text-emerald-700" },
];
export const pmTaskStatusMeta = (v) =>
  PM_TASK_STATUSES.find((s) => s.value === v) || {
    label: v || "-",
    color: "#94a3b8",
    badge: "bg-slate-100 text-slate-600",
  };

export const MILESTONE_STATUSES = [
  { value: "UPCOMING", label: "Upcoming", badge: "bg-cyan-100 text-cyan-700", bar: "#06b6d4" },
  { value: "IN_PROGRESS", label: "In Progress", badge: "bg-indigo-100 text-indigo-700", bar: "#6366f1" },
  { value: "COMPLETED", label: "Completed", badge: "bg-emerald-100 text-emerald-700", bar: "#10b981" },
];
export const milestoneStatusMeta = (v) =>
  MILESTONE_STATUSES.find((s) => s.value === v) || MILESTONE_STATUSES[0];

export const HEALTH = {
  ON_TRACK: { label: "On Track", color: "#6366f1" },
  AT_RISK: { label: "At Risk", color: "#a855f7" },
  DELAYED: { label: "Delayed", color: "#ef4444" },
  COMPLETED: { label: "Completed", color: "#10b981" },
};

export const PRIORITY_DOT = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-amber-500",
  LOW: "bg-emerald-500",
};
