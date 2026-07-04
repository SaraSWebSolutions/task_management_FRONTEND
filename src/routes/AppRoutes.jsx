import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import AdminRoute from "./AdminRoutes";

import Login from "../pages/Login";
import Profile from "../pages/Profile";

import EmployeeDashboard from "../pages/EmployeeDashboard";
import AdminDashboard from "../pages/AdminDashboard";

import MyTasks from "../pages/MyTasks";
import AddTask from "../pages/AddTask";
import AllTasks from "../pages/AllTasks";
import TaskDetails from "../pages/TaskDetails";
import AssignTask from "../pages/AssignTask";
import EditTask from "../pages/EditTask";
import AddEmployee from "../pages/AddEmployee";
import Employees from "../pages/Employees";
import EditEmployee from "../pages/EditEmployee";

import Clients from "../pages/Clients";
import AddClient from "../pages/AddClient";
import EditClient from "../pages/EditClient";

import Leads from "../pages/Leads";
import AddLead from "../pages/AddLead";
import EditLead from "../pages/EditLead";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Login */}
      <Route path="/" element={<Login />} />

      {/* Protected Routes */}

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Employee */}

      <Route
        path="/employee"
        element={
          <ProtectedRoute>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-tasks"
        element={
          <ProtectedRoute>
            <MyTasks />
          </ProtectedRoute>
        }
      />

      <Route
        path="/add-task"
        element={
          <ProtectedRoute>
            <AddTask />
          </ProtectedRoute>
        }
      />

      {/* Admin */}

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      <Route
        path="/all-tasks"
        element={
          <AdminRoute>
            <AllTasks />
          </AdminRoute>
        }
      />

      <Route
        path="/employees"
        element={
          <AdminRoute>
            <Employees />
          </AdminRoute>
        }
      />

      <Route
        path="/add-employee"
        element={
          <AdminRoute>
            <AddEmployee />
          </AdminRoute>
        }
      />

      <Route
        path="/edit-employee/:id"
        element={
          <AdminRoute>
            <EditEmployee />
          </AdminRoute>
        }
      />

      <Route
        path="/clients"
        element={
          <AdminRoute>
            <Clients />
          </AdminRoute>
        }
      />

      <Route
        path="/add-client"
        element={
          <AdminRoute>
            <AddClient />
          </AdminRoute>
        }
      />

      <Route
        path="/edit-client/:id"
        element={
          <AdminRoute>
            <EditClient />
          </AdminRoute>
        }
      />

      <Route
        path="/leads"
        element={
          <AdminRoute>
            <Leads />
          </AdminRoute>
        }
      />

      <Route
        path="/add-lead"
        element={
          <AdminRoute>
            <AddLead />
          </AdminRoute>
        }
      />

      <Route
        path="/edit-lead/:id"
        element={
          <AdminRoute>
            <EditLead />
          </AdminRoute>
        }
      />

      {/* Common */}

      <Route
        path="/task/:id"
        element={
          <ProtectedRoute>
            <TaskDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/assign-task"
        element={
          <AdminRoute>
            <AssignTask />
          </AdminRoute>
        }
      />

      <Route
        path="/edit-task/:id"
        element={
          <ProtectedRoute>
            <EditTask />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
