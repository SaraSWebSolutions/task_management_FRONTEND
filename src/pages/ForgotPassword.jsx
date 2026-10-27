import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import AuthLayout, { authInputClass } from "../components/AuthLayout";

const RESEND_SECONDS = 60;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Count down before the person can ask for another email.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async (e) => {
    e?.preventDefault();

    if (!email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(email)) return toast.error("Enter a valid email address");

    try {
      setLoading(true);
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {sent ? (
        <>
          <div className="h-12 w-12 rounded-2xl bg-violet-100 text-brand flex items-center justify-center mb-5">
            <MailCheck size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Check your email</h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            If an account exists for <span className="font-semibold text-slate-700">{email}</span>, we
            have sent a link to reset your password. The link is valid for 30 minutes.
          </p>

          <button
            type="button"
            onClick={submit}
            disabled={loading || cooldown > 0}
            className="mt-6 w-full py-3 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend email"}
          </button>

          <p className="text-xs text-slate-400 mt-4">Didn&apos;t get it? Check your spam folder.</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-slate-800">Forgot password?</h1>
          <p className="text-slate-500 text-sm mt-2 mb-8">
            Enter your account email and we&apos;ll send you a link to reset your password.
          </p>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                autoFocus
                placeholder="Example@gmail.com"
                className={authInputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                loading ? "bg-gray-400 cursor-not-allowed text-white" : "bg-brand hover:bg-brand-hover text-white"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>
        </>
      )}

      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-brand hover:text-brand-hover"
      >
        <ArrowLeft size={16} /> Back to login
      </Link>
    </AuthLayout>
  );
}
