// import { useEffect, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import Layout from "../components/Layout";
// import StatCard from "../components/StatCard";
// import api from "../api/axios";

// import {
//   ResponsiveContainer,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   PieChart,
//   Pie,
//   Cell,
// } from "recharts";

// import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

// const COLORS = ["#22c55e", "#f59e0b", "#3b82f6", "#64748b", "#ef4444"];

// export default function EmployeeDashboard() {
//   const [stats, setStats] = useState({
//     totalTasks: 0,
//     completed: 0,
//     pending: 0,
//     inProgress: 0,
//     notStarted: 0,
//     blocked: 0,
//   });

//   const [weeklyData, setWeeklyData] = useState([]);
//   const [recentTasks, setRecentTasks] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [viewAllLoading, setViewAllLoading] = useState(false);

//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 4;

//   const totalPages = Math.ceil(recentTasks.length / itemsPerPage);

//   const paginatedTasks = recentTasks.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage,
//   );

//   const navigate = useNavigate();

//   useEffect(() => {
//     loadDashboard();
//   }, []);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [recentTasks]);

//   const loadDashboard = async () => {
//     try {
//       setLoading(true);

//       const [dashboardRes, weeklyRes] = await Promise.all([
//         api.get("/dashboard/employee"),
//         api.get("/dashboard/weekly"),
//       ]);

//       setStats(dashboardRes.data);
//       setWeeklyData(weeklyRes.data || []);
//       setRecentTasks(dashboardRes.data.recentTasks || []);
//     } catch (error) {
//       console.log(error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleViewAll = () => {
//     setViewAllLoading(true);

//     setTimeout(() => {
//       navigate("/my-tasks");
//     }, 300);
//   };

//   const pieData = [
//     {
//       name: "Completed",
//       value: stats.completed,
//     },
//     {
//       name: "Pending",
//       value: stats.pending,
//     },
//     {
//       name: "In Progress",
//       value: stats.inProgress,
//     },
//     {
//       name: "Not Started",
//       value: stats.notStarted,
//     },
//     {
//       name: "Blocked",
//       value: stats.blocked || 0,
//     },
//   ];

//   if (loading) {
//     return (
//       <Layout>
//         <div className="flex items-center justify-center min-h-[70vh]">
//           <div className="text-center">
//             <Loader2
//               size={50}
//               className="animate-spin text-[var(--brand)] mx-auto mb-4"
//             />
//             <p className="text-slate-600 font-medium">Loading dashboard...</p>
//           </div>
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout>
//       <div className="space-y-8">
//         {/* Stats */}
//         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
//           <StatCard
//             title="Total Tasks"
//             value={stats.totalTasks}
//             icon="📋"
//             color="text-[var(--brand)]"
//           />

//           <StatCard
//             title="Completed Task"
//             value={stats.completed}
//             icon="✅"
//             color="text-green-600"
//           />

//           <StatCard
//             title="Pending Task"
//             value={stats.pending}
//             icon="⏳"
//             color="text-yellow-500"
//           />

//           <StatCard
//             title="In Progress Task"
//             value={stats.inProgress}
//             icon="🚀"
//             color="text-blue-600"
//           />

//           <StatCard
//             title="Task Not Started"
//             value={stats.notStarted}
//             icon="❌"
//             color="text-red-500"
//           />
//         </div>

//         {/* Charts */}
//         <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
//           {/* Weekly Chart */}
//           <div className="xl:col-span-2 bg-white rounded-3xl shadow-sm border p-6">
//             <h2 className="text-xl font-semibold mb-6">Weekly Task Report</h2>

//             <ResponsiveContainer width="100%" height={350}>
//               <BarChart data={weeklyData}>
//                 <XAxis dataKey="day" />
//                 <YAxis />
//                 <Tooltip />

//                 <Bar
//                   dataKey="count"
//                   fill="var(--brand)"
//                   radius={[8, 8, 0, 0]}
//                 />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Pie Chart */}
//           <div className="bg-white rounded-3xl shadow-sm border p-6">
//             <h2 className="text-xl font-semibold mb-6">Task Status</h2>

//             <div className="flex justify-center">
//               <PieChart width={300} height={300}>
//                 <Pie data={pieData} dataKey="value" outerRadius={100} label>
//                   {pieData.map((entry, index) => (
//                     <Cell key={index} fill={COLORS[index]} />
//                   ))}
//                 </Pie>

