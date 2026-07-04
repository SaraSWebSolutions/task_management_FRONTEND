import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Save,
  Building2,
  Globe,
  Wallet,
  User,
} from "lucide-react";

const defaultForm = {
  // Company details
  companyName: "",
  clientName: "",
  gstNumber: "",
  address: "",
  phone1: "", // Mobile Number
  phone2: "", // WhatsApp Number
  sameAsMobile: false,

  // Type & service details
  basicType: "",
  domainName: "",
  domainOwnership: "CLIENT", // CLIENT | US
  domainRegDate: "",
  siteLiveDate: "",
  softwareName: "",
  installationDate: "",

  // Renewal & billing
  renewalDate: "",
  totalCost: "",
  advanceAmount: "",
  advanceReceivedDate: "",
  balance: "",
  balanceReceivedExpectedDate: "",
  paymentStatus: "PENDING",
  amcAmount: "",

  // Contact person
  contactPerson: "",
  contactPersonPhone: "",
  contactPersonWhatsapp: "",
  contactPersonSameAsPhone: false,
};

// Mongo/ISO date strings need trimming down to yyyy-mm-dd for <input type="date">
const toDateInput = (value) => (value ? value.split("T")[0] : "");

export default function EditClient() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Adds `years` to a yyyy-mm-dd date string, returns yyyy-mm-dd
  const addYears = (dateStr, years) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    d.setFullYear(d.getFullYear() + years);
    return d.toISOString().split("T")[0];
  };

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    loadClient();
  }, []);

  const loadClient = async () => {
    try {
      setPageLoading(true);

      const res = await api.get(`/clients/${id}`);

      const client = res.data.client || res.data;

      // Merge into defaults so any field the API doesn't return yet
      // stays controlled instead of becoming undefined.
      setFormData((prev) => ({
        ...prev,
        ...client,
        renewalDate: toDateInput(client.renewalDate),
        domainRegDate: toDateInput(client.domainRegDate),
        siteLiveDate: toDateInput(client.siteLiveDate),
        installationDate: toDateInput(client.installationDate),
        advanceReceivedDate: toDateInput(client.advanceReceivedDate),
        balanceReceivedExpectedDate: toDateInput(
          client.balanceReceivedExpectedDate,
        ),
      }));
    } catch (error) {
      toast.error("Failed to load client");
      navigate("/clients");
    } finally {
      setPageLoading(false);
    }
  };

  // Keep company WhatsApp number in sync with Mobile Number
  useEffect(() => {
    if (formData.sameAsMobile) {
      setFormData((prev) => ({ ...prev, phone2: prev.phone1 }));
    }
  }, [formData.phone1, formData.sameAsMobile]);

  // Keep contact person's WhatsApp number in sync with their phone number
  useEffect(() => {
    if (formData.contactPersonSameAsPhone) {
      setFormData((prev) => ({
        ...prev,
        contactPersonWhatsapp: prev.contactPersonPhone,
      }));
    }
  }, [formData.contactPersonPhone, formData.contactPersonSameAsPhone]);

  // Auto-calculate balance whenever Total Cost or Advance Amount changes
  useEffect(() => {
    const total = parseFloat(formData.totalCost) || 0;
    const advance = parseFloat(formData.advanceAmount) || 0;
    const balance = total - advance;

    setFormData((prev) => ({
      ...prev,
      balance: balance > 0 ? balance : 0,
    }));
  }, [formData.totalCost, formData.advanceAmount]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const updateField = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  // Billing/Software: Renewal Date = Installation Date + 1 year
  const handleInstallationDateChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      installationDate: value,
      renewalDate: value ? addYears(value, 1) : prev.renewalDate,
    }));
  };

  // Website/E-Commerce: Renewal Date = Domain Registration Date + 1 year
  const handleDomainRegDateChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      domainRegDate: value,
      renewalDate: value ? addYears(value, 1) : prev.renewalDate,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.companyName) return toast.error("Company Name is required");
    if (!formData.clientName) return toast.error("Client Name is required");
    if (!formData.basicType) return toast.error("Please select a type");

    if (
      (formData.basicType === "WEBSITE" ||
        formData.basicType === "E-COMMERCE") &&
      !formData.domainName
    ) {
      return toast.error("Domain Name is required");
    }

    if (
      (formData.basicType === "WEBSITE" ||
        formData.basicType === "E-COMMERCE") &&
      formData.domainOwnership === "US" &&
      !formData.domainRegDate
    ) {
      return toast.error("Domain Registration Date is required");
    }

    if (
      (formData.basicType === "BILLING" || formData.basicType === "SOFTWARE") &&
      !formData.installationDate
    ) {
      return toast.error("Installation Date is required");
    }

    if (!formData.renewalDate) return toast.error("Renewal Date is required");
    if (!formData.totalCost) return toast.error("Total Cost is required");
    if (!formData.phone1) return toast.error("Mobile Number is required");

    try {
      setSaving(true);

      await api.put(`/clients/${id}`, formData);

      toast.success("Client updated successfully");

      navigate("/clients");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update client");
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
            <p className="text-slate-500">Loading Client...</p>
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
              onClick={() => navigate("/clients")}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Edit Client
              </h1>
              <p className="text-slate-500">Update client details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10 text-start">
            {/* SECTION: Company Details */}
            <Section icon={Building2} title="Company Details">
              <Field label="Company Name" required>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Enter company name"
                  className={inputClass}
                />
              </Field>

              <Field label="Client Name" required>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  placeholder="Enter client name"
                  className={inputClass}
                />
              </Field>

              <Field label="GST Number">
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      gstNumber: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="22AAAAA0000A1Z5"
                  className={`${inputClass} uppercase`}
                  maxLength={15}
                />
              </Field>

              <Field label="Mobile Number" required>
                <input
                  type="tel"
                  name="phone1"
                  value={formData.phone1}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                  className={inputClass}
                />
              </Field>

              <Field label="WhatsApp Number">
                <input
                  type="tel"
                  name="phone2"
                  value={formData.phone2}
                  onChange={handleChange}
                  disabled={formData.sameAsMobile}
                  placeholder="Enter WhatsApp number"
                  className={`${inputClass} ${
                    formData.sameAsMobile ? "bg-slate-50 text-slate-400" : ""
                  }`}
                />
                <Checkbox
                  label="Same as Mobile Number"
                  checked={formData.sameAsMobile}
                  onChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      sameAsMobile: checked,
                      phone2: checked ? prev.phone1 : prev.phone2,
                    }))
                  }
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Address">
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter address"
                    rows={3}
                    className={inputClass}
                  ></textarea>
                </Field>
              </div>
            </Section>

            {/* SECTION: Type & Service Details */}
            <Section icon={Globe} title="Type & Service Details">
              <Field label="Type" required>
                <select
                  name="basicType"
                  value={formData.basicType}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select Type</option>
                  <option value="WEBSITE">Website</option>
                  <option value="BILLING">Billing</option>
                  <option value="SOFTWARE">Software</option>
                  <option value="E-COMMERCE">E-Commerce</option>
                </select>
              </Field>

              <div className="hidden md:block" />

              {/* Website & E-Commerce: domain fields */}
              {(formData.basicType === "WEBSITE" ||
                formData.basicType === "E-COMMERCE") && (
                <>
                  <Field label="Domain Name" required>
                    <input
                      type="text"
                      name="domainName"
                      value={formData.domainName}
                      onChange={handleChange}
                      placeholder="Enter domain name"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Domain Owned By">
                    <RadioPill
                      value={formData.domainOwnership}
                      onChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          domainOwnership: val,
                        }))
                      }
                      options={[
                        { value: "CLIENT", label: "Client" },
                        { value: "US", label: "Us" },
                      ]}
                    />
                  </Field>

                  {formData.domainOwnership === "US" && (
                    <>
                      <Field label="Domain Registration Date" required>
                        <input
                          type="date"
                          value={formData.domainRegDate}
                          onChange={handleDomainRegDateChange}
                          className={inputClass}
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Renewal Date is auto-set to one year from this
                          date.
                        </p>
                      </Field>

                      <Field label="Site Live Date">
                        <input
                          type="date"
                          value={formData.siteLiveDate}
                          onChange={updateField("siteLiveDate")}
                          className={inputClass}
                        />
                      </Field>
                    </>
                  )}
                </>
              )}

              {/* Billing / Software fields */}
              {(formData.basicType === "BILLING" ||
                formData.basicType === "SOFTWARE") && (
                <>
                  <Field label="Software Name">
                    <input
                      type="text"
                      name="softwareName"
                      value={formData.softwareName}
                      onChange={handleChange}
                      placeholder="Enter software name"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Installation Date" required>
                    <input
                      type="date"
                      name="installationDate"
                      value={formData.installationDate}
                      onChange={handleInstallationDateChange}
                      className={inputClass}
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Renewal Date is auto-set to one year from this date.
                    </p>
                  </Field>
                </>
              )}
            </Section>

            {/* SECTION: Renewal & Billing */}
            <Section icon={Wallet} title="Renewal & Billing">
              <Field label="Renewal Date" required>
                <input
                  type="date"
                  name="renewalDate"
                  value={formData.renewalDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </Field>

              <Field label="Payment Status">
                <select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="PAID">Paid</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="PENDING">Pending</option>
                </select>
              </Field>

              <Field label="Total Cost" required>
                <input
                  type="number"
                  name="totalCost"
                  value={formData.totalCost}
                  onChange={handleChange}
                  placeholder="Enter total amount"
                  className={inputClass}
                />
              </Field>

              <Field label="AMC Amount">
                <input
                  type="number"
                  name="amcAmount"
                  value={formData.amcAmount}
                  onChange={handleChange}
                  placeholder="Enter AMC amount"
                  className={inputClass}
                />
              </Field>

              <Field label="Advance Amount">
                <input
                  type="number"
                  name="advanceAmount"
                  value={formData.advanceAmount}
                  onChange={handleChange}
                  placeholder="Enter advance amount"
                  className={inputClass}
                />
              </Field>

              <Field label="Advance Received Date">
                <input
                  type="date"
                  name="advanceReceivedDate"
                  value={formData.advanceReceivedDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </Field>

              <Field label="Balance">
                <input
                  type="number"
                  value={formData.balance}
                  readOnly
                  className={`${inputClass} bg-slate-50 text-slate-500 cursor-not-allowed`}
                />
              </Field>

              <Field label="Balance Received Expected Date">
                <input
                  type="date"
                  name="balanceReceivedExpectedDate"
                  value={formData.balanceReceivedExpectedDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </Field>
            </Section>

            {/* SECTION: Contact Person */}
            <Section icon={User} title="Contact Person">
              <Field label="Contact Person Name">
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="Enter contact person name"
                  className={inputClass}
                />
              </Field>

              <div className="hidden md:block" />

              <Field label="Phone Number">
                <input
                  type="tel"
                  name="contactPersonPhone"
                  value={formData.contactPersonPhone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className={inputClass}
                />
              </Field>

              <Field label="WhatsApp Number">
                <input
                  type="tel"
                  name="contactPersonWhatsapp"
                  value={formData.contactPersonWhatsapp}
                  onChange={handleChange}
                  disabled={formData.contactPersonSameAsPhone}
                  placeholder="Enter WhatsApp number"
                  className={`${inputClass} ${
                    formData.contactPersonSameAsPhone
                      ? "bg-slate-50 text-slate-400"
                      : ""
                  }`}
                />
                <Checkbox
                  label="Same as Phone Number"
                  checked={formData.contactPersonSameAsPhone}
                  onChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactPersonSameAsPhone: checked,
                      contactPersonWhatsapp: checked
                        ? prev.contactPersonPhone
                        : prev.contactPersonWhatsapp,
                    }))
                  }
                />
              </Field>
            </Section>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/clients")}
                className="px-6 py-3 rounded-xl border hover:bg-slate-50 transition-colors mt-6"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="bg-[#2b1247] text-white px-6 py-3 rounded-xl flex items-center gap-2 disabled:opacity-70 hover:bg-[#3a1a5e] transition-colors mt-6"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Update Client
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
  "w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#2b1247] focus:border-transparent outline-none transition-shadow disabled:cursor-not-allowed";

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

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 mt-2 text-sm text-slate-600 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-slate-300 text-[#2b1247] focus:ring-[#2b1247]"
      />
      {label}
    </label>
  );
}

function RadioPill({ options, value, onChange }) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-3 rounded-xl text-sm font-medium border transition-colors flex-1 ${
            value === opt.value
              ? "bg-[#2b1247] text-white border-[#2b1247]"
              : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}