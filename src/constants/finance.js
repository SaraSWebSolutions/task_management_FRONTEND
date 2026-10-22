// Finance module constants. `badge` is for tables, `color` for charts.
export const CHART_COLORS = [
  "#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#ef4444", "#6366f1", "#94a3b8",
];

const meta = (list, fallback = { label: "-", badge: "bg-slate-100 text-slate-600" }) => (v) =>
  list.find((s) => s.value === v) || { ...fallback, label: v || fallback.label };

export const INVOICE_STATUSES = [
  { value: "PAID", label: "Paid", badge: "bg-emerald-100 text-emerald-700" },
  { value: "PENDING", label: "Pending", badge: "bg-amber-100 text-amber-700" },
  { value: "PARTIAL", label: "Partially Paid", badge: "bg-blue-100 text-blue-700" },
  { value: "OVERDUE", label: "Overdue", badge: "bg-red-100 text-red-700" },
  { value: "DRAFT", label: "Draft", badge: "bg-slate-100 text-slate-600" },
  { value: "CANCELLED", label: "Cancelled", badge: "bg-slate-200 text-slate-500" },
];
export const invoiceStatusMeta = meta(INVOICE_STATUSES);

export const PAYMENT_STATUSES = [
  { value: "SUCCESSFUL", label: "Successful", badge: "bg-emerald-100 text-emerald-700" },
  { value: "PENDING", label: "Pending", badge: "bg-amber-100 text-amber-700" },
  { value: "FAILED", label: "Failed", badge: "bg-red-100 text-red-700" },
  { value: "REFUNDED", label: "Refunded", badge: "bg-violet-100 text-violet-700" },
];
export const paymentStatusMeta = meta(PAYMENT_STATUSES);

export const PAYMENT_METHODS = [
  { value: "UPI", label: "UPI" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CARD", label: "Card" },
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];
export const methodLabel = (v) => PAYMENT_METHODS.find((m) => m.value === v)?.label || v || "-";

export const EXPENSE_STATUSES = [
  { value: "PENDING", label: "Pending", badge: "bg-amber-100 text-amber-700" },
  { value: "APPROVED", label: "Approved", badge: "bg-violet-100 text-violet-700" },
  { value: "PAID", label: "Paid", badge: "bg-emerald-100 text-emerald-700" },
  { value: "REJECTED", label: "Rejected", badge: "bg-red-100 text-red-700" },
];
export const expenseStatusMeta = meta(EXPENSE_STATUSES);

export const EXPENSE_CATEGORIES = [
  "Salaries & Wages", "Marketing", "Infrastructure", "Office & Admin",
  "Travel & Events", "Software & Tools", "Legal & Compliance", "Other",
];

export const SUBSCRIPTION_STATUSES = [
  { value: "ACTIVE", label: "Active", badge: "bg-emerald-100 text-emerald-700" },
  { value: "TRIAL", label: "Trial", badge: "bg-amber-100 text-amber-700" },
  { value: "PAST_DUE", label: "Past Due", badge: "bg-orange-100 text-orange-700" },
  { value: "CANCELLED", label: "Cancelled", badge: "bg-red-100 text-red-700" },
];
export const subscriptionStatusMeta = meta(SUBSCRIPTION_STATUSES);

export const SERVICE_TYPES = [
  { value: "WEBSITE", label: "Website" },
  { value: "BILLING", label: "Billing Software" },
  { value: "SOFTWARE", label: "Software" },
  { value: "E-COMMERCE", label: "E-Commerce" },
  { value: "AMC", label: "AMC" },
  { value: "OTHER", label: "Other" },
];

export const TAX_TYPES = [
  { value: "GST", label: "GST", badge: "bg-amber-100 text-amber-700" },
  { value: "IGST", label: "IGST", badge: "bg-orange-100 text-orange-700" },
  { value: "CGST", label: "CGST", badge: "bg-yellow-100 text-yellow-700" },
  { value: "SGST", label: "SGST", badge: "bg-yellow-100 text-yellow-700" },
  { value: "VAT", label: "VAT", badge: "bg-emerald-100 text-emerald-700" },
  { value: "SALES_TAX", label: "Sales Tax", badge: "bg-violet-100 text-violet-700" },
  { value: "OTHER", label: "Other", badge: "bg-slate-100 text-slate-600" },
];
export const taxTypeMeta = meta(TAX_TYPES);
