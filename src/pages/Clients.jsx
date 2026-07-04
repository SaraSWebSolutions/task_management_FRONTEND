import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

export default function Clients() {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [addLoading, setAddLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [billingClient, setBillingClient] = useState(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);

      const res = await api.get("/clients");

      setClients(res.data.clients || []);
    } catch (error) {
      console.error(error);

      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (id) => {
    if (!window.confirm("Delete this client?")) return;

    try {
      setDeletingId(id);
      await api.delete(`/clients/${id}`);

      toast.success("Client deleted successfully");

      loadClients();
    } catch (error) {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (id) => {
    setEditingId(id);

    setTimeout(() => {
      navigate(`/edit-client/${id}`);
    }, 300);
  };

  const getRenewalStatus = (date) => {
    const today = new Date();
    const renewal = new Date(date);

    const diffDays = Math.ceil((renewal - today) / (1000 * 60 * 60 * 24));

    return {
      daysLeft: diffDays,
      expiringSoon: diffDays <= 20,
      expired: diffDays < 0,
    };
  };

  const filteredClients = (clients || []).filter(
    (client) =>
      client.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      client.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      client.domainName?.toLowerCase().includes(search.toLowerCase()) ||
      client.softwareName?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const paginatedClients = filteredClients.slice(
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
            <p className="text-slate-500">Loading Clients...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-3xl border shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Client Management
              </h1>

              <p className="text-slate-500 mt-1">
                Manage clients and their subscription details
              </p>
            </div>

            <button
              onClick={() => {
                setAddLoading(true);

                setTimeout(() => {
                  navigate("/add-client");
                }, 300);
              }}
              className="bg-[#2b1247] text-white px-5 py-3 rounded-xl flex items-center gap-2"
            >
              {addLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Add Client
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border p-5 shadow-sm">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-3.5 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search by name, company, domain or software..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#2b1247]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
            <table className="min-w-[1300px] w-full">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-4 text-sm font-semibold text-left">
                    Client
                  </th>

                  <th className="p-4 text-sm font-semibold text-left">
                    Type
                  </th>

                  <th className="p-4 text-sm font-semibold text-left">
                    Domain / Software
                  </th>

                  <th className="p-4 text-sm font-semibold text-left">
                    Mobile
                  </th>

                  <th className="p-4 text-sm font-semibold text-left">
                    Renewal Date
                  </th>

                  <th className="p-4 text-sm font-semibold text-left">
                    Total Cost
                  </th>

                  <th className="p-4 text-sm font-semibold text-left">
                    Balance
                  </th>

                  <th className="p-4 text-sm font-semibold text-left">
                    Payment
                  </th>

                  <th className="p-4 text-center text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedClients.map((client) => {
                  const renewal = getRenewalStatus(client.renewalDate);

                  return (
                    <tr
                      key={client._id}
                      className="border-t hover:bg-slate-50"
                    >
                      <td className="p-4">
                        <div className="font-medium text-slate-800">
                          {client.clientName}
                        </div>
                        {client.companyName && (
                          <div className="text-xs text-slate-400">
                            {client.companyName}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">
                          {client.basicType}
                        </span>
                      </td>

                      <td className="p-4">
                        {client.basicType === "WEBSITE" ||
                        client.basicType === "E-COMMERCE"
                          ? client.domainName || "-"
                          : client.softwareName || "-"}
                      </td>

                      <td className="p-4">{client.phone1 || "-"}</td>

                      <td
                        className={`p-4 font-medium ${
                          renewal.expired
                            ? "text-red-700"
                            : renewal.expiringSoon
                              ? "text-orange-600"
                              : "text-green-600"
                        }`}
                      >
                        {new Date(client.renewalDate).toLocaleDateString()}
                        <br />

                        <span className="text-xs">
                          {renewal.expired
                            ? "Expired"
                            : `${renewal.daysLeft} days left`}
                        </span>
                      </td>

                      <td className="p-4">₹{client.totalCost ?? 0}</td>

                      <td className="p-4">
                        <span
                          className={
                            client.balance > 0
                              ? "text-orange-600 font-medium"
                              : "text-green-600 font-medium"
                          }
                        >
                          ₹{client.balance ?? 0}
                        </span>
                      </td>

                      <td className="p-4">
                        {client.paymentStatus === "PAID" ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Paid
                          </span>
                        ) : (
                          <button
                            onClick={() => setBillingClient(client)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                              client.paymentStatus === "PARTIALLY_PAID"
                                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                : "bg-red-100 text-red-700 hover:bg-red-200"
                            }`}
                          >
                            {client.paymentStatus === "PARTIALLY_PAID"
                              ? "Partially Paid"
                              : "Pending"}
                          </button>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(client._id)}
                            className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200"
                          >
                            {editingId === client._id ? (
                              <div className="w-[18px] h-[18px] border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                            ) : (
                              <Pencil size={18} className="text-blue-600" />
                            )}
                          </button>

                          <button
                            onClick={() => deleteClient(client._id)}
                            disabled={deletingId === client._id}
                            className="p-2 rounded-lg bg-red-100 hover:bg-red-200 disabled:opacity-50"
                          >
                            {deletingId === client._id ? (
                              <div className="w-[18px] h-[18px] border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={18} className="text-red-600" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {paginatedClients.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-8 text-center text-slate-400"
                    >
                      No clients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-slate-50">
            <div className="text-sm text-slate-600">
              Showing{" "}
              <span className="font-semibold">
                {filteredClients.length === 0
                  ? 0
                  : (currentPage - 1) * itemsPerPage + 1}
              </span>
              {" - "}
              <span className="font-semibold">
                {Math.min(currentPage * itemsPerPage, filteredClients.length)}
              </span>
              {" of "}
              <span className="font-semibold">{filteredClients.length}</span>{" "}
              clients
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1}
                  className="h-10 w-10 rounded-xl border bg-white hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft size={18} className="mx-auto" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1,
                  )
                  .map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-10 w-10 rounded-xl font-medium transition ${
                        currentPage === page
                          ? "bg-[#2b1247] text-white"
                          : "bg-white border border-slate-300"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage === totalPages}
                  className="h-10 w-10 rounded-xl border bg-white hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight size={18} className="mx-auto" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {billingClient && (
        <BillingDetailsModal
          client={billingClient}
          onClose={() => setBillingClient(null)}
          onSaved={() => {
            setBillingClient(null);
            loadClients();
          }}
        />
      )}
    </Layout>
  );
}

function BillingDetailsModal({ client, onClose, onSaved }) {
  const [form, setForm] = useState({
    totalCost: client.totalCost ?? "",
    advanceAmount: client.advanceAmount ?? "",
    advanceReceivedDate: client.advanceReceivedDate
      ? client.advanceReceivedDate.split("T")[0]
      : "",
    balance: client.balance ?? 0,
    balanceReceivedExpectedDate: client.balanceReceivedExpectedDate
      ? client.balanceReceivedExpectedDate.split("T")[0]
      : "",
    renewalDate: client.renewalDate ? client.renewalDate.split("T")[0] : "",
    paymentStatus: client.paymentStatus || "PENDING",
    amcAmount: client.amcAmount ?? "",
  });
  const [saving, setSaving] = useState(false);

  // Keep Balance in sync locally for display; the server recalculates
  // and is the source of truth once saved.
  useEffect(() => {
    const total = parseFloat(form.totalCost) || 0;
    const advance = parseFloat(form.advanceAmount) || 0;
    const balance = total - advance;

    setForm((prev) => ({ ...prev, balance: balance > 0 ? balance : 0 }));
  }, [form.totalCost, form.advanceAmount]);

  const updateField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.totalCost) return toast.error("Total Cost is required");
    if (!form.renewalDate) return toast.error("Renewal Date is required");

    try {
      setSaving(true);

      await api.put(`/clients/${client._id}`, form);

      toast.success("Billing details updated");

      onSaved();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update billing details",
      );
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    "w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#2b1247] focus:border-transparent outline-none";

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Renewal & Billing
            </h2>
            <p className="text-slate-500 text-sm">{client.clientName}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 text-xs font-medium text-slate-600">
              Total Cost <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.totalCost}
              onChange={updateField("totalCost")}
              className={fieldClass}
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-medium text-slate-600">
              Payment Status
            </label>
            <select
              value={form.paymentStatus}
              onChange={updateField("paymentStatus")}
              className={fieldClass}
            >
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-medium text-slate-600">
              Advance Amount
            </label>
            <input
              type="number"
              value={form.advanceAmount}
              onChange={updateField("advanceAmount")}
              className={fieldClass}
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-medium text-slate-600">
              Advance Received Date
            </label>
            <input
              type="date"
              value={form.advanceReceivedDate}
              onChange={updateField("advanceReceivedDate")}
              className={fieldClass}
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-medium text-slate-600">
              Balance
            </label>
            <input
              type="number"
              value={form.balance}
              readOnly
              className={`${fieldClass} bg-slate-50 text-slate-500 cursor-not-allowed`}
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-medium text-slate-600">
              Balance Received Expected Date
            </label>
            <input
              type="date"
              value={form.balanceReceivedExpectedDate}
              onChange={updateField("balanceReceivedExpectedDate")}
              className={fieldClass}
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-medium text-slate-600">
              Renewal Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.renewalDate}
              onChange={updateField("renewalDate")}
              className={fieldClass}
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-medium text-slate-600">
              AMC Amount
            </label>
            <input
              type="number"
              value={form.amcAmount}
              onChange={updateField("amcAmount")}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#2b1247] text-white text-sm flex items-center gap-2 disabled:opacity-70 hover:bg-[#3a1a5e] transition-colors"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}