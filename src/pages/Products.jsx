import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Eye, Pencil, Trash2, ShoppingBag, CircleCheck, FileText, LayoutGrid } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import {
  PageHeader, Badge, Spinner, EmptyState, Pagination, Modal,
  PrimaryButton, GhostButton, DangerButton, IconButton, SearchBox,
} from "../components/ui";
import { ProductThumb, statusBadge, MiniStat, compactInput } from "../components/catalog/bits";
import ProductModal from "../components/catalog/ProductModal";
import { fmtMoney } from "../utils/format";
import { can, homePath } from "../utils/permissions";

const PER_PAGE = 12;

export default function Products() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const canManage = can("products.manage");

  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);

  // form: null (closed) | "new" | product id
  const [form, setForm] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/catalog/products");
      setData(res.data);
    } catch {
      toast.error("Failed to load products");
      setData({ products: [], stats: { total: 0, active: 0, draft: 0, categories: 0 } });
    }
  }, []);

  useEffect(() => {
    load();
    api.get("/catalog/categories").then((r) => setCategories(r.data.categories || [])).catch(() => {});
  }, [load]);

  // Old links like /products?add=1 or /products?edit=<id> open the form
  useEffect(() => {
    if (!canManage) return;
    if (params.get("add")) setForm("new");
    else if (params.get("edit")) setForm(params.get("edit"));
    else return;
    setParams({}, { replace: true });
  }, [params, canManage, setParams]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.products || []).filter(
      (p) =>
        (category === "ALL" || p.category?._id === category) &&
        (status === "ALL" || p.status === status) &&
        (!q || [p.name, p.sku, p.barcode, p.category?.name, ...(p.tags || [])].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [data, search, category, status]);

  const rows = shown.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const reset = (setter) => (v) => { setter(v); setPage(1); };

  const remove = async () => {
    try {
      await api.delete(`/catalog/products/${toDelete._id}`);
      toast.success("Product deleted");
      setToDelete(null);
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete");
      setToDelete(null);
    }
  };

  const stats = data?.stats;

  return (
    <Layout>
      <div className="space-y-4">
        <PageHeader
          title="Products"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Apps" }, { label: "Products" }]}
          actions={canManage && <PrimaryButton onClick={() => setForm("new")} className="!py-2.5"><Plus size={18} /> Add Product</PrimaryButton>}
        />

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <MiniStat label="Total Products" value={stats?.total ?? "-"} icon={<ShoppingBag size={20} />} />
          <MiniStat label="Active" value={stats?.active ?? "-"} icon={<CircleCheck size={20} />} tone="green" />
          <MiniStat label="Drafts" value={stats?.draft ?? "-"} icon={<FileText size={20} />} tone="amber" />
          <MiniStat label="Categories" value={stats?.categories ?? "-"} icon={<LayoutGrid size={20} />} tone="cyan" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col lg:flex-row gap-3 lg:items-center">
          <SearchBox value={search} onChange={reset(setSearch)} placeholder="Search products..." />
          <select value={category} onChange={(e) => reset(setCategory)(e.target.value)} className={`${compactInput} !py-2.5 lg:!w-56`}>
            <option value="ALL">All Categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.parent ? `${c.parent.name} / ` : ""}{c.name}</option>)}
          </select>
          <select value={status} onChange={(e) => reset(setStatus)(e.target.value)} className={`${compactInput} !py-2.5 lg:!w-40`}>
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>

        {!data ? (
          <Spinner />
        ) : shown.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200">
            <EmptyState>
              No products found.{canManage && !data.products.length ? " Add a category first, then click Add Product." : ""}
            </EmptyState>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((p) => {
                const st = statusBadge(p.status);
                return (
                  <div key={p._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left flex flex-col">
                    <div className="flex gap-3">
                      <button type="button" onClick={() => navigate(`/products/${p._id}`)} className="shrink-0">
                        <ProductThumb product={p} className="h-16 w-16 rounded-lg" text="text-lg" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/products/${p._id}`)}
                          className="block max-w-full truncate text-left font-bold text-slate-900 hover:text-brand"
                        >
                          {p.name}
                        </button>
                        <p className="text-xs text-slate-400 truncate">SKU: {p.sku}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <Badge className="bg-violet-100 text-violet-700 truncate">{p.category?.name || "No category"}</Badge>
                          <Badge className={st.badge}>{st.label}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-2 border-t border-slate-100 pt-3">
                      <div>
                        <p className="text-xl font-bold text-brand leading-none">{fmtMoney(p.price)}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Tax {p.taxPercent || 0}%{p.taxPercent > 0 && <> · {fmtMoney(p.priceWithTax)} incl.</>}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <IconButton className="!h-8 !w-8" onClick={() => navigate(`/products/${p._id}`)} aria-label="View"><Eye size={14} /></IconButton>
                        {canManage && (
                          <>
                            <IconButton className="!h-8 !w-8" onClick={() => setForm(p._id)} aria-label="Edit"><Pencil size={14} /></IconButton>
                            <IconButton className="!h-8 !w-8" tone="danger" onClick={() => setToDelete(p)} aria-label="Delete"><Trash2 size={14} /></IconButton>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-white rounded-xl border border-slate-200">
              <Pagination page={page} perPage={PER_PAGE} total={shown.length} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      <ProductModal
        open={form !== null}
        productId={form && form !== "new" ? form : null}
        categories={categories}
        onClose={() => setForm(null)}
        onSaved={() => { setForm(null); load(); }}
      />

      <Modal center
        open={!!toDelete}
        title="Delete product"
        onClose={() => setToDelete(null)}
        footer={<><GhostButton onClick={() => setToDelete(null)}>Cancel</GhostButton><DangerButton onClick={remove}>Delete</DangerButton></>}
      >
        <p className="text-slate-600">Delete <strong>{toDelete?.name}</strong>? This cannot be undone.</p>
      </Modal>
    </Layout>
  );
}
