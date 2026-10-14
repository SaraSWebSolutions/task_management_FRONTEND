import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Pencil, Trash2, Eye } from "lucide-react";
import Layout from "../components/Layout";
import api from "../api/axios";
import toast from "react-hot-toast";

const statusStyle = {
  NEW: "bg-blue-100 text-blue-700",
  DEMO_SCHEDULED: "bg-amber-100 text-amber-700",
  QUOTATION_SENT: "bg-violet-100 text-violet-700",
  SALES: "bg-emerald-100 text-emerald-700",
  PROJECT: "bg-green-100 text-green-700",
  LOST: "bg-slate-200 text-slate-600",
};

const label = (s) =>
  s ? s.charAt(0) + s.slice(1).toLowerCase().replaceAll("_", " ") : "-";

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get("/leads")
      .then((res) => {
        if (!cancelled) setLeads(res.data.leads || []);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load leads");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const remove = async (id) => {
    if (!window.confirm("Delete this lead?")) return;
    try {
      await api.delete(`/leads/${id}`);
      toast.success("Lead deleted");
      setLeads((prev) => prev.filter((l) => l._id !== id));
    } catch {
      toast.error("Failed to delete lead");
    }
  };

  const q = search.toLowerCase();
  const shown = leads.filter(
    (l) =>
      (filter === "ALL" || l.requestType === filter) &&
      [l.name, l.email, l.company, l.phone].some((v) =>
        v?.toLowerCase().includes(q),
      ),
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border shadow-sm p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Leads</h1>
            <p className="text-slate-500 mt-1">
              People who replied or contacted the team
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-slate-500 text-sm">Total Leads</p>
              <h2 className="text-3xl font-bold text-slate-800 mt-2">
                {leads.length}
              </h2>
            </div>
            <button
              onClick={() => navigate("/add-lead")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2b1247] px-5 py-3 text-white hover:bg-[#23163a]"
            >
              <Plus size={18} /> Add Lead
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-5 shadow-sm flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, company or phone..."
              className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#2b1247]"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2b1247]"
          >
            <option value="ALL">All requests</option>
            <option value="DEMO">Demo</option>
            <option value="QUOTATION">Quotation</option>
          </select>
        </div>

        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-250 w-full">
              <thead>
                <tr className="bg-slate-100 text-sm font-semibold">
                  <th className="p-4 text-left">Lead</th>
                  <th className="p-4 text-left">Contact</th>
                  <th className="p-4 text-center">Asking for</th>
                  <th className="p-4 text-center">Demo type</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Created</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                )}
                {!loading &&
                  shown.map((l) => (
                    <tr key={l._id} className="border-t hover:bg-slate-50">
                      <td className="p-4">
                        <p className="font-medium text-slate-800">{l.name}</p>
                        <p className="text-sm text-slate-500">{l.company || "-"}</p>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        <p>{l.email}</p>
                        <p>{l.phone || "-"}</p>
                      </td>
                      <td className="p-4 text-center text-sm">{label(l.requestType)}</td>
                      <td className="p-4 text-center text-sm">
                        {l.requestType === "DEMO" ? label(l.demoType) : "-"}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle[l.status]}`}
                        >
                          {label(l.status)}
                        </span>
                      </td>
                      <td className="p-4 text-center text-sm text-slate-500">
                        {new Date(l.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => navigate(`/leads/${l._id}`)}
                            className="p-2 rounded-xl border border-slate-300 hover:bg-slate-100"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => navigate(`/edit-lead/${l._id}`)}
                            className="p-2 rounded-xl border border-slate-300 hover:bg-slate-100"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => remove(l._id)}
                            className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {!loading && shown.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No leads found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
