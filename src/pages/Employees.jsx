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
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Employees() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [addLoading, setAddLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get("/employees");
      setEmployees(res.data);
    } catch (error) {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm("Delete this employee?")) return;

    try {
      setDeletingId(id);
      await api.delete(`/employees/${id}`);

      toast.success("Employee deleted successfully");

      loadEmployees();
    } catch (error) {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (id) => {
    setEditingId(id);

    setTimeout(() => {
      navigate(`/edit-employee/${id}`);
    }, 300);
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalUsers = employees.length;

  const activeUsers = employees.filter((emp) => emp.status === "ACTIVE").length;

  const inactiveUsers = employees.filter(
    (emp) => emp.status === "INACTIVE",
  ).length;

  const adminUsers = employees.filter((emp) => emp.role === "ADMIN").length;

  const employeeUsers = employees.filter(
    (emp) => emp.role === "EMPLOYEE",
  ).length;

  if (loading) {
    return (
      <Layout>
        <div className="h-[70vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-[#2b1247] rounded-full animate-spin"></div>
            <p className="text-slate-500">Loading Employees...</p>
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
                Employee Management
              </h1>

              <p className="text-slate-500 mt-1">
                Manage employees, admins and their details
              </p>
            </div>

            <button
              onClick={() => {
                setAddLoading(true);

                setTimeout(() => {
                  navigate("/add-employee");
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
                  Add Employee
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats */}

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Total Users</p>

                <h2 className="text-3xl font-bold mt-1">{employees.length}</h2>
              </div>

              <Users size={34} className="text-[#2b1247]" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Active Users</p>

                <h2 className="text-3xl font-bold mt-1">{activeUsers}</h2>
              </div>

              <Users
                size={34}
                className="text-[#2b1247] bg-green-100 text-green-700"
              />
            </div>
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
              placeholder="Search by name, email or employee id..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#2b1247]"
            />
          </div>
        </div>

        {/* Table */}

        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          {/* <div className="overflow-x-auto"> */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
            {/* <table className="w-full"> */}
            <table className="min-w-[1200px] w-full">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-4 text-sm font-semibold">Employee ID</th>

                  <th className="p-4 text-sm font-semibold">Name</th>

                  <th className="p-4 text-sm font-semibold">Email</th>

                  <th className="p-4 text-sm font-semibold">Mobile</th>

                  <th className="p-4 text-sm font-semibold">Role</th>

                  <th className="p-4 text-sm font-semibold">Designation</th>

                  <th className="p-4 text-sm font-semibold">Department</th>

                  <th className="p-4 text-sm font-semibold">Status</th>

                  <th className="p-4 text-center text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* {filteredEmployees.map((emp) => ( */}
                {paginatedEmployees.map((emp) => (
                  <tr key={emp._id} className="border-t hover:bg-slate-50">
                    <td className="p-4 font-medium">{emp.employeeId}</td>

                    <td className="p-4">{emp.name}</td>

                    <td className="p-4">{emp.email}</td>

                    <td className="p-4">{emp.phone}</td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          emp.role === "ADMIN"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {emp.role}
                      </span>
                    </td>

                    <td className="p-4">{emp.designation}</td>

                    <td className="p-4">{emp.department}</td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          emp.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(emp._id)}
                          disabled={editingId === emp._id}
                          className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200"
                        >
                          {editingId === emp._id ? (
                            <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                          ) : (
                            <Pencil size={18} className="text-blue-600" />
                          )}
                        </button>

                        <button
                          onClick={() => deleteEmployee(emp._id)}
                          disabled={deletingId === emp._id}
                          className="p-2 rounded-lg bg-red-100 hover:bg-red-200"
                        >
                          {deletingId === emp._id ? (
                            <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 size={18} className="text-red-600" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredEmployees.length === 0 && (
                  <tr>
                    <td
                      colSpan="9"
                      className="text-center py-10 text-slate-500"
                    >
                      No Employees Found
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
                {filteredEmployees.length === 0
                  ? 0
                  : (currentPage - 1) * itemsPerPage + 1}
              </span>
              {" - "}
              <span className="font-semibold">
                {Math.min(currentPage * itemsPerPage, filteredEmployees.length)}
              </span>
              {" of "}
              <span className="font-semibold">
                {filteredEmployees.length}
              </span>{" "}
              employees
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
    </Layout>
  );
}