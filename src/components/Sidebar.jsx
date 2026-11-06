import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  User,
  Mail,
  FolderKanban,
  Target,
  ChevronDown,
  Briefcase,
  Package,
  ChartColumn,
  Settings,
  ReceiptText,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import favlogo from "../assets/favicon.png";
import { canAccess } from "../utils/permissions";

// Every item is gated by a permission; Admin passes all of them.
const SETTINGS_GROUP = {
  key: "settings",
  text: "Settings",
  icon: Settings,
  children: [
    {
      to: "/users",
      text: "Users",
      perm: "users.view",
      match: (p) =>
        p === "/users" || (p.startsWith("/users/") && p !== "/users/add"),
    },
    { to: "/roles", text: "Roles & Permissions", perm: "roles.view" },
    { to: "/finance/plans", text: "Plans & Pricing", perm: "plans.view" },
    { to: "/finance/tax", text: "Tax Settings", perm: "tax.view" },
  ],
};

const CRM_GROUP = {
  key: "crm",
  text: "CRM",
  icon: Briefcase,
  children: [
    {
      to: "/leads",
      text: "Leads",
      perm: "leads.view",
      match: (p) =>
        p === "/leads" ||
        p.startsWith("/leads/") ||
        p === "/add-lead" ||
        p.startsWith("/edit-lead/"),
    },
    { to: "/crm/pipeline", text: "Lead Pipeline", perm: "leads.view" },
    {
      to: "/crm/customers",
      text: "Customers",
      perm: "clients.view",
      match: (p) =>
        p.startsWith("/crm/customers") ||
        p === "/add-customer" ||
        p.startsWith("/edit-customer/"),
    },
    { to: "/crm/follow-ups", text: "Follow-ups", perm: "followups.view" },
  ],
};

const PRODUCT_GROUP = {
  key: "catalog",
  text: "Products",
  icon: Package,
  children: [
    {
      to: "/products",
      text: "Products",
      perm: "products.view",
      match: (p) =>
        (p === "/products" || (p.startsWith("/products/") && p !== "/products/add")) &&
        !p.endsWith("/edit"),
    },
    { to: "/categories", text: "Categories", perm: "categories.view" },
  ],
};

const PROJECT_GROUP = {
  key: "projects",
  text: "Projects",
  icon: FolderKanban,
  children: [
    {
      to: "/projects",
      text: "Project List",
      perm: "projects.view",
      match: (p) => p === "/projects" || p.startsWith("/projects/"),
    },
    { to: "/pm/board", text: "Task Board", perm: "projecttasks.view" },
    { to: "/pm/tasks", text: "Task List", perm: "projecttasks.view" },
    // Milestones are hidden for now. Add this line back to show them again:
    // { to: "/pm/milestones", text: "Milestones", perm: "milestones.view" },
    { to: "/pm/time", text: "Time Tracking", perm: "timelogs.view" },
  ],
};

const SALES_GROUP = {
  key: "sales",
  text: "Sales",
  icon: ReceiptText,
  children: [
    { to: "/quotations", text: "Quotations", perm: "leads.view", match: (p) => p.startsWith("/quotations") },
    { to: "/finance/invoices", text: "Invoices", perm: "invoices.view" },
    { to: "/finance/payments", text: "Payments", perm: "payments.view" },
    { to: "/finance/subscriptions", text: "Subscriptions", perm: "subscriptions.view" },
    { to: "/finance/revenue", text: "Revenue", perm: "finance.view" },
    { to: "/finance/expenses", text: "Expenses", perm: "expenses.view" },
    { to: "/finance/reports", text: "Finance Reports", perm: "finance.view" },
  ],
};

const ANALYTICS_GROUP = {
  key: "analytics",
  text: "Reports & Analytics",
  icon: ChartColumn,
  children: [
    // Same rule the server uses: analytics.view AND permission for the data behind the page
    {
      to: "/analytics/sales",
      text: "Sales Reports",
      perm: "analytics.view",
      also: ["finance.view", "invoices.view"],
    },
    {
      to: "/analytics/revenue",
      text: "Revenue Reports",
      perm: "analytics.view",
      also: "finance.view",
    },
    {
      to: "/analytics/users",
      text: "User Reports",
      perm: "analytics.view",
      also: ["users.view", "employees.view"],
    },
    {
      to: "/analytics/performance",
      text: "Performance",
      perm: "analytics.view",
      also: ["projecttasks.view", "projects.view"],
    },
    {
      to: "/analytics/lead-sources",
      text: "Lead Sources",
      perm: "analytics.view",
      also: "leads.view",
    },
    {
      to: "/analytics/conversion",
      text: "Conversion",
      perm: "analytics.view",
      also: ["leads.view", "deals.view"],
    },
    { to: "/analytics/custom", text: "Custom Reports", perm: "analytics.view" },
    {
      to: "/analytics/export",
      text: "Export Data",
      perm: "analytics.export",
      also: "analytics.view",
    },
    // Date-wise quotation / employee reports live with the other reports
    { to: "/reports", text: "Date-wise Reports", perm: "reports.view" },
  ],
};

// One combined dashboard (customers, projects, leads and finance together)
const DASHBOARD_LINK = {
  to: "/dashboard",
  text: "Dashboard",
  icon: LayoutDashboard,
  perm: "dashboard.view",
};

