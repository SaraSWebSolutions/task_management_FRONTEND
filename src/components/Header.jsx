import { useNavigate } from "react-router-dom";

export default function Header({ title, subtitle }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 mb-2">
            Dashboard
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>

        <div
          onClick={() => navigate("/profile")}
          className="flex items-center gap-3 cursor-pointer rounded-2xl bg-slate-50 px-3 py-2 hover:bg-slate-100"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--brand)] text-white flex items-center justify-center font-semibold text-base">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>

          <div>
            <h4 className="font-semibold text-sm capitalize">{user?.name}</h4>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}