//                 <Tooltip />
//               </PieChart>
//             </div>
//           </div>
//         </div>

//         {/* Recent Tasks */}
//         <div className="bg-white rounded-3xl shadow-sm border">
//           <div className="flex justify-between items-center px-6 py-5 border-b">
//             <h2 className="text-xl font-semibold">Recent Tasks</h2>

//             {/* <Link
//               to="/my-tasks"
//               className="bg-[var(--brand)] text-white px-4 py-2 rounded-xl text-sm"
//             >
//               View All
//             </Link> */}
//             <button
//               onClick={handleViewAll}
//               disabled={viewAllLoading}
//               className="bg-[var(--brand)] text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 disabled:opacity-70"
//             >
//               {viewAllLoading ? (
//                 <>
//                   <Loader2 size={16} className="animate-spin" />
//                   Loading...
//                 </>
//               ) : (
//                 "View All"
//               )}
//             </button>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="min-w-[1300px] w-full">
//               <thead>
//                 <tr className="bg-slate-50">
//                   <th className="px-6 py-4 whitespace-nowrap">Date</th>

//                   <th className="px-6 py-4 whitespace-nowrap">Project</th>

//                   <th className="px-6 py-4">Description</th>

//                   <th className="px-6 py-4 whitespace-nowrap">Status</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {paginatedTasks.length > 0 ? (
//                   paginatedTasks.map((task) => (
//                     <tr key={task._id} className="border-t hover:bg-slate-50">
//                       <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
//                         {task.date}
//                       </td>

//                       <td className="px-6 py-4 font-medium">{task.project}</td>

//                       <td className="px-6 py-4">{task.taskDescription}</td>

//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <StatusBadge status={task.status} />
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td
//                       colSpan="4"
//                       className="text-center py-10 text-slate-500"
//                     >
//                       No Tasks Found
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//           <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-slate-50 rounded-b-3xl">
//             {/* Left Side */}
//             <div className="text-sm text-slate-600">
//               Showing{" "}
//               <span className="font-semibold text-slate-800">
//                 {(currentPage - 1) * itemsPerPage + 1}
//               </span>
//               {" - "}
//               <span className="font-semibold text-slate-800">
//                 {Math.min(currentPage * itemsPerPage, recentTasks.length)}
//               </span>
//               {" of "}
//               <span className="font-semibold text-slate-800">
//                 {recentTasks.length}
//               </span>{" "}
//               tasks
//             </div>

//             {/* Right Side */}
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={() => setCurrentPage((p) => p - 1)}
//                 disabled={currentPage === 1}
//                 className="flex items-center gap-1 px-4 py-2 rounded-xl border bg-white hover:bg-slate-100 disabled:opacity-40"
//               >
//                 <ChevronLeft size={16} />
//               </button>

//               {[...Array(totalPages)].map((_, index) => (
//                 <button
//                   key={index}
//                   onClick={() => setCurrentPage(index + 1)}
//                   className={`w-10 h-10 rounded-xl font-medium transition ${
//                     currentPage === index + 1
//                       ? "bg-brand text-white shadow-md"
//                       : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
//                   }`}
//                 >
//                   {index + 1}
//                 </button>
//               ))}

//               <button
//                 onClick={() => setCurrentPage((p) => p + 1)}
//                 disabled={currentPage === totalPages}
//                 className="flex items-center gap-1 px-4 py-2 rounded-xl border bg-white hover:bg-slate-100 disabled:opacity-40"
//               >
//                 <ChevronRight size={16} />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// }

// function StatusBadge({ status }) {
//   const styles = {
//     Completed: "bg-green-100 text-green-700",

//     Pending: "bg-yellow-100 text-yellow-700",

//     "In Progress": "bg-blue-100 text-blue-700",

//     "Not Started": "bg-gray-100 text-gray-700",

//     Blocked: "bg-red-100 text-red-700",
//   };

//   return (
//     <span
//       className={`inline-flex whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold ${
//         styles[status] || "bg-gray-100 text-gray-700"
//       }`}
//     >
//       {status}
//     </span>
//   );
// }


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import api from "../api/axios";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const COLORS = ["#22c55e", "#f59e0b", "#3b82f6", "#64748b", "#ef4444"];

