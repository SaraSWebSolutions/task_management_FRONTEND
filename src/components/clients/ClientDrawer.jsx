// Add / Edit client form shown in a right-side drawer.
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Drawer from "../Drawer";
import { Field, GhostButton, PrimaryButton, Spinner, inputClass } from "../ui";

const ic = `${inputClass} !py-2.5`;

const DEFAULT_FORM = {
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

// Adds `years` to a yyyy-mm-dd date string, returns yyyy-mm-dd
const addYears = (dateStr, years) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split("T")[0];
};

const isWeb = (type) => type === "WEBSITE" || type === "E-COMMERCE";
const isSoft = (type) => type === "BILLING" || type === "SOFTWARE";

function Select({ value, onChange, children, name }) {
  return (
    <div className="relative">
      <select name={name} value={value} onChange={onChange} className={`${ic} appearance-none pr-10`}>
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}

function Group({ title, children }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand">{title}</span>
        <span className="h-px flex-1 bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">{children}</div>
    </section>
  );
}

const Full = ({ children }) => <div className="sm:col-span-2">{children}</div>;

function Check({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 mt-2 text-sm text-slate-600 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-brand"
      />
      {label}
    </label>
  );
}

function Pills({ options, value, onChange }) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
            value === opt.value
              ? "border-brand bg-brand text-white"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function ClientDrawer({ clientId, onClose, onSaved }) {
  const editing = Boolean(clientId);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;

    api
      .get(`/clients/${clientId}`)
      .then((res) => {
        if (cancelled) return;
        const client = res.data.client || res.data;
        // Merge into defaults so any field the API doesn't return stays controlled.
        setForm({
          ...DEFAULT_FORM,
          ...client,
          renewalDate: toDateInput(client.renewalDate),
          domainRegDate: toDateInput(client.domainRegDate),
          siteLiveDate: toDateInput(client.siteLiveDate),
          installationDate: toDateInput(client.installationDate),
          advanceReceivedDate: toDateInput(client.advanceReceivedDate),
          balanceReceivedExpectedDate: toDateInput(client.balanceReceivedExpectedDate),
        });
      })
      .catch(() => {
        if (cancelled) return;
        toast.error("Failed to load client");
        onClose();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // Balance is derived from Total Cost and Advance Amount (the server recalculates on save).
  const balance = Math.max(0, (parseFloat(form.totalCost) || 0) - (parseFloat(form.advanceAmount) || 0));

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  // Keep WhatsApp numbers in sync with the phone number while "same as" is ticked.
  const onMobile = (e) => {
    const v = e.target.value;
    setForm((p) => ({ ...p, phone1: v, phone2: p.sameAsMobile ? v : p.phone2 }));
  };
  const onContactPhone = (e) => {
    const v = e.target.value;
    setForm((p) => ({
      ...p,
      contactPersonPhone: v,
      contactPersonWhatsapp: p.contactPersonSameAsPhone ? v : p.contactPersonWhatsapp,
    }));
  };
  const field = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  // Software: Renewal Date = Installation Date + 1 year
  const onInstallationDate = (e) => {
    const value = e.target.value;
    setForm((p) => ({
      ...p,
      installationDate: value,
      renewalDate: value ? addYears(value, 1) : p.renewalDate,
    }));
  };

  // Website: Renewal Date = Domain Registration Date + 1 year
  const onDomainRegDate = (e) => {
    const value = e.target.value;
    setForm((p) => ({
      ...p,
      domainRegDate: value,
      renewalDate: value ? addYears(value, 1) : p.renewalDate,
    }));
  };

  const save = async () => {
    if (!form.companyName) return toast.error("Company Name is required");
    if (!form.clientName) return toast.error("Client Name is required");
    if (!form.basicType) return toast.error("Please select a type");
    if (isWeb(form.basicType) && !form.domainName) return toast.error("Domain Name is required");
    if (isWeb(form.basicType) && form.domainOwnership === "US" && !form.domainRegDate) {
      return toast.error("Domain Registration Date is required");
    }
    if (isSoft(form.basicType) && !form.installationDate) {
      return toast.error("Installation Date is required");
    }
    if (!form.renewalDate) return toast.error("Renewal Date is required");
    if (!form.totalCost) return toast.error("Total Cost is required");
    if (!form.phone1) return toast.error("Mobile Number is required");

    try {
      setSaving(true);
      if (editing) {
        await api.put(`/clients/${clientId}`, { ...form, balance });
        toast.success("Client updated successfully");
      } else {
        await api.post("/clients", { ...form, balance });
        toast.success("Client added successfully");
      }
      onSaved();
    } catch (error) {
      toast.error(error?.response?.data?.message || `Failed to ${editing ? "update" : "add"} client`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={editing ? "Edit Client" : "Add Client"}
      subtitle={editing ? "Update client details" : "Create a new client record"}
      width="sm:max-w-[760px]"
      onClose={onClose}
      footer={
        <>
          <GhostButton type="button" onClick={onClose} disabled={saving} className="!py-2.5">
            Cancel
          </GhostButton>
          <PrimaryButton type="button" onClick={save} disabled={saving || loading} className="!py-2.5">
            {saving ? "Saving..." : editing ? "Update Client" : "Save Client"}
          </PrimaryButton>
        </>
      }
    >
      {loading ? (
        <Spinner label="Loading client..." />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-8"
        >
          <Group title="Company details">
            <Field label="Company Name" required>
              <input name="companyName" value={form.companyName} onChange={handleChange} placeholder="Enter company name" className={ic} />
            </Field>
            <Field label="Client Name" required>
              <input name="clientName" value={form.clientName} onChange={handleChange} placeholder="Enter client name" className={ic} />
            </Field>
            <Field label="GST Number">
              <input
                name="gstNumber"
                value={form.gstNumber}
                onChange={(e) => setForm((p) => ({ ...p, gstNumber: e.target.value.toUpperCase() }))}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                className={`${ic} uppercase`}
              />
            </Field>
            <Field label="Mobile Number" required>
              <input type="tel" name="phone1" value={form.phone1} onChange={onMobile} placeholder="Enter mobile number" className={ic} />
            </Field>
            <Field label="WhatsApp Number">
              <input
                type="tel"
                name="phone2"
                value={form.phone2}
                onChange={handleChange}
                disabled={form.sameAsMobile}
                placeholder="Enter WhatsApp number"
                className={`${ic} ${form.sameAsMobile ? "bg-slate-50 text-slate-400" : ""}`}
              />
              <Check
                label="Same as Mobile Number"
                checked={form.sameAsMobile}
                onChange={(checked) =>
                  setForm((p) => ({ ...p, sameAsMobile: checked, phone2: checked ? p.phone1 : p.phone2 }))
                }
              />
            </Field>
            <span className="hidden sm:block" />
            <Full>
              <Field label="Address">
                <textarea name="address" value={form.address} onChange={handleChange} placeholder="Enter address" rows={3} className={ic} />
              </Field>
            </Full>
          </Group>

          <Group title="Type & service">
            <Field label="Type" required>
              <Select name="basicType" value={form.basicType} onChange={handleChange}>
                <option value="">Select type</option>
                <option value="WEBSITE">Website</option>
                <option value="BILLING">Billing</option>
                <option value="SOFTWARE">Software</option>
                <option value="E-COMMERCE">E-Commerce</option>
              </Select>
            </Field>
            <span className="hidden sm:block" />

            {isWeb(form.basicType) && (
              <>
                <Field label="Domain Name" required>
                  <input name="domainName" value={form.domainName} onChange={handleChange} placeholder="Enter domain name" className={ic} />
                </Field>
                <Field label="Domain Owned By">
                  <Pills
                    value={form.domainOwnership}
                    onChange={(val) => setForm((p) => ({ ...p, domainOwnership: val }))}
                    options={[
                      { value: "CLIENT", label: "Client" },
                      { value: "US", label: "Us" },
                    ]}
                  />
                </Field>

                {form.domainOwnership === "US" && (
                  <>
                    <Field label="Domain Registration Date" required hint="Renewal Date is auto-set to one year from this date.">
                      <input type="date" value={form.domainRegDate} onChange={onDomainRegDate} className={ic} />
                    </Field>
                    <Field label="Site Live Date">
                      <input type="date" value={form.siteLiveDate} onChange={field("siteLiveDate")} className={ic} />
                    </Field>
                  </>
                )}
              </>
            )}

            {isSoft(form.basicType) && (
              <>
                <Field label="Software Name">
                  <input name="softwareName" value={form.softwareName} onChange={handleChange} placeholder="Enter software name" className={ic} />
                </Field>
                <Field label="Installation Date" required hint="Renewal Date is auto-set to one year from this date.">
                  <input type="date" name="installationDate" value={form.installationDate} onChange={onInstallationDate} className={ic} />
                </Field>
              </>
            )}
          </Group>

          <Group title="Renewal & billing">
            <Field label="Renewal Date" required>
              <input type="date" name="renewalDate" value={form.renewalDate} onChange={handleChange} className={ic} />
            </Field>
            <Field label="Payment Status">
              <Select name="paymentStatus" value={form.paymentStatus} onChange={handleChange}>
                <option value="PAID">Paid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PENDING">Pending</option>
              </Select>
            </Field>
            <Field label="Total Cost" required>
              <input type="number" name="totalCost" value={form.totalCost} onChange={handleChange} placeholder="Enter total amount" className={ic} />
            </Field>
            <Field label="AMC Amount">
              <input type="number" name="amcAmount" value={form.amcAmount} onChange={handleChange} placeholder="Enter AMC amount" className={ic} />
            </Field>
            <Field label="Advance Amount">
              <input type="number" name="advanceAmount" value={form.advanceAmount} onChange={handleChange} placeholder="Enter advance amount" className={ic} />
            </Field>
            <Field label="Advance Received Date">
              <input type="date" name="advanceReceivedDate" value={form.advanceReceivedDate} onChange={handleChange} className={ic} />
            </Field>
            <Field label="Balance">
              <input type="number" value={balance} readOnly className={`${ic} bg-slate-50 text-slate-500 cursor-not-allowed`} />
            </Field>
            <Field label="Balance Expected Date">
              <input type="date" name="balanceReceivedExpectedDate" value={form.balanceReceivedExpectedDate} onChange={handleChange} className={ic} />
            </Field>
          </Group>

          <Group title="Contact person">
            <Field label="Contact Person Name">
              <input name="contactPerson" value={form.contactPerson} onChange={handleChange} placeholder="Enter contact person name" className={ic} />
            </Field>
            <span className="hidden sm:block" />
            <Field label="Phone Number">
              <input type="tel" name="contactPersonPhone" value={form.contactPersonPhone} onChange={onContactPhone} placeholder="Enter phone number" className={ic} />
            </Field>
            <Field label="WhatsApp Number">
              <input
                type="tel"
                name="contactPersonWhatsapp"
                value={form.contactPersonWhatsapp}
                onChange={handleChange}
                disabled={form.contactPersonSameAsPhone}
                placeholder="Enter WhatsApp number"
                className={`${ic} ${form.contactPersonSameAsPhone ? "bg-slate-50 text-slate-400" : ""}`}
              />
              <Check
                label="Same as Phone Number"
                checked={form.contactPersonSameAsPhone}
                onChange={(checked) =>
                  setForm((p) => ({
                    ...p,
                    contactPersonSameAsPhone: checked,
                    contactPersonWhatsapp: checked ? p.contactPersonPhone : p.contactPersonWhatsapp,
                  }))
                }
              />
            </Field>
          </Group>

          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
        </form>
      )}
    </Drawer>
  );
}
