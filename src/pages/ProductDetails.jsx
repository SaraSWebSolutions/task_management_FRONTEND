import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, Card, Badge, Spinner, PrimaryButton, GhostButton } from "../components/ui";
import { ProductThumb, statusBadge } from "../components/catalog/bits";
import { fmtMoney, fmtDate } from "../utils/format";
import { can, homePath } from "../utils/permissions";

function Detail({ label, children }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <div className="mt-0.5 text-slate-900 break-words">{children || "-"}</div>
    </div>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    api
      .get(`/catalog/products/${id}`)
      .then((res) => setProduct(res.data.product))
      .catch(() => {
        toast.error("Product not found");
        navigate("/products");
      });
  }, [id, navigate]);

  if (!product) return <Layout><Spinner /></Layout>;

  const images = product.images || [];
  const st = statusBadge(product.status);
  const cat = product.category;

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Product Details"
          breadcrumbs={[
            { label: "Home", to: homePath() },
            { label: "Apps" },
            { label: "Products", to: "/products" },
            { label: "Product Details" },
          ]}
          actions={
            <>
              <GhostButton type="button" onClick={() => navigate("/products")}><ArrowLeft size={18} /> Back</GhostButton>
              {can("products.manage") && (
                <PrimaryButton type="button" onClick={() => navigate(`/products?edit=${id}`)}>
                  <Pencil size={18} /> Edit Product
                </PrimaryButton>
              )}
            </>
          }
        />

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 grid gap-6 lg:grid-cols-2 text-left">
          <div>
            {images.length ? (
              <img src={images[active] || images[0]} alt={product.name} className="w-full aspect-4/3 max-h-72 rounded-xl object-cover border border-slate-100" />
            ) : (
              <ProductThumb product={product} className="w-full aspect-4/3 max-h-72 rounded-xl" text="text-6xl" />
            )}
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-3">
                {images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActive(i)}
                    className={`rounded-xl overflow-hidden border-2 ${i === active ? "border-brand" : "border-transparent"}`}
                  >
                    <img src={src} alt={`${product.name} ${i + 1}`} className="h-20 w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              <Badge className={st.badge}>{st.label}</Badge>
            </div>
            <div role="heading" aria-level={2} className="mt-3 text-3xl font-bold text-slate-900">{product.name}</div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-4xl font-bold text-brand">{fmtMoney(product.price)}</span>
              <span className="text-sm text-slate-500">+ {product.taxPercent || 0}% tax</span>
            </div>

            <p className="mt-5 whitespace-pre-wrap text-slate-600 leading-relaxed">
              {product.description === "-" ? "No description added." : product.description}
            </p>

            <div className="mt-6 border-t border-slate-100 pt-6 grid sm:grid-cols-2 gap-5">
              <Detail label="SKU">{product.sku}</Detail>
              <Detail label="Barcode">{product.barcode}</Detail>
              <Detail label="Category">{cat ? `${cat.parent ? `${cat.parent.name} / ` : ""}${cat.name}` : ""}</Detail>
              <Detail label="Tags">
                {product.tags?.length ? (
                  <span className="flex flex-wrap gap-1.5">
                    {product.tags.map((t) => <Badge key={t} className="bg-slate-100 text-slate-600">{t}</Badge>)}
                  </span>
                ) : null}
              </Detail>
            </div>
          </div>
        </div>

        <Card title="Pricing details">
          <div className="grid gap-5 sm:grid-cols-3">
            <Detail label="Price">{fmtMoney(product.price)}</Detail>
            <Detail label="Tax">{`${product.taxPercent || 0}%`}</Detail>
            <Detail label="Price with tax">{fmtMoney(product.priceWithTax ?? product.price)}</Detail>
          </div>
          <p className="mt-5 text-xs text-slate-400">
            Added {fmtDate(product.createdAt)} · Last updated {fmtDate(product.updatedAt)}
          </p>
        </Card>
      </div>
    </Layout>
  );
}
