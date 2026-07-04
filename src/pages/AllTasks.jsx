import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

import {
  Search,
  Calendar,
  Eye,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function AllTasks() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const navigate = useNavigate();

  useEffect(() => {
    if (date) loadTasks();
  }, [date]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tasks]);

  const loadTasks = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/tasks/all-tasks?date=${date}`);
      setTasks(res.data || []);
    } catch (error) {
      toast.error("Failed to load tasks");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;

    try {
      setActionLoading(true);

      await api.delete(`/tasks/${id}`);

      toast.success("Task Deleted Successfully");

      await loadTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const s = search.toLowerCase();

    return (
      task.project?.toLowerCase().includes(s) ||
      task.taskDescription?.toLowerCase().includes(s) ||
      task.employeeId?.name?.toLowerCase().includes(s)
    );
  });
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleSearch = (e) => {
    setActionLoading(true);

    setSearch(e.target.value);

    setTimeout(() => {
      setActionLoading(false);
    }, 300);
  };

  const goAssignTask = () => {
    setActionLoading(true);

    setTimeout(() => {
      navigate("/assign-task");
    }, 300);
  };

  const handleView = (id) => {
    setActionLoading(true);

    setTimeout(() => {
      navigate(`/task/${id}`);
    }, 300);
  };
  const handleEdit = (id) => {
    setActionLoading(true);

    setTimeout(() => {
      navigate(`/edit-task/${id}`);
    }, 300);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <Loader2
              size={50}
              className="animate-spin text-[var(--brand)] mx-auto mb-4"
            />
            <p className="text-slate-600 font-medium">Loading tasks...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 max-w-[1600px] mx-auto">
        {/* TOP CARDS (same as MyTasks) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-3 shadow-sm border">
            <p className="text-slate-500">Total Tasks</p>
            <h2 className="text-5xl font-bold text-[var(--brand)] mt-4">
              {tasks.length}
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-3 shadow-sm border">
            <p className="text-slate-500">Completed</p>
            <h2 className="text-5xl font-bold text-green-600 mt-4">
              {tasks.filter((t) => t.status === "Completed").length}
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-3 shadow-sm border">
            <p className="text-slate-500">Pending</p>
            <h2 className="text-5xl font-bold text-yellow-500 mt-4">
              {tasks.filter((t) => t.status === "Pending").length}
            </h2>
          </div>
        </div>

        {/* FILTERS (same UI as MyTasks) */}
        <div className="bg-white rounded-3xl border shadow-sm p-3 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            {/* Search */}
            <div className="relative w-full lg:w-96">
              <Search
                size={18}
                className="absolute left-3 top-3 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search by employee / project / task..."
                value={search}
                // onChange={(e) => setSearch(e.target.value)}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:border-[var(--brand)]"
              />
            </div>

            {/* Right Side */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* Date Filter */}
              <div className="relative w-full sm:w-auto">
                <Calendar
                  size={18}
                  className="absolute left-3 top-3 text-gray-400"
                />

                <input
                  type="date"
                  value={date}
                  // onChange={(e) => setDate(e.target.value)}
                  onChange={(e) => {
                    setActionLoading(true);
                    setDate(e.target.value);

                    setTimeout(() => {
                      setActionLoading(false);
                    }, 500);
                  }}
                  className="pl-10 pr-4 py-3 border rounded-xl"
                />
              </div>

              {/* Assign Task Button */}
              {/* <Link
                to="/assign-task"
                className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white px-3 py-2 sm:px-5 sm:py-3 rounded-xl flex items-center gap-2 font-medium transition"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Assign Task</span>
                <span className="inline sm:hidden lowercase">assign</span>
              </Link> */}
              <button
                onClick={goAssignTask}
                className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white px-3 py-2 sm:px-5 sm:py-3 rounded-xl flex items-center gap-2 font-medium transition"
              >
                {actionLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Plus size={18} />
                )}

                <span className="hidden sm:inline">Assign Task</span>
                <span className="inline sm:hidden lowercase">assign</span>
              </button>
            </div>
          </div>
        </div>

        {/* TABLE (same style as MyTasks) */}
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b">
            <h2 className="text-xl font-semibold">All Employees Tasks</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 whitespace-nowrap">Employee</th>

                  <th className="px-6 py-4 whitespace-nowrap">Time</th>

                  <th className="px-6 py-4 whitespace-nowrap">Project</th>

                  <th className="px-6 py-4 whitespace-nowrap">Task</th>

                  <th className="px-6 py-4 whitespace-nowrap">Status</th>

                  <th className="px-6 py-4 whitespace-nowrap">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredTasks.length > 0 ? (
                  // filteredTasks.map((task) => (
                  paginatedTasks.map((task) => (
                    <tr key={task._id} className="border-t hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.employeeId?.name || "N/A"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.timeSlot}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.project}
                      </td>

                      <td className="px-6 py-4 max-w-md">
                        <p className="line-clamp-2 break-words">
                          {task.taskDescription}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            task.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : task.status === "Pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {task.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleView(task._id)}
                            className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            // onClick={() => navigate(`/edit-task/${task._id}`)}
                            onClick={() => handleEdit(task._id)}
                            className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            onClick={() => deleteTask(task._id)}
                            className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-16">
                      No Tasks Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-slate-50">
            <p className="text-sm text-slate-600">
              Showing{" "}
              <span className="font-semibold">
                {filteredTasks.length === 0
                  ? 0
                  : (currentPage - 1) * itemsPerPage + 1}
              </span>
              {" - "}
              <span className="font-semibold">
                {Math.min(currentPage * itemsPerPage, filteredTasks.length)}
              </span>
              {" of "}
              <span className="font-semibold">{filteredTasks.length}</span>
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1}
                  className="h-10 px-3 rounded-lg border bg-white disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
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
                      className={`h-10 w-10 rounded-lg ${
                        currentPage === page
                          ? "bg-[var(--brand)] text-white"
                          : "bg-white border"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage === totalPages}
                  className="h-10 px-3 rounded-lg border bg-white disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
