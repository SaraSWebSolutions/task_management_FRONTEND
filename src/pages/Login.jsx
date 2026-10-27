import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import logo from "../assets/logo.png";
import banner from "../assets/login-banner.svg";
import { landingPath } from "../utils/permissions";

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
      localStorage.setItem("permissions", JSON.stringify(res.data.permissions || []));

      toast.success("Login Successful");

      navigate(landingPath(res.data.user));
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid Email or Password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh w-full grid lg:grid-cols-12 bg-white overflow-hidden">
      {/* Left side - banner image (8 cols, desktop only) */}
      <div className="hidden lg:block lg:col-span-8 h-full relative overflow-hidden bg-brand">
        <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-violet-950/70 via-violet-900/10 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 px-14 pb-14 text-left">
          <h2 className="text-white text-3xl font-semibold leading-tight">
            Plan. Assign. Deliver.
          </h2>
          <p className="text-white/70 text-sm mt-3 max-w-md leading-relaxed">
            Leads, projects, tasks and your whole team, managed from one
            simple dashboard.
          </p>
        </div>
      </div>

      {/* Right side - login form (4 cols) */}
      <div className="col-span-12 lg:col-span-4 h-full flex flex-col overflow-y-auto">
        {/* Phones / tablets: compact banner strip */}
        <div className="lg:hidden relative h-36 sm:h-48 shrink-0 overflow-hidden bg-brand">
          <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-violet-950/70 to-transparent" />
          <p className="absolute bottom-3 left-5 text-white text-lg font-semibold">Plan. Assign. Deliver.</p>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 sm:px-10">
        <div className="w-full max-w-sm py-8 sm:py-10 text-left">
          <img src={logo} alt="SaraS logo" className="h-10 mb-6" />
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
                className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-sm focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white outline-none transition"
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
                  className="w-full border border-slate-200 bg-slate-50 p-3 pr-12 rounded-xl text-sm focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white outline-none transition"
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-hover"
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
                  className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
                <span className="text-sm text-slate-600">Remember Me</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-brand hover:text-brand-hover"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-brand hover:bg-brand-hover text-white"
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
        </div>
        </div>
      </div>
    </div>
  );
}
