import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, Plus, Eye } from "lucide-react";
import Layout from "../components/Layout";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Campaign() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const res = await api.get("/campaigns");
      setCampaigns(res.data.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      campaign.name?.toLowerCase().includes(search.toLowerCase()) ||
      campaign.title?.toLowerCase().includes(search.toLowerCase()) ||
      campaign.body?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / itemsPerPage));

  const paginatedCampaigns = filteredCampaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  if (loading) {
    return (
      <Layout>
        <div className="h-[70vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-[#2b1247] rounded-full animate-spin"></div>
            <p className="text-slate-500">Loading Campaigns...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Campaigns</h1>
              <p className="text-slate-500 mt-1">
                View created campaigns and email delivery targets
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full lg:w-auto">
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-slate-500 text-sm">Total Campaigns</p>
                <h2 className="text-3xl font-bold text-slate-800 mt-2">
                  {campaigns.length}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate("/campaigns/add")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2b1247] px-5 py-3 text-white transition hover:bg-[#23163a]"
              >
                <Plus size={18} />
                Add Campaign
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-5 shadow-sm">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by campaign name, title or body..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#2b1247]"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
            <table className="min-w-250 w-full">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-4 text-sm font-semibold text-center">Name</th>
                  <th className="p-4 text-sm font-semibold text-center">Title</th>
                  {/* <th className="p-4 text-sm font-semibold text-center">Body</th> */}
                  <th className="p-4 text-sm font-semibold text-center">Recipients</th>
                  <th className="p-4 text-sm font-semibold text-center">Follow up</th>
                  <th className="p-4 text-sm font-semibold text-center">Created</th>
                  <th className="p-4 text-sm font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCampaigns.map((campaign) => (
                  <tr key={campaign._id} className="border-t hover:bg-slate-50">
                    <td className="p-4 max-w-55 wrap-break-word">{campaign.name}</td>
                    <td className="p-4 max-w-55 wrap-break-word">{campaign.title}</td>
                    {/* <td className="p-4 max-w-90 wrap-break-word text-slate-600">{campaign.body}</td> */}
                    <td className="p-4">
                      <div className="text-sm text-slate-700 font-medium">
                        {campaign.emails?.length || 0} recipients
                      </div>
                      {/* {campaign.emails?.length > 0 && (
                        <div className="text-xs text-slate-500 mt-1 max-w-65 wrap-break-word">
                          {campaign.emails.join(", ")}
                        </div>
                      )} */}
                    </td>
                    <td className="p-4 max-w-55 wrap-break-word">{campaign.isFollowedUp ? "Sent" : "Not Yet"}</td>
                    <td className="p-4 text-sm text-slate-500">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => navigate(`/campaigns/${campaign._id}`)}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      >
                        <Eye size={16} />
                        <span className="ml-2">View</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedCampaigns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No campaigns found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Showing {paginatedCampaigns.length} of {filteredCampaigns.length} campaigns
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
