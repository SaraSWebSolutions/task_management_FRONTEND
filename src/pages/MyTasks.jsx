import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api/axios";
import toast from "react-hot-toast";

import {
  Eye,
  Pencil,
  Trash2,
  Search,
  Calendar,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function MyTasks() {

 const timeSlots = [
  "07:00 AM - 08:00 AM",
  "08:00 AM - 09:00 AM",
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 01:00 PM",
  "01:00 PM - 02:00 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM",
  "05:00 PM - 06:00 PM",
  "06:00 PM - 07:00 PM",
  "07:00 PM - 08:00 PM",
];
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [addTaskLoading, setAddTaskLoading] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const navigate = useNavigate();

  useEffect(() => {
    loadTasks();
  }, [date]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, date]);

  const loadTasks = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/tasks/my-tasks?date=${date}`);

      setTasks(res.data);
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;

    try {
      setDeletingId(id);
      await api.delete(`/tasks/${id}`);

      toast.success("Task deleted");

      loadTasks();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTasks = tasks.filter(
    (task) =>
      task.project?.toLowerCase().includes(search.toLowerCase()) ||
      task.taskDescription?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <Loader2
              size={50}
              className="animate-spin text-[var(--brand)] mx-auto mb-4"
            />

            <p className="text-slate-600 font-medium text-lg">
              Loading tasks...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 max-w-[1600px] mx-auto">
        {/* Top Cards */}
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

        {/* Filters */}
        <div className="bg-white rounded-3xl border shadow-sm p-3 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="relative w-full lg:w-96">
              <Search
                size={18}
                className="absolute left-3 top-3 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:border-[var(--brand)]"
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative w-full sm:w-auto">
                <Calendar
                  size={18}
                  className="absolute left-3 top-3 text-gray-400"
                />

                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-10 pr-4 py-3 border rounded-xl"
                />
              </div>

              {/* <Link
                to="/add-task"
                className="bg-[var(--brand)] text-white px-3 py-2 sm:px-5 sm:py-3 rounded-xl flex items-center gap-2"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Add Task</span>
                <span className="inline sm:hidden lowercase">add</span>
              </Link> */}
              <button
                onClick={() => {
                  setAddTaskLoading(true);

                  setTimeout(() => {
                    navigate("/add-task");
                  }, 300);
                }}
                disabled={addTaskLoading}
                className="bg-[var(--brand)] text-white px-3 py-2 sm:px-5 sm:py-3 rounded-xl flex items-center gap-2 disabled:opacity-70"
              >
                {addTaskLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>wait...</span>
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    <span className="hidden sm:inline">Add Task</span>
                    <span className="inline sm:hidden lowercase">add</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b">
            <h2 className="text-xl font-semibold">Task List</h2>
          </div>

          <div className="overflow-x-auto">
            {/* <table className="w-full"> */}
            <table className="min-w-[1200px] w-full ">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 whitespace-nowrap">Time</th>

                  <th className="px-6 py-4 whitespace-nowrap">Project</th>

                  <th className="px-6 py-4 whitespace-nowrap">Description</th>

                  <th className="px-6 py-4 whitespace-nowrap">Status</th>

                  <th className="px-6 py-4 whitespace-nowrap">Remarks</th>

                  <th className="text-center px-6 py-4 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTasks.length > 0 ? (
                  // filteredTasks.map((task) => (
                  paginatedTasks.map((task) => (
                    <tr key={task._id} className="border-t hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.timeSlot}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {task.project}
                      </td>

                      <td className="px-6 py-4">{task.taskDescription}</td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={task.status} />
                      </td>

                      <td className="px-6 py-4">{task.remarks}</td>

                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <Link
                            to={`/task/${task._id}`}
                            className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"
                          >
                            <Eye size={18} />
                          </Link>

                          <button
                            onClick={() => navigate(`/edit-task/${task._id}`)}
                            className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            onClick={() => deleteTask(task._id)}
                            disabled={deletingId === task._id}
                            className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"
                          >
                            {deletingId === task._id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-16">
                      <div className="flex flex-col items-center">
                        <div className="text-6xl mb-4">📋</div>

                        <h3 className="font-semibold text-lg">
                          No Tasks Found
                        </h3>

                        <p className="text-slate-500 mt-1">
                          Create your first task to get started
                        </p>
                      </div>
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
                {filteredTasks.length === 0
                  ? 0
                  : (currentPage - 1) * itemsPerPage + 1}
              </span>
              {" - "}
              <span className="font-semibold">
                {Math.min(currentPage * itemsPerPage, filteredTasks.length)}
              </span>
              {" of "}
              <span className="font-semibold">{filteredTasks.length}</span>{" "}
              Tasks
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

function StatusBadge({ status }) {
  const styles = {
    Completed: "bg-green-100 text-green-700",
    Pending: "bg-yellow-100 text-yellow-700",
    "In Progress": "bg-blue-100 text-blue-700",
    "Not Started": "bg-gray-100 text-gray-700",
    Blocked: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}
