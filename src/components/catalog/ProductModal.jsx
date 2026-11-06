// Add / Edit product in a slide-in form (opened from the Products page)
import { useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { Modal, Field, Spinner, PrimaryButton, GhostButton } from "../ui";
import { compactInput, withTax } from "./bits";
import { shrinkImage } from "../../utils/image";
import { fmtMoney } from "../../utils/format";
import { UOMS } from "../../utils/billingDoc";

const MAX_IMAGES = 6;

const EMPTY = {
  name: "",
  description: "",
  sku: "",
  barcode: "",
  images: [],
  type: "PRODUCT",
  hsn: "",
  uom: "",
  price: "",
  taxPercent: "",
  category: "",
  tags: "",
  status: "ACTIVE",
};

export default function ProductModal({ open, productId, categories, onClose, onSaved }) {
  const editing = Boolean(productId);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!productId) return setForm(EMPTY);
    let cancelled = false;
    setLoading(true);
    api
      .get(`/catalog/products/${productId}`)
      .then((res) => {
        if (cancelled) return;
        const p = res.data.product;
        setForm({
          name: p.name || "",
          description: p.description === "-" ? "" : p.description || "",
          sku: p.sku || "",
          barcode: p.barcode || "",
          images: p.images || [],
          type: p.type || "PRODUCT",
          hsn: p.hsn || "",
          uom: p.uom || "",
          price: p.price ?? "",
          taxPercent: p.taxPercent || "",
          category: p.category?._id || "",
          tags: (p.tags || []).join(", "),
          status: p.status === "DRAFT" ? "ACTIVE" : p.status,
        });
      })
      .catch(() => {
        toast.error("Failed to load product");
        onClose();
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [open, productId]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const addFiles = async (files) => {
    const list = [...files].filter((f) => f.type.startsWith("image/"));
    if (!list.length) return toast.error("Choose image files (JPG, PNG, WebP)");
    const room = MAX_IMAGES - form.images.length;
    if (room <= 0) return toast.error(`You can add up to ${MAX_IMAGES} images`);
    try {
      const added = [];
      for (const file of list.slice(0, room)) {
        if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is over 5 MB`); continue; }
        added.push(await shrinkImage(file));
      }
      setForm((f) => ({ ...f, images: [...f.images, ...added] }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const save = async (status) => {
    if (!form.name.trim()) return toast.error("Product name is required");
    if (!form.sku.trim()) return toast.error("SKU is required");
    if (!form.category) return toast.error("Select a category");
    if (status !== "DRAFT") {
      if (!form.description.trim()) return toast.error("Description is required");
      if (form.price === "" || !(Number(form.price) >= 0)) return toast.error("Enter the price");
    }
    const tax = Number(form.taxPercent) || 0;
    if (tax < 0 || tax > 100) return toast.error("Tax must be between 0 and 100 %");

    try {
      setSaving(true);
      const body = {
        ...form,
        status,
        price: Number(form.price) || 0,
        taxPercent: tax,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      const res = editing
        ? await api.put(`/catalog/products/${productId}`, body)
        : await api.post("/catalog/products", body);
      toast.success(res.data.message || "Saved");
      onSaved();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      wide
      title={editing ? "Edit Product" : "Add Product"}
      onClose={onClose}
      footer={
        <>
          <GhostButton type="button" disabled={saving} onClick={onClose} className="!py-2">Cancel</GhostButton>
          <button
            type="button"
            disabled={saving}
            onClick={() => save("DRAFT")}
            className="rounded-xl bg-amber-500 px-4 py-2 font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
          >
            Save as Draft
          </button>
          <PrimaryButton type="button" disabled={saving} onClick={() => save(form.status)} className="!py-2">
            {editing ? "Save Changes" : "Save Product"}
          </PrimaryButton>
        </>
      }
    >
      {loading ? (
        <Spinner />
      ) : (
        <div className="grid gap-x-3 gap-y-3 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <Field label="Product Name" required>
              <input value={form.name} onChange={set("name")} placeholder="Enter product name" className={compactInput} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Status">
              <select value={form.status} onChange={set("status")} className={compactInput}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="SKU" required>
              <input value={form.sku} onChange={set("sku")} placeholder="WH-PRO-001" className={compactInput} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Barcode">
              <input value={form.barcode} onChange={set("barcode")} placeholder="ISBN / UPC" className={compactInput} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Category" required>
              <select value={form.category} onChange={set("category")} className={compactInput}>
                <option value="">Select category</option>
                {categories
                  .filter((c) => c.status === "ACTIVE" || c._id === form.category)
                  .map((c) => (
                    <option key={c._id} value={c._id}>{c.parent ? `${c.parent.name} / ` : ""}{c.name}</option>
                  ))}
              </select>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Type">
              <select value={form.type} onChange={set("type")} className={compactInput}>
                <option value="PRODUCT">Product</option>
                <option value="SERVICE">Service</option>
              </select>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="HSN / SAC">
              <input value={form.hsn} onChange={set("hsn")} placeholder="e.g. 998314" className={compactInput} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="UOM">
              <select value={form.uom} onChange={set("uom")} className={compactInput}>
                <option value="">Select unit</option>
                {form.uom && !UOMS.includes(form.uom) && <option value={form.uom}>{form.uom}</option>}
                {UOMS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
          </div>

          {/* Pricing: price + tax % only */}
          <div className="sm:col-span-6 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-800">Pricing</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Price" required>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-200 bg-white px-3 text-sm text-slate-600">₹</span>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={set("price")} placeholder="0.00" className={`${compactInput} !rounded-l-none`} />
                </div>
              </Field>
              <Field label="Tax">
                <div className="flex">
                  <input type="number" min="0" max="100" step="0.01" value={form.taxPercent} onChange={set("taxPercent")} placeholder="18" className={`${compactInput} !rounded-r-none`} />
                  <span className="inline-flex items-center rounded-r-lg border border-l-0 border-slate-200 bg-white px-3 text-sm text-slate-600">%</span>
                </div>
              </Field>
              <Field label="Price with tax">
                <input readOnly value={fmtMoney(withTax(form.price, form.taxPercent))} className={`${compactInput} !bg-white font-semibold`} />
              </Field>
            </div>
          </div>

          <div className="sm:col-span-6">
            <Field label="Description" required>
              <textarea rows={3} value={form.description} onChange={set("description")} placeholder="Short product description..." className={compactInput} />
            </Field>
          </div>

          <div className="sm:col-span-6">
            <Field label="Tags">
              <input value={form.tags} onChange={set("tags")} placeholder="Comma separated tags" className={compactInput} />
            </Field>
          </div>

          <div className="sm:col-span-6">
            <span className="block text-sm font-semibold text-slate-800 mb-2">Images <span className="font-normal text-slate-400">(up to {MAX_IMAGES})</span></span>
            <div className="flex flex-wrap gap-2.5">
              {form.images.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt={`Product ${i + 1}`} className={`h-16 w-16 rounded-lg object-cover border ${i === 0 ? "border-brand border-2" : "border-slate-200"}`} />
                  {i === 0 && <span className="absolute bottom-0.5 left-0.5 rounded bg-brand px-1 text-[9px] font-semibold text-white">Main</span>}
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, n) => n !== i) }))}
                    aria-label="Remove image"
                    className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {form.images.length < MAX_IMAGES && (
                <label className="h-16 w-16 cursor-pointer rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:bg-slate-50">
                  <ImagePlus size={20} />
                  <span className="text-[10px]">Add</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                </label>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
