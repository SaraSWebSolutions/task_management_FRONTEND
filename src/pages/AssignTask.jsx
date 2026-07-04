// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import Layout from "../components/Layout";
// import api from "../api/axios";
// import toast from "react-hot-toast";

// import { Save, Calendar, Loader2, User } from "lucide-react";

// export default function AssignTask() {
//   const navigate = useNavigate();

//   const [employees, setEmployees] = useState([]);

//   const [employeeId, setEmployeeId] = useState("");

//   const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

//   const [pageLoading, setPageLoading] = useState(true);
//   const [taskLoading, setTaskLoading] = useState(false);
//   const [saving, setSaving] = useState(false);

//   const timeSlots = [
//     "10:00 AM - 11:00 AM",
//     "11:00 AM - 12:00 PM",
//     "12:00 PM - 01:00 PM",
//     "01:00 PM - 02:00 PM",
//     "02:00 PM - 03:00 PM",
//     "03:00 PM - 04:00 PM",
//     "04:00 PM - 05:00 PM",
//     "05:00 PM - 06:00 PM",
//     "06:00 PM - 07:00 PM",
//     "07:00 PM - 08:00 PM",
//   ];

//   const createDefaultTasks = () =>
//     timeSlots.map((slot) => ({
//       timeSlot: slot,
//       project: "",
//       taskDescription: "",
//       status: "Not Started",
//       remarks: "",
//     }));
//   const [tasks, setTasks] = useState(createDefaultTasks());

//   const handleChange = (index, field, value) => {
//     const updated = [...tasks];
//     updated[index][field] = value;
//     setTasks(updated);
//   };

//   const loadTasksByDate = async () => {
//     try {
//       const res = await api.get(`/tasks/my-tasks?date=${date}`);

//       const existingTasks = res.data || [];

//       const mergedTasks = timeSlots.map((slot) => {
//         const found = existingTasks.find((task) => task.timeSlot === slot);

//         return (
//           found || {
//             timeSlot: slot,
//             project: "",
//             taskDescription: "",
//             status: "Not Started",
//             remarks: "",
//           }
//         );
//       });

//       setTasks(mergedTasks);

//       if (existingTasks.length > 0) {
//         toast.success(`${existingTasks.length} existing tasks loaded`);
//       }
//     } catch (error) {
//       setTasks(createDefaultTasks());
//     }
//   };

//   useEffect(() => {
//     loadEmployees();
//   }, []);

//   const loadEmployees = async () => {
//     try {
//       setPageLoading(true);

//       const res = await api.get("/users/employees");
//       console.log("Employees:", res.data);
//       setEmployees(res.data);
//     } catch (error) {
//       console.log(error);
//     } finally {
//       setPageLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (employeeId && date) {
//       loadAssignedTasks();
//     }
//   }, [employeeId, date]);

//   const loadAssignedTasks = async () => {
//     try {
//       setTaskLoading(true);

//       const res = await api.get(`/tasks/employee/${employeeId}?date=${date}`);

//       if (res.data?.tasks?.length) {
//         const existingTasks = res.data.tasks;

//         const mergedTasks = timeSlots.map((slot) => {
//           const found = existingTasks.find((task) => task.timeSlot === slot);

//           return (
//             found || {
//               timeSlot: slot,
//               project: "",
//               taskDescription: "",
//               status: "Not Started",
//               remarks: "",
//             }
//           );
//         });

//         setTasks(mergedTasks);

//         toast.success(`${existingTasks.length} assigned tasks loaded`);
//       }
//     } catch (error) {
//       console.log(error);

//       setTasks(
//         timeSlots.map((slot) => ({
//           timeSlot: slot,
//           project: "",
//           taskDescription: "",
//           status: "Not Started",
//           remarks: "",
//         })),
//       );
//     } finally {
//       setTaskLoading(false);
//     }
//   };

//   const assignTasks = async () => {
//     if (!employeeId) {
//       return toast.error("Please select employee");
//     }

//     try {
//       setSaving(true);

//       await api.post("/tasks/assign", {
//         employeeId,
//         date,
//         tasks,
//       });

//       toast.success("Tasks Assigned Successfully");

