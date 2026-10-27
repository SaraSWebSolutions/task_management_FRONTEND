import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Link2Off, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import AuthLayout, { authInputClass } from "../components/AuthLayout";

function PasswordInput({ label, value, onChange, show, onToggle, placeholder, autoFocus }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          autoFocus={autoFocus}
          autoComplete="new-password"
          placeholder={placeholder}
          className={`${authInputClass} pr-12`}
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-hover"
        >
          {show ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("checking"); // checking | valid | invalid
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check the link first so people don't type a password for an expired link.
  useEffect(() => {
    let cancelled = false;

    api
      .get(`/auth/reset-password/${token}`)
      .then(() => !cancelled && setStatus("valid"))
      .catch(() => !cancelled && setStatus("invalid"));

    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();

    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");

    try {
      setLoading(true);
      await api.post(`/auth/reset-password/${token}`, { password });
      toast.success("Password reset successful. Please sign in.");
      navigate("/", { replace: true });
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to reset password";
      toast.error(message);
      if (/invalid or has expired/i.test(message)) setStatus("invalid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {status === "checking" && (
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <Loader2 size={18} className="animate-spin" /> Checking your link...
        </div>
      )}

      {status === "invalid" && (
        <>
          <div className="h-12 w-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-5">
            <Link2Off size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Link expired</h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            This password reset link is invalid or has expired. Request a new one to continue.
          </p>
          <Link
            to="/forgot-password"
            className="mt-6 w-full py-3 rounded-xl text-sm font-semibold bg-brand hover:bg-brand-hover text-white flex items-center justify-center"
          >
            Request a new link
          </Link>
        </>
      )}

      {status === "valid" && (
        <>
          <h1 className="text-2xl font-bold text-slate-800">Set a new password</h1>
          <p className="text-slate-500 text-sm mt-2 mb-8">
            Choose a strong password with at least 8 characters.
          </p>

          <form onSubmit={submit} className="space-y-5">
            <PasswordInput
              label="New Password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              show={show}
              onToggle={() => setShow((s) => !s)}
              autoFocus
            />
            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              show={show}
              onToggle={() => setShow((s) => !s)}
            />

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                loading ? "bg-gray-400 cursor-not-allowed text-white" : "bg-brand hover:bg-brand-hover text-white"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Resetting...
                </>
              ) : (
                "Reset password"
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
