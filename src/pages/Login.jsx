// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../api/axios";
// import { Eye, EyeOff, Loader2 } from "lucide-react";
// import toast from "react-hot-toast";
// import logo from "../assets/logo.png";

// export default function Login() {
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     email: "",
//     password: "",
//   });

//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const handleLogin = async (e) => {
//     e.preventDefault();

//     if (!form.email.trim()) {
//       toast.error("Email is required");
//       return;
//     }

//     if (!/\S+@\S+\.\S+/.test(form.email)) {
//       toast.error("Enter a valid email address");
//       return;
//     }

//     if (!form.password.trim()) {
//       toast.error("Password is required");
//       return;
//     }

//     if (form.password.length < 6) {
//       toast.error("Password must be at least 6 characters");
//       return;
//     }

//     setLoading(true);

//     try {
//       const res = await api.post("/auth/login", form);

//       localStorage.setItem("token", res.data.token);
//       localStorage.setItem("user", JSON.stringify(res.data.user));

//       toast.success("Login Successful");

//       navigate(res.data.user.role === "ADMIN" ? "/admin" : "/employee");
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Invalid Email or Password");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#14052d] via-[#2b0b52] to-[#3B0D74] flex items-center justify-center px-4">
//       <div className="bg-white shadow-2xl rounded-3xl w-full max-w-md p-8">
//         <div className="text-center mb-6">
//           <img src={logo} alt="SaraS logo" className="mx-auto mb-2" />

//           <p className="text-slate-600 font-semibold text-lg mt-4">
//             Sign in to continue to your account
//           </p>
//         </div>

//         <form onSubmit={handleLogin}>
//           <div className="mb-4">
//             <input
//               type="email"
//               required
//               placeholder="Example@gmail.com"
//               className="w-full border mt-2 p-3 rounded-lg text-sm focus:ring-2 focus:ring-[var(--brand)] outline-none"
//               value={form.email}
//               onChange={(e) =>
//                 setForm({
//                   ...form,
//                   email: e.target.value,
//                 })
//               }
//             />
//           </div>

//           <div className="mb-5 relative">
//             <input
//               type={showPassword ? "text" : "password"}
//               required
//               placeholder="Abcd12@#"
//               className="w-full border p-3 pr-12 rounded-lg text-sm focus:ring-2 focus:ring-[var(--brand)] outline-none"
//               value={form.password}
//               onChange={(e) =>
//                 setForm({
//                   ...form,
//                   password: e.target.value,
//                 })
//               }
//             />

