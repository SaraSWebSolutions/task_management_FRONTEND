// Shared split layout (banner + form card) for the public auth pages:
// forgot password and reset password. Login keeps its own copy of this layout.
import logo from "../assets/logo.png";
import banner from "../assets/login-banner.svg";

export default function AuthLayout({ children }) {
  return (
    <div className="h-dvh w-full grid lg:grid-cols-12 bg-white overflow-hidden">
      <div className="hidden lg:block lg:col-span-8 h-full relative overflow-hidden bg-brand">
        <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-violet-950/70 via-violet-900/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-14 pb-14 text-left">
          <h2 className="text-white text-3xl font-semibold leading-tight">Plan. Assign. Deliver.</h2>
          <p className="text-white/70 text-sm mt-3 max-w-md leading-relaxed">
            Leads, projects, tasks and your whole team, managed from one simple dashboard.
          </p>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4 h-full flex flex-col overflow-y-auto">
        <div className="lg:hidden relative h-28 sm:h-40 shrink-0 overflow-hidden bg-brand">
          <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-violet-950/70 to-transparent" />
        </div>

        <div className="flex-1 flex items-center justify-center px-5 sm:px-10">
          <div className="w-full max-w-sm py-8 sm:py-10 text-left">
            <img src={logo} alt="SaraS logo" className="h-10 mb-6" />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export const authInputClass =
  "w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-sm focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white outline-none transition";
