import { ListTodo, Users, CalendarDays, IndianRupee, Mail, Settings } from "lucide-react";

// type -> label, icon and colours used by the bell and the notifications page
export const NOTIFICATION_TYPES = {
  TASK: { label: "Tasks", icon: ListTodo, tint: "bg-blue-50 text-blue-600", chip: "bg-blue-100 text-blue-700", hint: "Tasks assigned to you, due today or late" },
  LEAD: { label: "Leads", icon: Users, tint: "bg-violet-50 text-violet-600", chip: "bg-violet-100 text-violet-700", hint: "Demos assigned, follow-ups and CRM tasks" },
  CALENDAR: { label: "Calendar", icon: CalendarDays, tint: "bg-emerald-50 text-emerald-600", chip: "bg-emerald-100 text-emerald-700", hint: "Invitations, changes and event reminders" },
  FINANCE: { label: "Finance", icon: IndianRupee, tint: "bg-amber-50 text-amber-600", chip: "bg-amber-100 text-amber-700", hint: "Overdue invoices" },
  CAMPAIGN: { label: "Email", icon: Mail, tint: "bg-pink-50 text-pink-600", chip: "bg-pink-100 text-pink-700", hint: "Results of the email campaigns you send" },
  SYSTEM: { label: "System", icon: Settings, tint: "bg-slate-100 text-slate-600", chip: "bg-slate-200 text-slate-700", hint: "Account and system messages" },
};
export const typeMeta = (t) => NOTIFICATION_TYPES[t] || NOTIFICATION_TYPES.SYSTEM;
