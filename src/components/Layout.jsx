import { useEffect, useState } from "react";
import {  Menu, User } from "lucide-react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { refreshPermissions } from "../utils/permissions";

export default function Layout({ children }) {
  const [mobileSidebarPath, setMobileSidebarPath] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const location = useLocation();
  const mobileSidebarOpen = mobileSidebarPath === location.pathname;
  const [, setPermsVersion] = useState(0);

  const user = JSON.parse(localStorage.getItem("user"));

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
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
           
            {/* User Profile */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-slate-800 capitalize">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  {user?.role || "Employee"}
                </p>
              </div>

              <div className="h-10 w-10 rounded-full bg-[#2b1247] text-white flex items-center justify-center font-semibold shadow-md">
                {user?.name?.charAt(0)?.toUpperCase() || <User size={18} />}
              </div>
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
    </div>
  );
}
