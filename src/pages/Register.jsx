import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import logo from "../assets/logo.png";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await api.post("/auth/register", form);

      toast.success("Registration Successful");

      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration Failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[var(--brand-dark)] via-[var(--brand)] to-[var(--brand-dark)] flex items-center justify-center px-4">
      <div className="bg-white shadow-2xl rounded-3xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <img src={logo} alt="SaraS logo" className="mx-auto mb-2" />

          <p className="text-slate-600 font-semibold text-lg mt-4">Register your account</p>
        </div>

        <form onSubmit={handleRegister}>
          <div className="mb-4">
            {/* <label>Name</label> */}

            <input
              type="text"
              placeholder="Full Name"
              className="w-full border mt-2 p-3 rounded-lg focus:ring-2 focus:ring-[var(--brand)] outline-none"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />
          </div>

          <div className="mb-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full border mt-2 p-3 rounded-lg focus:ring-2 focus:ring-[var(--brand)] outline-none"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
            />
          </div>

          <div className="mb-4 relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full border p-3 pr-12 rounded-lg focus:ring-2 focus:ring-[var(--brand)] outline-none"
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
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="mb-5">
            <select
              className="w-full border mt-2 p-3 rounded-lg focus:ring-2 focus:ring-[var(--brand)] outline-none"
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value,
                })
              }
            >
              <option value="EMPLOYEE">Employee</option>

              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <button className="w-full bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white py-3 rounded-lg font-semibold">
            Register
          </button>

          <div className="text-center mt-5">
            <span>Already have an account?</span>

            <Link to="/" className="text-[var(--brand)] ml-2 font-semibold">
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
