// import { useEffect, useState } from "react";
// import Layout from "../components/Layout";
// import StatCard from "../components/StatCard";
// import api from "../api/axios";
// import { Link, useNavigate } from "react-router-dom";
// import { X, Plus } from "lucide-react";
// import toast from "react-hot-toast";

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

// const COLORS = ["#22c55e", "#f59e0b", "#3b82f6", "#ef4444"];

// export default function AdminDashboard() {
//   const [dashboard, setDashboard] = useState({
//     employees: 0,
//     totalTasks: 0,
//     completed: 0,
//     pending: 0,
//     inProgress: 0,
//     notStarted: 0,
//     totalClients: 0,
//     dueSoon: 0,
//   });

//   const [weeklyData, setWeeklyData] = useState([]);
//   const [recentTasks, setRecentTasks] = useState([]);
//   const [showAddEmployee, setShowAddEmployee] = useState(false);
//   const [employeeForm, setEmployeeForm] = useState({
//     name: "",
//     email: "",
//     password: "",
//   });

//   const [loading, setLoading] = useState(true);
//   const [addEmployeeLoading, setAddEmployeeLoading] = useState(false);
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

//       const dashboardRes = await api.get("/dashboard/admin");
//       const weeklyRes = await api.get("/dashboard/admin-weekly");

//       setDashboard(dashboardRes.data);
//       setWeeklyData(weeklyRes.data || []);
//       setRecentTasks(dashboardRes.data.recentTasks || []);
//     } catch (error) {
//       console.log(error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAddEmployee = () => {
//     setAddEmployeeLoading(true);

//     setTimeout(() => {
//       navigate("/add-employee");
//     }, 300);
//   };

//   const handleViewAll = () => {
//     setViewAllLoading(true);

//     setTimeout(() => {
//       navigate("/all-tasks");
//     }, 300);
//   };

//   const pieData = [
//     {
//       name: "Completed",
//       value: dashboard.completed,
//     },
//     {
//       name: "Pending",
//       value: dashboard.pending,
//     },
//     {
//       name: "In Progress",
//       value: dashboard.inProgress,
//     },
//     {
//       name: "Not Started",
//       value: dashboard.notStarted,
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
//         {/* Add Employee Section */}
//         <div className="bg-white rounded-3xl shadow-sm border p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h2 className="text-2xl font-bold text-slate-900 text-start">
//                 Employee Management
//               </h2>
//               <p className="text-slate-500 mt-1">
//                 Add and manage your team members
//               </p>
//             </div>

//             <button
//               onClick={handleAddEmployee}
//               disabled={addEmployeeLoading}
//               className="inline-flex items-center gap-2 rounded-xl bg-[#2b1247] px-5 py-3 text-white disabled:opacity-70"
//             >
//               {addEmployeeLoading ? (
//                 <>
//                   <Loader2 size={18} className="animate-spin" />
//                   Loading...
//                 </>
//               ) : (
//                 <>
//                   <Plus size={18} />
//                   Add Employee
//                 </>
//               )}
//             </button>
//           </div>
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-6 mb-8">
//           <StatCard
//             title="Total Employees"
//             value={dashboard.employees}
//             icon="👨‍💼"
//             color="text-[var(--brand)]"
//             onClick={() => navigate("/employees")}
//           />

//           <StatCard
//             title="Total Tasks"
//             value={dashboard.totalTasks}
//             icon="📋"
//             color="text-indigo-600"
//           />

//           {/* <StatCard
//             title="Completed Tasks"
//             value={dashboard.completed}
//             icon="✅"
//             color="text-green-600"
//           /> */}

//           <StatCard
//             title="Pending Tasks"
//             value={dashboard.pending}
//             icon="⏳"
//             color="text-yellow-500"
//           />

//           <StatCard
//             title="In Progress Tasks"
//             value={dashboard.inProgress}
//             icon="🚀"
//             color="text-blue-600"
//           />

//           {/* <StatCard
//             title="Tasks Not Started"
//             value={dashboard.notStarted}
//             icon="❌"
//             color="text-red-500"
//           /> */}
          
//           <StatCard
//             title="Total Clients"
//             value={dashboard.totalClients}
//             icon="🏢"
//             color="text-purple-600"
//           />
//           <StatCard
//             title="Due Soon"
//             value={dashboard.dueSoon}
//             icon="⏰"
//             color="text-orange-500"
//           />
//         </div>