export default function EmployeeDashboard() {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    notStarted: 0,
    blocked: 0,
  });

  const [weeklyData, setWeeklyData] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [viewAllLoading, setViewAllLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const totalPages = Math.ceil(recentTasks.length / itemsPerPage);

  const paginatedTasks = recentTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [recentTasks]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [dashboardRes, weeklyRes] = await Promise.all([
        api.get("/dashboard/employee"),
        api.get("/dashboard/weekly"),
      ]);

      setStats(dashboardRes.data);
      setWeeklyData(weeklyRes.data || []);
      setRecentTasks(dashboardRes.data.recentTasks || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = () => {
    setViewAllLoading(true);

    setTimeout(() => {
      navigate("/my-tasks");
    }, 300);
  };

  const pieData = [
    {
      name: "Completed",
      value: stats.completed,
    },
    {
      name: "Pending",
      value: stats.pending,
    },
    {
      name: "In Progress",
      value: stats.inProgress,
    },
    {
      name: "Not Started",
      value: stats.notStarted,
    },
    {
      name: "Blocked",
      value: stats.blocked || 0,
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <Loader2
              size={50}
              className="animate-spin text-[var(--brand)] mx-auto mb-4"
            />
            <p className="text-slate-600 font-medium">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <StatCard
            title="Total Tasks"
            value={stats.totalTasks}
            icon="📋"
            color="text-[var(--brand)]"
          />

          <StatCard
            title="Completed Task"
            value={stats.completed}
            icon="✅"
            color="text-green-600"
          />

          <StatCard
            title="Pending Task"
            value={stats.pending}
            icon="⏳"
            color="text-yellow-500"
          />

          <StatCard
            title="In Progress Task"
            value={stats.inProgress}
            icon="🚀"
            color="text-blue-600"
          />

          <StatCard
            title="Task Not Started"
            value={stats.notStarted}
            icon="⚪"
            color="text-gray-500"
          />

          <StatCard
            title="Blocked Task"
            value={stats.blocked}
            icon="🚫"
            color="text-red-500"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Weekly Chart */}
          <div className="xl:col-span-2 bg-white rounded-3xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-6">Weekly Task Report</h2>

            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />

                <Bar
                  dataKey="count"
                  fill="var(--brand)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-3xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-6">Task Status</h2>

            <div className="flex justify-center">
              <PieChart width={300} height={300}>
                <Pie data={pieData} dataKey="value" outerRadius={100} label>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-3xl shadow-sm border">
          <div className="flex justify-between items-center px-6 py-5 border-b">
            <h2 className="text-xl font-semibold">Recent Tasks</h2>

            <button
              onClick={handleViewAll}
              disabled={viewAllLoading}
              className="bg-[var(--brand)] text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 disabled:opacity-70"
            >
              {viewAllLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Loading...
                </>
              ) : (
                "View All"
              )}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1300px] w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 whitespace-nowrap">Date</th>

                  <th className="px-6 py-4 whitespace-nowrap">Project</th>

                  <th className="px-6 py-4">Description</th>

                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                </tr>
              </thead>

              <tbody>
                {paginatedTasks.length > 0 ? (
                  paginatedTasks.map((task) => (
                    <tr key={task._id} className="border-t hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {task.date}
                      </td>

                      <td className="px-6 py-4 font-medium">{task.project}</td>

                      <td className="px-6 py-4">{task.taskDescription}</td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={task.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="text-center py-10 text-slate-500"
                    >
                      No Tasks Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-slate-50 rounded-b-3xl">
            {/* Left Side */}
            <div className="text-sm text-slate-600">
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {recentTasks.length === 0
                  ? 0
                  : (currentPage - 1) * itemsPerPage + 1}
              </span>
              {" - "}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * itemsPerPage, recentTasks.length)}
              </span>
              {" of "}
              <span className="font-semibold text-slate-800">
                {recentTasks.length}
              </span>{" "}
              tasks
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-xl border bg-white hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>

              {totalPages > 1 &&
                [...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`w-10 h-10 rounded-xl font-medium transition ${
                      currentPage === index + 1
                        ? "bg-brand text-white shadow-md"
                        : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}

              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-xl border bg-white hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
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
      className={`inline-flex whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}