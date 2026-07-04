import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api/axios";
import toast from "react-hot-toast";
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

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mongo/ISO date strings need trimming down to yyyy-mm-dd for <input type="date">
  const toDateInput = (value) => (value ? value.split("T")[0] : "");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    dob: "",
    bloodGroup: "",
    role: "EMPLOYEE",
    department: "",
    designation: "Developer",
    status: "ACTIVE",
    joiningDate: "",
    salary: "",
    otAmount: "",
    address: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
  });

  useEffect(() => {
    loadEmployee();
  }, []);

  const loadEmployee = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/employees/${id}`);

      // Merge so any fields missing from the API response keep their
      // controlled-input defaults instead of becoming undefined.
      setForm((prev) => ({
        ...prev,
        ...res.data,
        password: "",
        dob: toDateInput(res.data.dob),
        joiningDate: toDateInput(res.data.joiningDate),
      }));
    } catch (error) {
      toast.error("Failed to load employee");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.employeeId) return toast.error("Employee ID is required");
    if (!form.name) return toast.error("Employee Name is required");
    if (!form.email) return toast.error("Employee Email is required");
    if (!form.phone) return toast.error("Employee Phone is required");
    if (!form.department) return toast.error("Employee Department is required");

    try {
      setUpdating(true);

      // Don't send an empty password — leave it unchanged on the server
      // unless the admin actually typed a new one.
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      await api.put(`/employees/${id}`, payload);

      toast.success("Employee Updated Successfully");

      navigate("/employees");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update employee",
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="h-[70vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-[#2b1247] rounded-full animate-spin"></div>
            <p className="text-slate-500">Loading Employee...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto pb-12">
        <div className="bg-white rounded-3xl border shadow-sm p-6 md:p-10">
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
                Edit Employee
              </h1>
              <p className="text-slate-500">Update employee details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10 text-start">
            {/* SECTION: Basic Info */}
            <Section icon={User} title="Basic Information">
              <Field label="Employee ID" required>
                <input
                  type="text"
                  value={form.employeeId || ""}
                  onChange={updateField("employeeId")}
                  className={inputClass}
                />
              </Field>

              <Field label="Employee Name" required>
                <input
                  type="text"
                  value={form.name || ""}
                  onChange={updateField("name")}
                  className={inputClass}
                />
              </Field>

              <Field label="Date of Birth">
                <input
                  type="date"
                  value={form.dob || ""}
                  onChange={updateField("dob")}
                  className={inputClass}
                />
              </Field>

              <Field label="Blood Group">
                <select
                  value={form.bloodGroup || ""}
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
                  value={form.email || ""}
                  onChange={updateField("email")}
                  className={inputClass}
                />
              </Field>

              <Field label="Mobile Number" required>
                <input
                  type="text"
                  value={form.phone || ""}
                  onChange={updateField("phone")}
                  className={inputClass}
                />
              </Field>

              <Field label="Reset Password">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password || ""}
                    onChange={updateField("password")}
                    placeholder="Leave blank to keep current password"
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
                  Only fill this in if you want to set a new password.
                </p>
              </Field>
            </Section>

            {/* SECTION: Employment Details */}
            <Section icon={Briefcase} title="Employment Details">
              <Field label="Role">
                <select
                  value={form.role || "EMPLOYEE"}
                  onChange={updateField("role")}
                  className={inputClass}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </Field>

              <Field label="Designation">
                <select
                  value={form.designation || "Developer"}
                  onChange={updateField("designation")}
                  className={inputClass}
                >
                  <option value="Developer">Developer</option>
                  <option value="Tester">Tester</option>
                  <option value="UI Designer">UI Designer</option>
                  <option value="Team Lead">Team Lead</option>
                  <option value="Project Manager">Project Manager</option>
                </select>
              </Field>

              <Field label="Department" required>
                <input
                  type="text"
                  value={form.department || ""}
                  onChange={updateField("department")}
                  className={inputClass}
                />
              </Field>

              <Field label="Joining Date">
                <input
                  type="date"
                  value={form.joiningDate || ""}
                  onChange={updateField("joiningDate")}
                  className={inputClass}
                />
              </Field>

              <Field label="Status">
                <select
                  value={form.status || "ACTIVE"}
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
              <Field label="Salary">
                <input
                  type="number"
                  value={form.salary || ""}
                  onChange={updateField("salary")}
                  placeholder="50000"
                  className={inputClass}
                />
              </Field>

              <Field label="OT Amount">
                <input
                  type="number"
                  value={form.otAmount || ""}
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
                  value={form.bankName || ""}
                  onChange={updateField("bankName")}
                  placeholder="State Bank of India"
                  className={inputClass}
                />
              </Field>

              <Field label="Account Number">
                <input
                  type="text"
                  value={form.accountNumber || ""}
                  onChange={updateField("accountNumber")}
                  placeholder="1234567890"
                  className={inputClass}
                />
              </Field>

              <Field label="IFSC Code">
                <input
                  type="text"
                  value={form.ifscCode || ""}
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
                  value={form.branch || ""}
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
                  value={form.address || ""}
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
                onClick={() => navigate("/employees")}
                className="px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors mt-6"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={updating}
                className="px-6 py-3 bg-[#2b1247] hover:bg-[#1d0d33] text-white rounded-xl font-medium disabled:opacity-70 flex items-center gap-2 transition-colors mt-6"
              >
                {updating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Update Employee
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