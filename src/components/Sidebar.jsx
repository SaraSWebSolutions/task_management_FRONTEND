import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  User,
  Loader2,
  Building2,
  Mail,
  FolderKanban,
  UserCog,
  FileText,
  Target,
  ChevronDown,
  Briefcase,
  Wallet,
  ChartColumn,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import favlogo from "../assets/favicon.png";
import { can, canAny } from "../utils/permissions";

// Every item is gated by a permission; Admin passes all of them.
const USER_GROUP = {
  key: "users",
  text: "User Management",
  icon: UserCog,
  children: [
    {
      to: "/users",
      text: "All Users",
      perm: "users.view",
      match: (p) => p === "/users" || (p.startsWith("/users/") && p !== "/users/add"),
    },
    { to: "/users/add", text: "Add User", perm: "users.create" },
    { to: "/roles", text: "Roles & Permissions", perm: "roles.view" },
  ],
};

const CRM_GROUP = {
  key: "crm",
  text: "CRM",
  icon: Briefcase,
  children: [
    { to: "/crm-dashboard", text: "Dashboard", perm: "leads.view" },
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
    { to: "/crm/customers", text: "Customers", perm: "clients.view" },
    { to: "/crm/deals", text: "Deals", perm: "deals.view" },
    { to: "/crm/tasks", text: "Tasks", perm: "crmtasks.view" },
    { to: "/crm/follow-ups", text: "Follow-ups", perm: "followups.view" },
  ],
};

const PROJECT_GROUP = {
  key: "projects",
  text: "Projects",
  icon: FolderKanban,
  children: [
    { to: "/pm/dashboard", text: "Dashboard", perm: ["projects.view", "projecttasks.view"] },
    {
      to: "/projects",
      text: "Project List",
      perm: "projects.view",
      match: (p) => p === "/projects" || p.startsWith("/projects/"),
    },
    { to: "/pm/board", text: "Task Board", perm: "projecttasks.view" },
    { to: "/pm/tasks", text: "Task List", perm: "projecttasks.view" },
    { to: "/pm/milestones", text: "Milestones", perm: "milestones.view" },
    { to: "/pm/time", text: "Time Tracking", perm: "timelogs.view" },
  ],
};

const FINANCE_GROUP = {
  key: "finance",
  text: "Finance",
  icon: Wallet,
  children: [
    { to: "/finance/revenue", text: "Revenue", perm: "finance.view" },
    { to: "/finance/expenses", text: "Expenses", perm: "expenses.view" },
    { to: "/finance/invoices", text: "Invoices", perm: "invoices.view" },
    { to: "/finance/payments", text: "Payments", perm: "payments.view" },
    { to: "/finance/subscriptions", text: "Subscriptions", perm: "subscriptions.view" },
    { to: "/finance/plans", text: "Plans & Pricing", perm: "plans.view" },
    { to: "/finance/tax", text: "Tax Settings", perm: "tax.view" },
    { to: "/finance/reports", text: "Reports", perm: "finance.view" },
  ],
};

const ANALYTICS_GROUP = {
  key: "analytics",
  text: "Reports & Analytics",
  icon: ChartColumn,
  children: [
    { to: "/analytics/sales", text: "Sales Reports", perm: "analytics.view" },
    { to: "/analytics/revenue", text: "Revenue Reports", perm: "analytics.view" },
    { to: "/analytics/users", text: "User Reports", perm: "analytics.view" },
    { to: "/analytics/performance", text: "Performance", perm: "analytics.view" },
    { to: "/analytics/lead-sources", text: "Lead Sources", perm: "analytics.view" },
    { to: "/analytics/conversion", text: "Conversion", perm: "analytics.view" },
    { to: "/analytics/custom", text: "Custom Reports", perm: "analytics.view" },
    { to: "/analytics/export", text: "Export Data", perm: "analytics.export" },
  ],
};

const MODULES = [
  { group: USER_GROUP },
  { to: "/clients", text: "Clients", icon: Building2, perm: "clients.view" },
  { group: CRM_GROUP },
  { group: PROJECT_GROUP },
  { group: FINANCE_GROUP },
  { group: ANALYTICS_GROUP },
  { to: "/reports", text: "Reports", icon: FileText, perm: "reports.view" },
  { to: "/target-dashboard", text: "Target Dashboard", icon: Target, perm: "reports.view" },
  { to: "/campaigns", text: "Campaigns", icon: Mail, perm: "campaigns.view" },
];

export default function Sidebar({
  mobileOpen = false,
  visible = true,
  onCloseMobile = () => {},
  onNavigate = () => {},
}) {
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [openGroups, setOpenGroups] = useState({});

  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "ADMIN";

  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const logout = async () => {
    setLogoutLoading(true);

    setTimeout(() => {
      localStorage.clear();
      navigate("/");
      onNavigate();
      setLogoutLoading(false);
    }, 800);
  };

  const isActive = (item) =>
    item.match ? item.match(path) : path === item.to || path.startsWith(`${item.to}/`);

  const desktopWidth = visible ? "lg:w-64" : "lg:w-20";

  const top = isAdmin
    ? [{ to: "/admin", text: "Dashboard", icon: LayoutDashboard }]
    : [{ to: "/my-work", text: "My Work", icon: ClipboardList }];

  // Resolve permissions once per render.
  const modules = MODULES.map((m) =>
    m.group
      ? { ...m.group, children: m.group.children.filter((c) => canAny(...[].concat(c.perm))) }
      : m,
  ).filter((m) => (m.children ? m.children.length > 0 : can(m.perm)));

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
            childActive ? "bg-brand-soft text-brand-hover" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Icon size={20} />
          <span className="flex-1 text-left">{g.text}</span>
          <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
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
                    active ? "bg-brand-soft text-brand-hover font-medium" : "text-slate-600 hover:bg-slate-50"
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
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onCloseMobile} />
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
        <div className="border-b bg-white px-4 py-5">
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
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-4">
          {top.map(renderLink)}

          {modules.length > 0 && visible && (
            <p className="px-4 pt-4 pb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase text-left">
              Apps &amp; Modules
            </p>
          )}
          {modules.map((m) => (m.children ? renderGroup(m) : renderLink(m)))}

          <div className="mt-2">
            {renderLink({ to: "/profile", text: "Profile", icon: User })}
          </div>
        </div>

        {/* Logout Fixed Bottom */}
        <div className="shrink-0 border-t bg-white p-3">
          <button
            onClick={logout}
            disabled={logoutLoading}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 font-medium transition
              ${visible ? "bg-red-50 text-red-600 hover:bg-red-100" : "text-red-600 hover:bg-red-50"}
              ${logoutLoading ? "opacity-70 cursor-not-allowed" : ""}
              `}
          >
            {logoutLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {visible && <span>Logging out...</span>}
              </>
            ) : (
              <>
                <LogOut size={18} />
                {visible && <span>Logout</span>}
              </>
            )}
          </button>
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
