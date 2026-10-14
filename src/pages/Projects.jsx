import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Search } from "lucide-react";
import Layout from "../components/Layout";
import api from "../api/axios";
import toast from "react-hot-toast";

export const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const statusStyle = {
  PLANNING: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
};

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/projects")
      .then((res) => setProjects(res.data.projects || []))
      .catch(() => toast.error("Failed to load projects"))
      .finally(() => setLoading(false));
  }, []);

  const q = search.toLowerCase();
  const shown = projects.filter(
    (p) =>
      p.name?.toLowerCase().includes(q) ||
      p.clientName?.toLowerCase().includes(q),
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border shadow-sm p-6">
          <h1 className="text-3xl font-bold text-slate-800">Projects</h1>
          <p className="text-slate-500 mt-1">
            Projects created from converted leads
          </p>
        </div>

        <div className="bg-white rounded-2xl border p-5 shadow-sm">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project or client..."
              className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#2b1247]"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl border shadow-sm overflow-x-auto">
          <table className="min-w-250 w-full">
            <thead>
              <tr className="bg-slate-100 text-sm font-semibold">
                <th className="p-4 text-left">Project</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Client est.</th>
                <th className="p-4 text-center">Team est.</th>
                <th className="p-4 text-center">Project value</th>
                <th className="p-4 text-center">Team cost</th>
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
                shown.map((p) => (
                  <tr key={p._id} className="border-t hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-medium text-slate-800">{p.name}</p>
                      <p className="text-sm text-slate-500">{p.clientName}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle[p.status]}`}
                      >
                        {p.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-center text-sm">
                      {p.clientEstimationHours} hrs
                    </td>
                    <td className="p-4 text-center text-sm">
                      {p.teamEstimationHours} hrs
                    </td>
                    <td className="p-4 text-center text-sm">
                      {money(p.projectValue)}
                    </td>
                    <td className="p-4 text-center text-sm">
                      {p.status === "COMPLETED"
                        ? money(p.summary.totalCost)
                        : "-"}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => navigate(`/projects/${p._id}`)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
                      >
                        <Eye size={16} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              {!loading && shown.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No projects yet. Convert a lead to sales, then to a project.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