// Sidebar layout, in this order. A group opens into its children.
const SECTIONS = [
  {
    label: "Menu",
    items: [
      DASHBOARD_LINK,
      // staff only: employees do their tasks from here
      { to: "/my-work", text: "My Work", icon: ClipboardList, perm: "mywork.view", staffOnly: true },
      { to: "/campaigns", text: "Campaigns", icon: Mail, perm: "campaigns.view" },
      { group: PRODUCT_GROUP },
      { group: CRM_GROUP },
      { group: SALES_GROUP },
      { group: PROJECT_GROUP },
      { group: ANALYTICS_GROUP },
      { to: "/target-dashboard", text: "Target Dashboard", icon: Target, perm: "reports.view" },
      { to: "/profile", text: "Profile", icon: User },
      { group: SETTINGS_GROUP },
    ],
  },
];

export default function Sidebar({
  mobileOpen = false,
  visible = true,
  onCloseMobile = () => {},
  onNavigate = () => {},
}) {
  const [openGroups, setOpenGroups] = useState({});

  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "ADMIN";

  const location = useLocation();
  const path = location.pathname;

  const isActive = (item) =>
    item.match
      ? item.match(path)
      : path === item.to || path.startsWith(`${item.to}/`);

  const desktopWidth = visible ? "lg:w-64" : "lg:w-20";

  // Work out what this person may see: a child or link with no `perm` is open to everyone.
  const allowed = (item) => canAccess(item);
  const sections = SECTIONS.map((s) => ({
    label: s.label,
    items: s.items
      .map((m) =>
        m.group
          ? {
              ...m.group,
              children: m.group.children.filter((c) => allowed(c)),
            }
          : m,
      )
      .filter((m) =>
        m.children
          ? m.children.length > 0
          : allowed(m) && !(m.staffOnly && isAdmin),
      ),
  })).filter((s) => s.items.length > 0);

  const renderLink = (item) => (
    <MenuLink
      key={item.to}
      to={item.to}
      active={isActive(item)}
      icon={<item.icon size={20} />}
      text={item.text}
      collapsed={!visible}
      onClick={onNavigate}
    />
  );

  const renderGroup = (g) => {
    const childActive = g.children.some(isActive);
    const open = openGroups[g.key] ?? childActive;
    const Icon = g.icon;

    // Collapsed rail: just the icon, linking to the first child.
    if (!visible) {
      return (
        <MenuLink
          key={g.key}
          to={g.children[0].to}
          active={childActive}
          icon={<Icon size={20} />}
          text={g.text}
          collapsed
          onClick={onNavigate}
        />
      );
    }

    return (
      <div key={g.key} className="mb-1">
        <button
          type="button"
          onClick={() => setOpenGroups((s) => ({ ...s, [g.key]: !open }))}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition ${
            childActive
              ? "bg-brand-soft text-brand-hover font-semibold"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Icon size={20} />
          <span className="flex-1 text-left">{g.text}</span>
          {g.key === "dashboard" && (
            <span className="h-6 min-w-6 px-1.5 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
              {g.children.length}
            </span>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="mt-1 space-y-1">
            {g.children.map((c) => {
              const active = isActive(c);
              return (
                <Link
                  key={c.to}
                  to={c.to}
                  onClick={onNavigate}
                  className={`flex items-center gap-4 pl-8 pr-4 py-2.5 rounded-xl text-sm transition ${
                    active
                      ? "bg-brand-soft text-brand-hover font-semibold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${active ? "bg-brand" : "bg-slate-400"}`}
                  />
                  {c.text}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-40
          h-screen
          bg-white border-r border-slate-200 shadow-lg
          flex flex-col
          transition-all duration-300
          w-[85vw] max-w-75
          ${desktopWidth}
          lg:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="relative z-10 bg-white px-4 py-5 shadow-[0_3px_10px_-3px_rgba(15,23,42,0.18)] dark:shadow-[0_3px_12px_-3px_rgba(0,0,0,0.45)]">
          <div className="flex justify-center items-center relative h-16">
            {/* Main Logo */}
            <img
              src={logo}
              alt="SaraS Logo"
              className={`absolute transition-all duration-300 ${
                visible
                  ? "opacity-100 scale-100 h-16"
                  : "opacity-0 scale-75 h-16 pointer-events-none"
              }`}
            />

            {/* Favicon */}
            <img
              src={favlogo}
              alt="SaraS Icon"
              className={`absolute transition-all duration-300 ${
                visible
                  ? "opacity-0 scale-75 w-10 h-10 pointer-events-none"
                  : "opacity-100 scale-100 w-10 h-10 rounded-full border border-slate-200"
              }`}
            />
          </div>
        </div>

        {/* Scrollable Menu */}
        <div className="flex-1 min-h-0 overflow-y-auto sidebar-scroll overflow-x-hidden px-3 py-4">
          {sections.map((s, i) => (
            <div key={s.label} className="mb-2">
              {i > 0 && <div className="mx-4 mb-3 border-t border-slate-100" />}
              {s.items.map((m) =>
                m.children ? renderGroup(m) : renderLink(m),
              )}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

function MenuLink({ to, icon, text, active, onClick, collapsed }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`
        flex items-center
        ${collapsed ? "justify-center" : "justify-start"}
        gap-3
        px-4 py-3 mb-1
        rounded-xl text-[15px]
        transition-all
        ${
          active
            ? "bg-brand-soft text-brand-hover font-medium"
            : "text-slate-600 hover:bg-slate-50 font-medium"
        }
      `}
    >
      {icon}
      {!collapsed && <span>{text}</span>}
    </Link>
  );
}
