import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  LogOut,
  Users,
  User,
  Loader2,
  Building2,
  Megaphone,
  Mail
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import favlogo from "../assets/favicon.png";

export default function Sidebar({
  mobileOpen = false,
  visible = true,
  onCloseMobile = () => { },
  onNavigate = () => { },
}) {
  const [logoutLoading, setLogoutLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  const location = useLocation();
  const navigate = useNavigate();

  const logout = async () => {
    setLogoutLoading(true);

    setTimeout(() => {
      localStorage.clear();
      navigate("/");
      onNavigate();
      setLogoutLoading(false);
    }, 800);
  };

  const active = (path) => location.pathname === path;

  const desktopWidth = visible ? "lg:w-64" : "lg:w-20";

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
          w-[85vw] max-w-[300px]
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
              className={`absolute transition-all duration-300 ${visible
                ? "opacity-100 scale-100 h-16"
                : "opacity-0 scale-75 h-16 pointer-events-none"
                }`}
            />

            {/* Favicon */}
            <img
              src={favlogo}
              alt="SaraS Icon"
              className={`absolute transition-all duration-300 ${visible
                ? "opacity-0 scale-75 w-10 h-10 pointer-events-none"
                : "opacity-100 scale-100 w-10 h-10 rounded-full border border-slate-200"
                }`}
            />
          </div>
        </div>

        {/* Scrollable Menu */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-4">
          {user?.role === "ADMIN" ? (
            <>
              <MenuLink
                to="/admin"
                active={active("/admin")}
                icon={<LayoutDashboard size={20} />}
                text="Dashboard"
                collapsed={!visible}
                onClick={onNavigate}
              />

              <MenuLink
                to="/all-tasks"
                active={active("/all-tasks")}
                icon={<ClipboardList size={20} />}
                text="All Tasks"
                collapsed={!visible}
                onClick={onNavigate}
              />

              <MenuLink
                to="/assign-task"
                active={active("/assign-task")}
                icon={<PlusCircle size={20} />}
                text="Assign Tasks"
                collapsed={!visible}
                onClick={onNavigate}
              />

              <MenuLink
                to="/employees"
                active={active("/employees")}
                icon={<Users size={20} />}
                text="Employees"
                collapsed={!visible}
                onClick={onNavigate}
              />

              <MenuLink
                to="/clients"
                active={active("/clients")}
                icon={<Building2 size={20} />}
                text="Clients"
                collapsed={!visible}
                onClick={onNavigate}
              />

              <MenuLink
                to="/leads"
                active={active("/leads")}
                icon={<Megaphone size={20} />}
                text="Leads"
                collapsed={!visible}
                onClick={onNavigate}
              />
              <MenuLink
                to="/campaigns"
                active={active("/campaigns")}
                icon={<Mail size={20} />}
                text="Campaigns"
                collapsed={!visible}
                onClick={onNavigate}
              />
            </>
          ) : user?.role === "MANAGER" ? (
            <>
              <MenuLink
                to="/employee"
                active={active("/employee")}
                icon={<LayoutDashboard size={20} />}
                text="Dashboard"
                collapsed={!visible}
                onClick={onNavigate}
              />

              <MenuLink
                to="/my-tasks"
                active={active("/my-tasks")}
                icon={<ClipboardList size={20} />}
                text="My Tasks"
                collapsed={!visible}
                onClick={onNavigate}
              />

              <MenuLink
                to="/add-task"
                active={active("/add-task")}
                icon={<PlusCircle size={20} />}
                text="Add Task"
                collapsed={!visible}
                onClick={onNavigate}
              />
              <MenuLink
                to="/campaigns"
                active={active("/campaigns")}
                icon={<Mail size={20} />}
                text="Campaigns"
                collapsed={!visible}
                onClick={onNavigate}
              />
            </>
          ) : (
            <>
              <MenuLink
                to="/employee"
                active={active("/employee")}
                icon={<LayoutDashboard size={20} />}
                text="Dashboard"
                collapsed={!visible}
                onClick={onNavigate}
              />

              <MenuLink
                to="/my-tasks"
                active={active("/my-tasks")}
                icon={<ClipboardList size={20} />}
                text="My Tasks"
                collapsed={!visible}
                onClick={onNavigate}
              />

              <MenuLink
                to="/add-task"
                active={active("/add-task")}
                icon={<PlusCircle size={20} />}
                text="Add Task"
                collapsed={!visible}
                onClick={onNavigate}
              />
            </>
          )}

          <MenuLink
            to="/profile"
            active={active("/profile")}
            icon={<User size={20} />}
            text="Profile"
            collapsed={!visible}
            onClick={onNavigate}
          />
        </div>

        {/* Logout Fixed Bottom */}
        <div className="shrink-0 border-t bg-white p-3">
          <button
            onClick={logout}
            disabled={logoutLoading}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 font-medium transition
              ${visible
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "text-red-600 hover:bg-red-50"
              }
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
        px-4 py-3 mb-2
        rounded-xl
        transition-all
        ${active
          ? "bg-[#2b1247] text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100"
        }
      `}
    >
      {icon}
      {!collapsed && <span className="font-medium">{text}</span>}
    </Link>
  );
}
