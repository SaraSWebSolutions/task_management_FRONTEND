import { useEffect, useRef, useState } from "react";
import { Menu, User, UserCircle, Bell, CalendarDays, LogOut, Search, SquareTerminal, Mail } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import NotificationBell from "./notifications/NotificationBell";
import CommandPalette from "./CommandPalette";
import { refreshPermissions, can } from "../utils/permissions";

const ROLE_LABEL = { ADMIN: "Administrator", MANAGER: "Manager", EMPLOYEE: "Employee" };

export default function Layout({ children }) {
  const [mobileSidebarPath, setMobileSidebarPath] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const location = useLocation();
  const mobileSidebarOpen = mobileSidebarPath === location.pathname;
  const [, setPermsVersion] = useState(0);

  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuRef = useRef(null);

  // Ctrl+K / Cmd+K opens the page search from anywhere
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen((o) => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const away = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [menuOpen]);

  const signOut = () => {
    localStorage.clear();
    navigate("/");
  };

  // Keep permissions fresh so role edits show up without a re-login.
  useEffect(() => {
    let off = false;
    refreshPermissions()
      .then(() => !off && setPermsVersion((v) => v + 1))
      .catch(() => {});
    return () => {
      off = true;
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [mobileSidebarOpen]);

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setSidebarVisible((prev) => !prev);
    } else {
      setMobileSidebarPath(location.pathname);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        visible={sidebarVisible}
        onCloseMobile={() => setMobileSidebarPath(null)}
        onCloseDesktop={() => setSidebarVisible(false)}
        onNavigate={() => setMobileSidebarPath(null)}
      />

      {/* Header */}
      <header
        className={`sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm transition-all duration-300 ${
          sidebarVisible ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        <div className="h-26 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-100 transition"
            >
              <Menu size={20} />
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search pages"
              className="hidden md:flex items-center gap-3 h-12 w-72 lg:w-110 rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-left text-slate-400 hover:bg-white transition"
            >
              <Search size={18} />
              <span className="flex-1 truncate">Search anything... (Ctrl+K)</span>
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <button onClick={() => setSearchOpen(true)} aria-label="Quick search" className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-100 transition"><Search size={19} /></button>
            <button onClick={() => setSearchOpen(true)} aria-label="Open command search" title="Quick search (Ctrl+K)" className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-100 transition"><SquareTerminal size={19} /></button>
            <NotificationBell />
            {can("campaigns.view") && (
              <Link to="/campaigns" aria-label="Email campaigns" title="Email campaigns" className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-100 transition"><Mail size={19} /></Link>
            )}

            {/* User Profile */}
            <div className="relative border-l border-slate-200 pl-4" ref={menuRef}>
              <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-3 rounded-xl hover:bg-slate-50 pr-1" aria-haspopup="menu" aria-expanded={menuOpen}>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-slate-800 capitalize">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {ROLE_LABEL[user?.role] || "Employee"}
                  </p>
                </div>

                <div className="h-12 w-12 rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center font-semibold shadow-md overflow-hidden">
                  {user?.profileImage ? <img src={user.profileImage} alt="" className="h-full w-full object-cover" /> : user?.name?.charAt(0)?.toUpperCase() || <User size={18} />}
                </div>
              </button>

              {menuOpen && (
                <div role="menu" className="absolute right-0 mt-3 w-56 rounded-2xl border border-slate-200 bg-white shadow-xl p-2 z-50">
                  <Link role="menuitem" to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50"><UserCircle size={18} /> My Profile</Link>
                  <Link role="menuitem" to="/notifications" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50"><Bell size={18} /> Notifications</Link>
                  <Link role="menuitem" to="/calendar" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50"><CalendarDays size={18} /> Calendar</Link>
                  <div className="my-1 border-t border-slate-100" />
                  <button role="menuitem" onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50"><LogOut size={18} /> Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={`min-h-screen p-4 sm:p-6 lg:p-8 transition-all duration-300 ${
          sidebarVisible ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        {children}
      </main>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