//         {/* Charts */}
//         <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
//           <div className="xl:col-span-2 bg-white rounded-3xl p-6 shadow-sm border">
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

//           <div className="bg-white rounded-3xl p-6 shadow-sm border">
//             <h2 className="text-xl font-semibold mb-6">Task Status</h2>

//             <div className="flex justify-center">
//               <PieChart width={280} height={280}>
//                 <Pie data={pieData} dataKey="value" outerRadius={100} label>
//                   {pieData.map((entry, index) => (
//                     <Cell key={index} fill={COLORS[index]} />
//                   ))}
//                 </Pie>
//               </PieChart>
//             </div>
//           </div>
//         </div>

//         {/* Recent Tasks */}
//         <div className="bg-white rounded-3xl shadow-sm border">
//           <div className="flex justify-between items-center px-6 py-5 border-b">
//             <h2 className="text-xl font-semibold">Recent Tasks</h2>

           
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
//                   <th className="px-6 py-4 whitespace-nowrap">
//                     Date
//                   </th>
//                   <th className="px-6 py-4 whitespace-nowrap">
//                     Employee
//                   </th>
//                   <th className="px-6 py-4 whitespace-nowrap">
//                     Project
//                   </th>
//                   <th className="px-6 py-4 whitespace-nowrap">
//                     Task
//                   </th>
//                   <th className="px-6 py-4 text-center whitespace-nowrap">
//                     Status
//                   </th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {paginatedTasks.map((task) => (
//                   <tr key={task._id} className="border-t hover:bg-slate-50">
//                     <td className="px-6 py-4 whitespace-nowrap">{task.date}</td>

//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {task.employeeId?.name}
//                     </td>

//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {task.project}
//                     </td>

//                     <td className="px-6 py-4 min-w-[600px]">
//                       {task.taskDescription}
//                     </td>

//                     <td className="px-6 py-4 text-center whitespace-nowrap">
//                       <StatusBadge status={task.status} />
//                     </td>
//                   </tr>
//                 ))}
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
//                       ? "bg-[#2b1247] text-white shadow-md"
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
//       className={`inline-flex whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}
//     >
//       {status}
//     </span>
//   );
// }

import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { Plus, Cake } from "lucide-react";

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