//             <button
//               type="button"
//               className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--brand-dark)]"
//               onClick={() => setShowPassword(!showPassword)}
//             >
//               {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
//             </button>
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className={`w-full py-3 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
//               loading
//                 ? "bg-gray-400 cursor-not-allowed"
//                 : "bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white"
//             }`}
//           >
//             {loading ? (
//               <>
//                 <Loader2 size={18} className="animate-spin" />
//                 Logging in...
//               </>
//             ) : (
//               "Login"
//             )}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import logo from "../assets/logo.png";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(form.email)) {
      toast.error("Enter a valid email address");
      return;
    }

    if (!form.password.trim()) {
      toast.error("Password is required");
      return;
    }

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/login", form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      toast.success("Login Successful");

      navigate(res.data.user.role === "ADMIN" ? "/admin" : "/employee");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid Email or Password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full grid lg:grid-cols-12 bg-white overflow-hidden">
      {/* Left side - illustration panel (8 cols) */}
      <div className="hidden lg:flex lg:col-span-8 h-full relative items-center justify-center overflow-hidden bg-[#0b0f1a]">
        {/* Aurora accent blobs, colors pulled from the logo's dot mark */}
        <div className="absolute -top-32 -left-20 w-[26rem] h-[26rem] rounded-full bg-fuchsia-500/25 blur-[100px]" />
        <div className="absolute top-10 right-0 w-96 h-96 rounded-full bg-amber-400/15 blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[26rem] h-[26rem] rounded-full bg-teal-400/20 blur-[110px]" />
        <div className="absolute bottom-10 -right-16 w-96 h-96 rounded-full bg-violet-500/25 blur-[100px]" />
        <div className="absolute top-1/3 right-10 w-40 h-40 rounded-3xl border border-white/10 rotate-12" />
        <div className="absolute bottom-16 left-16 w-24 h-24 rounded-2xl border border-white/10 -rotate-12" />

        {/* Illustration content */}
        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-lg">
          <div className="relative w-full max-w-sm h-72 flex items-center justify-center">
            {/* soft halo behind the board */}
            <div className="absolute w-64 h-64 rounded-full bg-white/10" />
            <div className="absolute w-44 h-44 rounded-full bg-white/5" />

            {/* Main kanban board card */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-4 w-72">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-700">
                  Project Board
                </p>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* To Do column */}
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wide">
                      To Do
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 mb-1.5 border-l-2 border-amber-400">
                    <div className="h-1.5 w-full bg-slate-200 rounded-full mb-1" />
                    <div className="h-1.5 w-2/3 bg-slate-200 rounded-full" />
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 border-l-2 border-sky-400">
                    <div className="h-1.5 w-full bg-slate-200 rounded-full" />
                  </div>
                </div>

                {/* In progress column */}
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wide">
                      Doing
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 border-l-2 border-violet-400">
                    <div className="h-1.5 w-full bg-slate-200 rounded-full mb-1" />
                    <div className="h-1.5 w-1/2 bg-slate-200 rounded-full mb-2" />
                    <div className="w-4 h-4 rounded-full bg-violet-200 ml-auto" />
                  </div>
                </div>

                {/* Done column */}
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wide">
                      Done
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2 border-l-2 border-emerald-400">
                    <div className="h-1.5 w-full bg-emerald-200/70 rounded-full mb-1.5" />
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-2.5 h-2.5 text-emerald-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" />
                      </svg>
                      <span className="text-[7px] text-emerald-600 font-medium">
                        Done
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks completed card */}
            <div className="absolute -top-6 -left-4 sm:-left-14 bg-white rounded-2xl shadow-xl px-3 py-2.5 flex items-center gap-2.5">
              <svg width="46" height="46" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="22" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                <circle
                  cx="26"
                  cy="26"
                  r="22"
                  fill="none"
                  stroke="#0f8b8d"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="138.2"
                  strokeDashoffset="33.2"
                  transform="rotate(-90 26 26)"
                />
                <text
                  x="26"
                  y="30"
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill="#334155"
                >
                  76%
                </text>
              </svg>
              <div className="text-left">
                <p className="text-[10px] text-slate-400 leading-none">
                  This week
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1">
                  Tasks Completed
                </p>
              </div>
            </div>

            {/* Active team card */}
            <div className="absolute -bottom-4 -right-2 sm:-right-10 bg-white rounded-2xl shadow-xl px-4 py-3 text-left">
              <p className="text-[10px] text-slate-400 leading-none">
                Active Team
              </p>
              <div className="flex -space-x-2 mt-2">
                <div className="w-6 h-6 rounded-full bg-rose-300 border-2 border-white" />
                <div className="w-6 h-6 rounded-full bg-amber-300 border-2 border-white" />
                <div className="w-6 h-6 rounded-full bg-sky-300 border-2 border-white" />
                <div className="w-6 h-6 rounded-full bg-emerald-300 border-2 border-white flex items-center justify-center text-[8px] font-semibold text-emerald-800">
                  +5
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-2">
                8 Members
              </p>
            </div>
          </div>

          <h2 className="text-white text-2xl font-semibold mt-8">
            Stay on top of every task
          </h2>
          <p className="text-white/60 text-sm mt-3 leading-relaxed">
            Assign work, track progress, and manage your whole team from a
            single dashboard.
          </p>
        </div>
      </div>

      {/* Right side - login form (4 cols) */}
      <div className="col-span-12 lg:col-span-4 h-full flex flex-col items-center justify-center px-6 sm:px-10 overflow-y-auto">
        <div className="w-full max-w-sm py-10 text-left">
          <img src={logo} alt="SaraS logo" className="h-10 mb-6" />

          <h1 className="text-2xl font-bold text-slate-800">
            Welcome! 👋
          </h1>
          <p className="text-slate-500 text-sm mt-2 mb-8">
            Please sign in to your account to continue
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="Example@gmail.com"
                className="w-full border border-slate-200 bg-slate-50 p-3 rounded-lg text-sm focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent focus:bg-white outline-none transition"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Abcd12@#"
                  className="w-full border border-slate-200 bg-slate-50 p-3 pr-12 rounded-lg text-sm focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent focus:bg-white outline-none transition"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                />

                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--brand-dark)]"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]"
                />
                <span className="text-sm text-slate-600">Remember Me</span>
              </label>

              <a
                href="/forgot-password"
                className="text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-dark)]"
              >
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <p className="text-left text-sm text-slate-500 mt-6">
            New on our platform?{" "}
            <a
              href="/register"
              className="font-medium text-[var(--brand)] hover:text-[var(--brand-dark)]"
            >
              Create an account
            </a>
          </p>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Continue with Facebook"
              className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 text-[#4267B2] hover:bg-slate-50 transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Continue with Twitter"
              className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 text-[#1DA1F2] hover:bg-slate-50 transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.3 4.3 0 0 0 1.88-2.37 8.59 8.59 0 0 1-2.72 1.04 4.28 4.28 0 0 0-7.29 3.9A12.14 12.14 0 0 1 3.15 4.9a4.28 4.28 0 0 0 1.32 5.71 4.25 4.25 0 0 1-1.94-.54v.05a4.28 4.28 0 0 0 3.43 4.2 4.3 4.3 0 0 1-1.93.07 4.29 4.29 0 0 0 4 2.98A8.59 8.59 0 0 1 2 18.57a12.12 12.12 0 0 0 6.56 1.92c7.88 0 12.19-6.53 12.19-12.2 0-.19 0-.37-.01-.55A8.7 8.7 0 0 0 22.46 6z" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Continue with Github"
              className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 text-slate-800 hover:bg-slate-50 transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.89 1.58 2.34 1.12 2.91.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05a9.24 9.24 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Continue with Google"
              className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50 transition"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18z" fill="#34A853" />
                <path d="M3.95 10.7A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.16.27-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33z" fill="#FBBC05" />
                <path d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97l3.05 2.33C4.66 5.17 6.65 3.58 9 3.58z" fill="#EA4335" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}