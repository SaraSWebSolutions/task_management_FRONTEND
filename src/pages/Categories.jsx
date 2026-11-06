import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutGrid, CircleCheck, Layers, Package, Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import {
  PageHeader, Badge, Spinner, EmptyState, Modal, Field,
  PrimaryButton, GhostButton, DangerButton, IconButton, SearchBox,
} from "../components/ui";
import { MiniStat, compactInput } from "../components/catalog/bits";
import { can, homePath } from "../utils/permissions";

const EMPTY = { name: "", slug: "", parent: "", status: "ACTIVE" };

const slugify = (s) =>
  s.toLowerCase().trim().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const TILE_COLORS = ["#4f6bed", "#22c55e", "#f59e0b", "#a855f7", "#ef4444", "#14b8a6", "#ec4899", "#0ea5e9"];

const StatusDot = ({ status }) => (
  <Badge className={status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}>
    {status === "ACTIVE" ? "Active" : "Inactive"}
  </Badge>
);

export default function Categories() {
  const canManage = can("categories.manage");

  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/catalog/categories");
      setData(res.data);
    } catch {
      toast.error("Failed to load categories");
      setData({ categories: [], stats: { total: 0, active: 0, subcategories: 0, products: 0 } });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const all = useMemo(() => data?.categories || [], [data]);
  const ids = useMemo(() => new Set(all.map((c) => String(c._id))), [all]);
  // top level = no parent (or a parent that no longer exists)
  const topLevel = useMemo(() => all.filter((c) => !c.parent || !ids.has(String(c.parent._id))), [all, ids]);
  const childrenOf = useCallback(
    (id) => all.filter((c) => String(c.parent?._id) === String(id)),
    [all],
  );

  const q = search.trim().toLowerCase();
  const matches = (c) => !q || [c.name, c.slug, c.parent?.name].some((v) => v?.toLowerCase().includes(q));

  // A card shows when it, or one of its subcategories, matches the search
  const cards = useMemo(
    () => topLevel.filter((c) => matches(c) || childrenOf(c._id).some(matches)),
    [topLevel, childrenOf, q], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onName = (e) => {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, ...(!slugTouched && { slug: slugify(name) }) }));
  };

  const openAdd = (parent = "") => {
    setEditing(null);
    setForm({ ...EMPTY, parent });
    setSlugTouched(false);
    setOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, parent: c.parent?._id || "", status: c.status });
    setSlugTouched(true);
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Category name is required");
    try {
      setSaving(true);
      const body = { ...form, slug: slugify(form.slug || form.name) };
      if (editing) await api.put(`/catalog/categories/${editing._id}`, body);
      else await api.post("/catalog/categories", body);
      toast.success(editing ? "Category updated" : "Category added");
      setOpen(false);
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/catalog/categories/${toDelete._id}`);
      toast.success("Category deleted");
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
          title="Categories"
          breadcrumbs={[{ label: "Home", to: homePath() }, { label: "Apps" }, { label: "Products" }, { label: "Categories" }]}
          actions={canManage && <PrimaryButton onClick={() => openAdd()} className="!py-2.5"><Plus size={18} /> Add Category</PrimaryButton>}
        />

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <MiniStat label="Total Categories" value={stats?.total ?? "-"} icon={<LayoutGrid size={20} />} />
          <MiniStat label="Active" value={stats?.active ?? "-"} icon={<CircleCheck size={20} />} tone="green" />
          <MiniStat label="Subcategories" value={stats?.subcategories ?? "-"} icon={<Layers size={20} />} tone="amber" />
          <MiniStat label="Total Products" value={stats?.products ?? "-"} icon={<Package size={20} />} tone="cyan" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <SearchBox value={search} onChange={setSearch} placeholder="Search categories..." />
        </div>

        {!data ? (
          <Spinner />
        ) : all.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200">
            <EmptyState>No categories yet.{canManage ? " Click Add Category to create the first one." : ""}</EmptyState>
          </div>
        ) : cards.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200"><EmptyState>No categories found.</EmptyState></div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((c, i) => {
              const kids = childrenOf(c._id);
              return (
                <div key={c._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left flex flex-col">
                  <div className="flex items-start gap-3">
                    <div
                      className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ background: TILE_COLORS[i % TILE_COLORS.length] }}
                    >
                      {c.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate">{c.name}</p>
                      <p className="text-xs text-slate-400 truncate">{c.slug}</p>
                    </div>
                    {canManage && (
                      <div className="flex gap-1.5">
                        <IconButton className="!h-8 !w-8" onClick={() => openEdit(c)} aria-label="Edit"><Pencil size={14} /></IconButton>
                        <IconButton className="!h-8 !w-8" tone="danger" onClick={() => setToDelete(c)} aria-label="Delete"><Trash2 size={14} /></IconButton>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusDot status={c.status} />
                    <Badge className="bg-violet-100 text-violet-700">{c.productCount} products</Badge>
                    <Badge className="bg-slate-100 text-slate-600">{kids.length} sub</Badge>
                  </div>

                  {kids.length > 0 && (
                    <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/60">
                      {kids.filter((k) => !q || matches(k) || matches(c)).map((k) => (
                        <li key={k._id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                          <FolderTree size={14} className="text-slate-400 shrink-0" />
                          <span className="flex-1 truncate text-slate-700">{k.name}</span>
                          <span className="text-xs text-slate-400">{k.productCount}</span>
                          {k.status !== "ACTIVE" && <span className="text-[10px] font-semibold text-slate-400">OFF</span>}
                          {canManage && (
                            <>
                              <button type="button" onClick={() => openEdit(k)} aria-label="Edit subcategory" className="text-slate-400 hover:text-brand"><Pencil size={13} /></button>
                              <button type="button" onClick={() => setToDelete(k)} aria-label="Delete subcategory" className="text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => openAdd(c._id)}
                      className="mt-3 self-start text-xs font-semibold text-brand hover:underline"
                    >
                      + Add subcategory
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={open}
        title={editing ? "Edit Category" : "Add Category"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <GhostButton onClick={() => setOpen(false)} className="!py-2">Cancel</GhostButton>
            <PrimaryButton disabled={saving} onClick={save} className="!py-2">{editing ? "Save Changes" : "Add Category"}</PrimaryButton>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Category Name" required>
              <input value={form.name} onChange={onName} placeholder="e.g. Electronics" className={compactInput} />
            </Field>
          </div>
          <Field label="Slug" hint="Made from the name unless you change it.">
            <input
              value={form.slug}
              onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: e.target.value })); }}
              placeholder="electronics"
              className={compactInput}
            />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={set("status")} className={compactInput}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Parent Category">
              <select value={form.parent} onChange={set("parent")} className={compactInput}>
                <option value="">None (Top Level)</option>
                {topLevel
                  .filter((c) => c._id !== editing?._id)
                  .map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </Modal>

      <Modal center
        open={!!toDelete}
        title="Delete category"
        onClose={() => setToDelete(null)}
        footer={<><GhostButton onClick={() => setToDelete(null)}>Cancel</GhostButton><DangerButton onClick={remove}>Delete</DangerButton></>}
      >
        <p className="text-slate-600">Delete <strong>{toDelete?.name}</strong>? This cannot be undone.</p>
      </Modal>
    </Layout>
  );
}
