import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { Modal, Field, PrimaryButton, GhostButton, inputClass } from "../ui";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "../../constants/finance";
import { fmtMoney, toDateInput } from "../../utils/format";
import { apiError } from "./helpers";

const blank = () => ({ invoice: "", customerName: "", amount: "", method: "UPI", date: toDateInput(new Date()), status: "SUCCESSFUL", reference: "", notes: "" });

// Record a payment, optionally against an open invoice.
// openInvoices: [{ _id, number, clientName, balance }]
export default function PaymentModal({ open, onClose, onSaved, openInvoices = [], invoiceId = "" }) {
  const [form, setForm] = useState(blank());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const inv = openInvoices.find((i) => i._id === invoiceId);
    setForm({ ...blank(), invoice: invoiceId || "", customerName: inv?.clientName || "", amount: inv ? inv.balance : "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoiceId]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickInvoice = (e) => {
    const inv = openInvoices.find((i) => i._id === e.target.value);
    setForm((f) => ({ ...f, invoice: e.target.value, customerName: inv ? inv.clientName : f.customerName, amount: inv ? inv.balance : f.amount }));
  };

  const selected = openInvoices.find((i) => i._id === form.invoice);

  const save = async () => {
    if (!form.invoice && !form.customerName.trim()) return toast.error("Select an invoice or enter the customer");
    if (!(Number(form.amount) > 0)) return toast.error("Enter a valid amount");
    if (!form.date) return toast.error("Select the payment date");
    try {
      setSaving(true);
      await api.post("/finance/payments", { ...form, amount: Number(form.amount) });
      toast.success("Payment recorded");
      onClose();
      onSaved?.();
    } catch (error) {
      toast.error(apiError(error, "Failed to record payment"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Record Payment"
      onClose={onClose}
      footer={<><GhostButton onClick={onClose}>Cancel</GhostButton><PrimaryButton disabled={saving} onClick={save}>Save Payment</PrimaryButton></>}
    >
      <div className="space-y-5">
        <Field label="Invoice" hint={selected ? `Balance due ${fmtMoney(selected.balance)}` : "Leave empty for a payment that has no invoice"}>
          <select value={form.invoice} onChange={pickInvoice} className={inputClass}>
            <option value="">No invoice</option>
            {openInvoices.map((i) => <option key={i._id} value={i._id}>{i.number} - {i.clientName} ({fmtMoney(i.balance)} due)</option>)}
          </select>
        </Field>
        {!form.invoice && <Field label="Customer" required><input value={form.customerName} onChange={set("customerName")} placeholder="Customer name" className={inputClass} /></Field>}
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Amount (₹)" required><input type="number" min="0" step="0.01" value={form.amount} onChange={set("amount")} placeholder="0.00" className={inputClass} /></Field>
          <Field label="Date" required><input type="date" value={form.date} onChange={set("date")} className={inputClass} /></Field>
          <Field label="Method">
            <select value={form.method} onChange={set("method")} className={inputClass}>
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={set("status")} className={inputClass}>
              {PAYMENT_STATUSES.filter((s) => s.value !== "REFUNDED").map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Reference" hint="UTR, cheque number or transaction id"><input value={form.reference} onChange={set("reference")} className={inputClass} /></Field>
        <Field label="Notes"><textarea rows={2} value={form.notes} onChange={set("notes")} className={inputClass} /></Field>
      </div>
    </Modal>
  );
}