//       navigate("/all-tasks");
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Assignment Failed");
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (pageLoading) {
//     return (
//       <Layout>
//         <div className="h-[70vh] flex items-center justify-center">
//           <div className="flex flex-col items-center gap-4">
//             <div className="w-12 h-12 border-4 border-slate-200 border-t-[var(--brand)] rounded-full animate-spin"></div>
//             <p className="text-slate-500">Loading employees...</p>
//           </div>
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout>
//       <div className="space-y-8 max-w-[1600px] mx-auto">
//         {/* Top Section */}
//         <div className="bg-white rounded-3xl border shadow-sm p-3 mb-8">
//           <div className="flex flex-wrap gap-4 justify-between">
//             <div>
//               <h2 className="text-2xl font-bold text-left">
//                 Assign Employee Tasks
//               </h2>

//               <p className="text-slate-500 text-left">
//                 Assign work to employees
//               </p>
//             </div>

//             <div className="flex flex-col gap-4 sm:flex-row">
//               {/* Employee */}
//               <div className="relative flex-1">
//                 <User
//                   size={18}
//                   className="absolute left-3 top-3 text-slate-400"
//                 />

//                 <select
//                   value={employeeId}
//                   onChange={(e) => setEmployeeId(e.target.value)}
//                   className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-2xl bg-white shadow-sm text-slate-700 outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
//                 >
//                   <option value="">Select Employee</option>

//                   {employees.map((emp) => (
//                     <option key={emp._id} value={emp._id}>
//                       {emp.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Date */}
//               <div className="relative w-full sm:w-auto">
//                 <Calendar
//                   size={18}
//                   className="absolute left-3 top-3 text-slate-400"
//                 />

//                 <input
//                   type="date"
//                   value={date}
//                   onChange={(e) => setDate(e.target.value)}
//                   className="w-full sm:w-auto pl-10 pr-4 py-3 border border-slate-200 rounded-2xl bg-white shadow-sm text-slate-700 outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
//                 />
//               </div>

//               {/* <button
//                 onClick={assignTasks}
//                 className="inline-flex items-center justify-center rounded-2xl bg-[var(--brand)] px-4 py-3 sm:px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-dark)]"
//               >
//                 <Save size={18} />
//                 <span className="hidden sm:inline">Assign Tasks</span>
//                 <span className="inline sm:hidden lowercase">assign</span>
//               </button> */}
//               <button
//                 onClick={assignTasks}
//                 disabled={saving}
//                 className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] px-4 py-3 sm:px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-dark)] disabled:opacity-70"
//               >
//                 {saving ? (
//                   <>
//                     <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
//                     Saving...
//                   </>
//                 ) : (
//                   <>
//                     <Save size={18} />
//                     <span className="hidden sm:inline">Assign Tasks</span>
//                     <span className="inline sm:hidden">Assign</span>
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Table */}
//         {/* <div className="bg-white rounded-3xl border shadow-sm overflow-hidden"> */}
//         <div className="relative bg-white rounded-3xl border shadow-sm overflow-hidden">
//           <div className="overflow-x-auto">
//             {taskLoading && (
//               <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-20">
//                 <div className="flex flex-col items-center gap-3">
//                   <div className="w-10 h-10 border-4 border-slate-200 border-t-[var(--brand)] rounded-full animate-spin"></div>
//                   <p className="text-sm text-slate-600">
//                     Loading assigned tasks...
//                   </p>
//                 </div>
//               </div>
//             )}
//             <table className="w-full min-w-full">
//               <thead>
//                 <tr className="bg-[var(--brand)] text-white">
//                   <th className="px-4 py-4">Time</th>

//                   <th className="px-4 py-4">Project</th>

//                   <th className="px-4 py-4">Task Description</th>

//                   <th className="px-4 py-4">Status</th>

//                   <th className="px-4 py-4">Remarks</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {tasks.map((task, index) => (
//                   // <tr key={index} className="border-b">
//                   <tr
//                     key={index}
//                     className={`border-b transition ${
//                       task._id
//                         ? "bg-green-50 border-l-4 border-l-green-500"
//                         : "bg-white"
//                     }`}
//                   >
//                     <td className="p-2">
//                       <div className="flex flex-col gap-1">
//                         <span>{task.timeSlot}</span>
//                       </div>
//                     </td>

//                     <td className="p-2">
//                       <input
//                         value={task.project}
//                         onChange={(e) =>
//                           handleChange(index, "project", e.target.value)
//                         }
//                         className="w-full border rounded-xl px-3 py-2"
//                       />
//                     </td>

//                     <td className="p-2">
//                       <textarea
//                         rows={2}
//                         value={task.taskDescription}
//                         onChange={(e) =>
//                           handleChange(index, "taskDescription", e.target.value)
//                         }
//                         className="w-full border rounded-xl px-3 py-2"
//                       />
//                     </td>

