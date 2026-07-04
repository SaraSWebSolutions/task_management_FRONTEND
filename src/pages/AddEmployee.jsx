import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  Briefcase,
  Wallet,
  MapPin,
  Landmark,
  Eye,
  EyeOff,
} from "lucide-react";

export default function AddEmployee() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    password: "Welcome@#2026",
    dob: "",
    bloodGroup: "",
    designation: "Developer",
    department: "",
    role: "EMPLOYEE",
    joiningDate: "",
    status: "ACTIVE",
    salary: "",
    otAmount: "",
    address: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
  });

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const updateField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.employeeId) return toast.error("Employee ID is required");
    if (!form.name) return toast.error("Employee Name is required");
    if (!form.email) return toast.error("Email is required");
    if (!form.phone) return toast.error("Mobile Number is required");
    if (!form.password) return toast.error("Password is required");
    if (!form.department) return toast.error("Department is required");
    if (!form.joiningDate) return toast.error("Joining Date is required");
    if (!form.salary) return toast.error("Salary is required");

    try {
      setSaving(true);

      await api.post("/employees", form);

      toast.success("Employee Added Successfully");

      navigate("/employees");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add employee");
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <Layout>
        <div className="h-[70vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-[#2b1247] rounded-full animate-spin"></div>
            <p className="text-slate-500">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto pb-12">
        <div className="bg-white rounded-3xl shadow-sm border p-6 md:p-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              type="button"
              onClick={() => navigate("/employees")}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Add Employee
              </h1>
              <p className="text-slate-500">Create a new employee record</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10 text-start">
            {/* SECTION: Basic Info */}
            <Section icon={User} title="Basic Information">
              <Field label="Employee ID" required>
                <input
                  type="text"
                  value={form.employeeId}
                  onChange={updateField("employeeId")}
                  placeholder="SWS001"
                  className={inputClass}
                />
              </Field>

              <Field label="Employee Name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={updateField("name")}
                  placeholder="John Doe"
                  className={inputClass}
                />
              </Field>

              <Field label="Date of Birth">
                <input
                  type="date"
                  value={form.dob}
                  onChange={updateField("dob")}
                  className={inputClass}
                />
              </Field>

              <Field label="Blood Group">
                <select
                  value={form.bloodGroup}
                  onChange={updateField("bloodGroup")}
                  className={inputClass}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </Field>
            </Section>

            {/* SECTION: Contact & Access */}
            <Section icon={Phone} title="Contact & Access">
              <Field label="Email" required>
                <input
                  type="email"
                  value={form.email}
                  onChange={updateField("email")}
                  placeholder="example@gmail.com"
                  className={inputClass}
                />
              </Field>

              <Field label="Mobile Number" required>
                <input
                  type="text"
                  value={form.phone}
                  onChange={updateField("phone")}
                  placeholder="+91 9876543210"
                  className={inputClass}
                />
              </Field>

              <Field label="Password" required>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={updateField("password")}
                    placeholder="Abcde@123#"
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Defaults to a temporary password; the employee can change it
                  after first login.
                </p>
              </Field>
            </Section>

            {/* SECTION: Employment Details */}
            <Section icon={Briefcase} title="Employment Details">
              <Field label="Role">
                <select
                  value={form.role}
                  onChange={updateField("role")}
                  className={inputClass}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </Field>

              <Field label="Designation">
                <select
                  value={form.designation}
                  onChange={updateField("designation")}
                  className={inputClass}
                >
                  <option>Developer</option>
                  <option>Tester</option>
                  <option>UI Designer</option>
                  <option>Team Lead</option>
                  <option>Project Manager</option>
                </select>
              </Field>

              <Field label="Department" required>
                <input
                  type="text"
                  value={form.department}
                  onChange={updateField("department")}
                  placeholder="Development"
                  className={inputClass}
                />
              </Field>

              <Field label="Joining Date" required>
                <input
                  type="date"
                  value={form.joiningDate}
                  onChange={updateField("joiningDate")}
                  className={inputClass}
                />
              </Field>

              <Field label="Status">
                <select
                  value={form.status}
                  onChange={updateField("status")}
                  className={inputClass}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </Field>
            </Section>

            {/* SECTION: Compensation */}
            <Section icon={Wallet} title="Compensation">
              <Field label="Salary" required>
                <input
                  type="number"
                  value={form.salary}
                  onChange={updateField("salary")}
                  placeholder="50000"
                  className={inputClass}
                />
              </Field>

              <Field label="OT Amount">
                <input
                  type="number"
                  value={form.otAmount}
                  onChange={updateField("otAmount")}
                  placeholder="1000"
                  className={inputClass}
                />
              </Field>
            </Section>

            {/* SECTION: Bank Details */}
            <Section icon={Landmark} title="Bank Details">
              <Field label="Bank Name">
                <input
                  type="text"
                  value={form.bankName}
                  onChange={updateField("bankName")}
                  placeholder="State Bank of India"
                  className={inputClass}
                />
              </Field>

              <Field label="Account Number">
                <input
                  type="text"
                  value={form.accountNumber}
                  onChange={updateField("accountNumber")}
                  placeholder="1234567890"
                  className={inputClass}
                />
              </Field>

              <Field label="IFSC Code">
                <input
                  type="text"
                  value={form.ifscCode}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      ifscCode: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="SBIN0001234"
                  className={`${inputClass} uppercase`}
                  maxLength={11}
                />
              </Field>

              <Field label="Branch">
                <input
                  type="text"
                  value={form.branch}
                  onChange={updateField("branch")}
                  placeholder="Madurai Main Branch"
                  className={inputClass}
                />
              </Field>
            </Section>

            {/* SECTION: Address */}
            <Section icon={MapPin} title="Address">
              <div className="md:col-span-2">
                <textarea
                  value={form.address}
                  onChange={updateField("address")}
                  placeholder="123 Main St, City, Country"
                  rows={3}
                  className={inputClass}
                ></textarea>
              </div>
            </Section>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t">
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="px-6 py-3 border rounded-xl hover:bg-slate-50 transition-colors mt-6"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-[#2b1247] text-white rounded-xl disabled:opacity-70 flex items-center gap-2 hover:bg-[#3a1a5e] transition-colors mt-6"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Employee
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

/* ---------- Shared styling & small building blocks ---------- */

const inputClass =
  "w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#2b1247] focus:border-transparent outline-none transition-shadow";

function Section({ icon: Icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-[#2b1247]/10 text-[#2b1247]">
          <Icon size={18} />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-6">{children}</div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block mb-2 text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}