const COLORS = ["#22c55e", "#f59e0b", "#3b82f6", "#ef4444"];

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState({
    employees: 0,
    totalTasks: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    notStarted: 0,
    totalClients: 0,
    dueSoon: 0,
  });

  const [weeklyData, setWeeklyData] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [birthdays, setBirthdays] = useState([]);

  const [loading, setLoading] = useState(true);
  const [addEmployeeLoading, setAddEmployeeLoading] = useState(false);
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
        api.get("/dashboard/admin"),
        api.get("/dashboard/admin-weekly"),
      ]);

      setDashboard(dashboardRes.data);
      setWeeklyData(weeklyRes.data || []);
      setRecentTasks(dashboardRes.data.recentTasks || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }

    loadBirthdays();
  };

  const loadBirthdays = async () => {
    try {
      const res = await api.get("/dashboard/birthdays");
      setBirthdays(res.data || []);
    } catch (error) {
      // Don't let a birthdays failure take down the rest of the dashboard —
      // log it so it's easy to spot in devtools if the route isn't wired up.
      console.log("Failed to load birthdays:", error);
    }
  };

  const handleAddEmployee = () => {
    setAddEmployeeLoading(true);

    setTimeout(() => {
      navigate("/add-employee");
    }, 300);
  };

  const handleViewAll = () => {
    setViewAllLoading(true);

    setTimeout(() => {
      navigate("/all-tasks");
    }, 300);
  };

  const pieData = [
    {
      name: "Completed",
      value: dashboard.completed,
    },
    {
      name: "Pending",
      value: dashboard.pending,
    },
    {
      name: "In Progress",
      value: dashboard.inProgress,
    },
    {
      name: "Not Started",
      value: dashboard.notStarted,
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
        {/* Add Employee Section */}
        <div className="bg-white rounded-3xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 text-start">
                Employee Management
              </h2>
              <p className="text-slate-500 mt-1">
                Add and manage your team members
              </p>
            </div>

            <button
              onClick={handleAddEmployee}
              disabled={addEmployeeLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2b1247] px-5 py-3 text-white disabled:opacity-70"
            >
              {addEmployeeLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-6 mb-8">
          <StatCard
            title="Total Employees"
            value={dashboard.employees}
            icon="👨‍💼"
            color="text-[var(--brand)]"
            onClick={() => navigate("/employees")}
          />

          <StatCard
            title="Total Tasks"
            value={dashboard.totalTasks}
            icon="📋"
            color="text-indigo-600"
          />

          <StatCard
            title="Pending Tasks"
            value={dashboard.pending}
            icon="⏳"
            color="text-yellow-500"
          />

          <StatCard
            title="In Progress Tasks"
            value={dashboard.inProgress}
            icon="🚀"
            color="text-blue-600"
          />

          <StatCard
            title="Total Clients"
            value={dashboard.totalClients}
            icon="🏢"
            color="text-purple-600"
          />
          <StatCard
            title="Due Soon"
            value={dashboard.dueSoon}
            icon="⏰"
            color="text-orange-500"
          />
        </div>

        {/* Upcoming Birthdays */}
        <div className="bg-white rounded-3xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-5">
            <Cake size={20} className="text-pink-500" />
            <h2 className="text-xl font-semibold">Upcoming Birthdays</h2>
          </div>

          {birthdays.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-1">
              {birthdays.map((emp) => (
                <BirthdayCard key={emp._id} employee={emp} />
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">
              No birthdays in the next 30 days.
            </p>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="xl:col-span-2 bg-white rounded-3xl p-6 shadow-sm border">
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

          <div className="bg-white rounded-3xl p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-6">Task Status</h2>

            <div className="flex justify-center">
              <PieChart width={280} height={280}>
                <Pie data={pieData} dataKey="value" outerRadius={100} label>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
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
                  <th className="px-6 py-4 whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap">
                    Employee
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap">
                    Project
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap">
                    Task
                  </th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedTasks.map((task) => (
                  <tr key={task._id} className="border-t hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">{task.date}</td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.employeeId?.name}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.project}
                    </td>

                    <td className="px-6 py-4 min-w-[600px]">
                      {task.taskDescription}
                    </td>

                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <StatusBadge status={task.status} />
                    </td>
                  </tr>
                ))}
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
                        ? "bg-[#2b1247] text-white shadow-md"
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

function BirthdayCard({ employee }) {
  const initials = employee.name
    ?.split(" ")
    ?.map((n) => n[0])
    ?.join("")
    ?.substring(0, 2)
    ?.toUpperCase();

  const birthdayDate = new Date(employee.dob);
  const formattedDate = birthdayDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  let badgeLabel = formattedDate;
  let badgeClass = "bg-slate-100 text-slate-600";
  let cardClass = "border-slate-200";

  if (employee.isToday) {
    badgeLabel = "🎉 Today";
    badgeClass = "bg-pink-100 text-pink-700";
    cardClass = "border-pink-300 bg-pink-50";
  } else if (employee.isTomorrow) {
    badgeLabel = "Tomorrow";
    badgeClass = "bg-orange-100 text-orange-700";
    cardClass = "border-orange-200";
  } else if (employee.isThisWeek) {
    badgeLabel = `In ${employee.daysUntil} days`;
    badgeClass = "bg-blue-100 text-blue-700";
    cardClass = "border-blue-200";
  } else if (employee.isThisMonth) {
    badgeLabel = formattedDate;
    badgeClass = "bg-purple-100 text-purple-700";
    cardClass = "border-purple-200";
  }

  return (
    <div
      className={`flex-shrink-0 w-48 rounded-2xl border p-4 flex flex-col items-center text-center gap-2 ${cardClass}`}
    >
      <div className="w-12 h-12 rounded-full bg-[#2b1247] text-white flex items-center justify-center font-semibold">
        {initials}
      </div>

      <div>
        <p className="font-medium text-slate-800 text-sm truncate w-40">
          {employee.name}
        </p>
        <p className="text-xs text-slate-400">
          {employee.department || employee.designation || ""}
        </p>
      </div>

      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}
      >
        {badgeLabel}
      </span>
    </div>
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
      className={`inline-flex whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}