//                     <td className="p-2">
//                       <select
//                         value={task.status}
//                         onChange={(e) =>
//                           handleChange(index, "status", e.target.value)
//                         }
//                         className="w-full border rounded-xl px-3 py-2"
//                       >
//                         <option>Not Started</option>
//                         <option>Pending</option>
//                         <option>In Progress</option>
//                         <option>Completed</option>
//                         <option>Blocked</option>
//                       </select>
//                     </td>

//                     <td className="p-2">
//                       <textarea
//                         rows={2}
//                         value={task.remarks}
//                         onChange={(e) =>
//                           handleChange(index, "remarks", e.target.value)
//                         }
//                         className="w-full border rounded-xl px-3 py-2"
//                       />
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// }

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api/axios";
import toast from "react-hot-toast";

import { Save, Calendar, Loader2, User } from "lucide-react";

export default function AssignTask() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);

  const [employeeId, setEmployeeId] = useState("");

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [pageLoading, setPageLoading] = useState(true);
  const [taskLoading, setTaskLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const timeSlots = [
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

  const createDefaultTasks = () =>
    timeSlots.map((slot) => ({
      timeSlot: slot,
      project: "",
      taskDescription: "",
      status: "Not Started",
      remarks: "",
    }));
  const [tasks, setTasks] = useState(createDefaultTasks());

  const handleChange = (index, field, value) => {
    const updated = [...tasks];
    updated[index][field] = value;
    setTasks(updated);
  };

  const loadTasksByDate = async () => {
    try {
      const res = await api.get(`/tasks/my-tasks?date=${date}`);

      const existingTasks = res.data || [];

      const mergedTasks = timeSlots.map((slot) => {
        const found = existingTasks.find((task) => task.timeSlot === slot);

        return (
          found || {
            timeSlot: slot,
            project: "",
            taskDescription: "",
            status: "Not Started",
            remarks: "",
          }
        );
      });

      setTasks(mergedTasks);

      if (existingTasks.length > 0) {
        toast.success(`${existingTasks.length} existing tasks loaded`);
      }
    } catch (error) {
      setTasks(createDefaultTasks());
    }
  };

  useEffect(() => {
    loadEmployees();
    loadClients();
  }, []);

  const loadEmployees = async () => {
    try {
      setPageLoading(true);

      const res = await api.get("/users/employees");
      setEmployees(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setPageLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const res = await api.get("/clients");
      setClients(res.data.clients || []);
    } catch (error) {
      console.log(error);
    }
  };

  // Client company name (falling back to client name) for the Project dropdown
  const projectOptions = [
    ...new Set(
      clients.map((c) => c.companyName || c.clientName).filter(Boolean),
    ),
  ];

  useEffect(() => {
    if (employeeId && date) {
      loadAssignedTasks();
    }
  }, [employeeId, date]);

  const loadAssignedTasks = async () => {
    try {
      setTaskLoading(true);

      const res = await api.get(`/tasks/employee/${employeeId}?date=${date}`);

      if (res.data?.tasks?.length) {
        const existingTasks = res.data.tasks;

        const mergedTasks = timeSlots.map((slot) => {
          const found = existingTasks.find((task) => task.timeSlot === slot);

          return (
            found || {
              timeSlot: slot,
              project: "",
              taskDescription: "",
              status: "Not Started",
              remarks: "",
            }
          );
        });

        setTasks(mergedTasks);

        toast.success(`${existingTasks.length} assigned tasks loaded`);
      }
    } catch (error) {
      console.log(error);

      setTasks(
        timeSlots.map((slot) => ({
          timeSlot: slot,
          project: "",
          taskDescription: "",
          status: "Not Started",
          remarks: "",
        })),
      );
    } finally {
      setTaskLoading(false);
    }
  };

  const assignTasks = async () => {
    if (!employeeId) {
      return toast.error("Please select employee");
    }

    try {
      setSaving(true);

      await api.post("/tasks/assign", {
        employeeId,
        date,
        tasks,
      });

      toast.success("Tasks Assigned Successfully");

      navigate("/all-tasks");
    } catch (error) {
      toast.error(error.response?.data?.message || "Assignment Failed");
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <Layout>
        <div className="h-[70vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-[var(--brand)] rounded-full animate-spin"></div>
            <p className="text-slate-500">Loading employees...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 max-w-[1600px] mx-auto">
        {/* Top Section */}
        <div className="bg-white rounded-3xl border shadow-sm p-3 mb-8">
          <div className="flex flex-wrap gap-4 justify-between">
            <div>
              <h2 className="text-2xl font-bold text-left">
                Assign Employee Tasks
              </h2>

              <p className="text-slate-500 text-left">
                Assign work to employees
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              {/* Employee */}
              <div className="relative flex-1">
                <User
                  size={18}
                  className="absolute left-3 top-3 text-slate-400"
                />

                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-2xl bg-white shadow-sm text-slate-700 outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
                >
                  <option value="">Select Employee</option>

                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="relative w-full sm:w-auto">
                <Calendar
                  size={18}
                  className="absolute left-3 top-3 text-slate-400"
                />

                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full sm:w-auto pl-10 pr-4 py-3 border border-slate-200 rounded-2xl bg-white shadow-sm text-slate-700 outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
                />
              </div>

              <button
                onClick={assignTasks}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] px-4 py-3 sm:px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-dark)] disabled:opacity-70"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span className="hidden sm:inline">Assign Tasks</span>
                    <span className="inline sm:hidden">Assign</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="relative bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {taskLoading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-[var(--brand)] rounded-full animate-spin"></div>
                  <p className="text-sm text-slate-600">
                    Loading assigned tasks...
                  </p>
                </div>
              </div>
            )}
            <table className="w-full min-w-full">
              <thead>
                <tr className="bg-[var(--brand)] text-white">
                  <th className="px-4 py-4 text-sm font-semibold text-left whitespace-nowrap">
                    Time
                  </th>
                  <th className="px-4 py-4 text-sm font-semibold text-left">
                    Project
                  </th>
                  <th className="px-4 py-4 text-sm font-semibold text-left">
                    Task Description
                  </th>
                  <th className="px-4 py-4 text-sm font-semibold text-left whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-4 text-sm font-semibold text-left">
                    Remarks
                  </th>
                </tr>
              </thead>

              <tbody>
                {tasks.map((task, index) => (
                  <tr
                    key={index}
                    className={`border-b last:border-b-0 transition-colors ${
                      task._id
                        ? "bg-green-50/60 border-l-4 border-l-green-500"
                        : index % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50/50"
                    }`}
                  >
                    <td className="p-3 align-top">
                      <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                        {task.timeSlot}
                      </span>
                    </td>

                    <td className="p-3 align-top">
                      <ProjectSelect
                        value={task.project}
                        options={projectOptions}
                        onChange={(value) =>
                          handleChange(index, "project", value)
                        }
                      />
                    </td>

                    <td className="p-3 align-top">
                      <textarea
                        rows={2}
                        value={task.taskDescription}
                        onChange={(e) =>
                          handleChange(index, "taskDescription", e.target.value)
                        }
                        placeholder="What did they work on?"
                        className={fieldClass}
                      />
                    </td>

                    <td className="p-3 align-top">
                      <StatusSelect
                        value={task.status}
                        onChange={(value) =>
                          handleChange(index, "status", value)
                        }
                      />
                    </td>

                    <td className="p-3 align-top">
                      <textarea
                        rows={2}
                        value={task.remarks}
                        onChange={(e) =>
                          handleChange(index, "remarks", e.target.value)
                        }
                        placeholder="Remarks"
                        className={fieldClass}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* ---------- Shared styling & small building blocks ---------- */

const fieldClass =
  "w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] outline-none transition-shadow";

const statusStyles = {
  "Not Started": "bg-gray-100 text-gray-700 border-gray-200",
  Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
  Completed: "bg-green-100 text-green-700 border-green-200",
  Blocked: "bg-red-100 text-red-700 border-red-200",
};

function StatusSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-xl px-3 py-2 text-sm font-medium border outline-none cursor-pointer transition-colors ${
        statusStyles[value] || statusStyles["Not Started"]
      }`}
    >
      <option>Not Started</option>
      <option>Pending</option>
      <option>In Progress</option>
      <option>Completed</option>
      <option>Blocked</option>
    </select>
  );
}

function ProjectSelect({ value, options, onChange }) {
  // Keep a previously-saved value visible even if it no longer
  // matches a current client (e.g. client renamed/deleted since).
  const hasCustomValue = value && !options.includes(value);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={fieldClass}
    >
      <option value="">Select Project</option>
      {hasCustomValue && <option value={value}>{value}</option>}
      {options.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
}