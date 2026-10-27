import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import PermissionRoute from "../components/PermissionRoute";

import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import Profile from "../pages/Profile";
import MyWork from "../pages/MyWork";
import Dashboard from "../pages/Dashboard";
import FinanceDashboard from "../pages/FinanceDashboard";
import Notifications from "../pages/Notifications";
import Calendar from "../pages/Calendar";
import CalendarEvent from "../pages/CalendarEvent";


import TaskDetails from "../pages/TaskDetails";

import Clients from "../pages/Clients";
import AddClient from "../pages/AddClient";
import EditClient from "../pages/EditClient";
import Campaigns from "../pages/Campaigns";

import Leads from "../pages/Leads";
import AddLead from "../pages/AddLead";
import EditLead from "../pages/EditLead";

import LeadDetails from "../pages/LeadDetails";
import Projects from "../pages/Projects";
import ProjectDetails from "../pages/ProjectDetails";
import ProjectDashboard from "../pages/ProjectDashboard";
import ProjectTaskBoard from "../pages/ProjectTaskBoard";
import ProjectTaskList from "../pages/ProjectTaskList";
import Milestones from "../pages/Milestones";
import TimeTracking from "../pages/TimeTracking";
import Reports from "../pages/Reports";
import ReportDashboard from "../pages/ReportDashboard";
import Users from "../pages/Users";
import UserForm from "../pages/UserForm";
import UserProfile from "../pages/UserProfile";
import Roles from "../pages/Roles";
import CrmDashboard from "../pages/CrmDashboard";
import LeadPipeline from "../pages/LeadPipeline";
import Customers from "../pages/Customers";
import Deals from "../pages/Deals";
import CrmTasks from "../pages/CrmTasks";
import FollowUps from "../pages/FollowUps";
import FinanceRevenue from "../pages/FinanceRevenue";
import FinanceExpenses from "../pages/FinanceExpenses";
import FinanceInvoices from "../pages/FinanceInvoices";
import FinancePayments from "../pages/FinancePayments";
import FinanceSubscriptions from "../pages/FinanceSubscriptions";
import FinancePlans from "../pages/FinancePlans";
import FinanceTax from "../pages/FinanceTax";
import FinanceReports from "../pages/FinanceReports";
import AnalyticsSales from "../pages/AnalyticsSales";
import AnalyticsRevenue from "../pages/AnalyticsRevenue";
import AnalyticsUsers from "../pages/AnalyticsUsers";
import AnalyticsPerformance from "../pages/AnalyticsPerformance";
import AnalyticsLeadSources from "../pages/AnalyticsLeadSources";
import AnalyticsConversion from "../pages/AnalyticsConversion";
import AnalyticsCustom from "../pages/AnalyticsCustom";
import AnalyticsExport from "../pages/AnalyticsExport";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Login */}
      <Route path="/" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
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
      {/* My Work replaces the old employee dashboard, My Tasks, Add Task and Edit Task */}
      <Route
        path="/my-work"
        element={
          <ProtectedRoute>
            <MyWork />
          </ProtectedRoute>
        }
      />
      <Route path="/employee" element={<Navigate to="/dashboard" replace />} />
      <Route path="/my-tasks" element={<Navigate to="/my-work" replace />} />
      <Route path="/add-task" element={<Navigate to="/my-work" replace />} />
      <Route path="/edit-task/:id" element={<Navigate to="/my-work" replace />} />
      {/* Managers assign and review work on the project task list */}
      <Route path="/assign-task" element={<Navigate to="/pm/tasks" replace />} />
      <Route path="/all-tasks" element={<Navigate to="/pm/tasks" replace />} />
      {/* Employees are managed in User Management */}
      <Route path="/employees" element={<Navigate to="/users" replace />} />
      <Route path="/add-employee" element={<Navigate to="/users/add" replace />} />
      <Route path="/edit-employee/:id" element={<Navigate to="/users" replace />} />
      {/* Email campaigns are managed from the inbox-style page; old sub-pages redirect */}
      <Route path="/campaigns/add" element={<Navigate to="/campaigns" replace />} />
      <Route path="/campaigns/:id" element={<Navigate to="/campaigns" replace />} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
      <Route path="/calendar/event/:id" element={<ProtectedRoute><CalendarEvent /></ProtectedRoute>} />
      {/* One dashboard for everyone; each card only appears if the person may see that data */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/finance/dashboard"
        element={
          <PermissionRoute perm="finance.view">
            <FinanceDashboard />
          </PermissionRoute>
        }
      />
      {/* Admin */}
      <Route
        path="/users"
        element={
          <PermissionRoute perm="users.view">
            <Users />
          </PermissionRoute>
        }
      />
      <Route
        path="/users/add"
        element={
          <PermissionRoute perm="users.create">
            <UserForm />
          </PermissionRoute>
        }
      />
      <Route
        path="/users/:id/edit"
        element={
          <PermissionRoute perm="users.edit">
            <UserForm />
          </PermissionRoute>
        }
      />
      <Route
        path="/users/:id"
        element={
          <PermissionRoute perm="users.view">
            <UserProfile />
          </PermissionRoute>
        }
      />
      <Route
        path="/roles"
        element={
          <PermissionRoute perm={["roles.view", "roles.manage"]}>
            <Roles />
          </PermissionRoute>
        }
      />
      <Route
        path="/crm-dashboard"
        element={
          <PermissionRoute perm="leads.view">
            <CrmDashboard />
          </PermissionRoute>
        }
      />
      <Route
        path="/crm/pipeline"
        element={
          <PermissionRoute perm="leads.view">
            <LeadPipeline />
          </PermissionRoute>
        }
      />
      <Route
        path="/crm/customers"
        element={
          <PermissionRoute perm="clients.view">
            <Customers />
          </PermissionRoute>
        }
      />
      <Route
        path="/crm/deals"
        element={
          <PermissionRoute perm="deals.view">
            <Deals />
          </PermissionRoute>
        }
      />
      <Route
        path="/crm/tasks"
        element={
          <PermissionRoute perm="crmtasks.view">
            <CrmTasks />
          </PermissionRoute>
        }
      />
      <Route
        path="/crm/follow-ups"
        element={
          <PermissionRoute perm="followups.view">
            <FollowUps />
          </PermissionRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <PermissionRoute perm="clients.view">
            <Clients />
          </PermissionRoute>
        }
      />
      <Route
        path="/campaigns"
        element={
          <ProtectedRoute>
            <Campaigns />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-client"
        element={
          <PermissionRoute perm="clients.manage">
            <AddClient />
          </PermissionRoute>
        }
      />
      <Route
        path="/edit-client/:id"
        element={
          <PermissionRoute perm="clients.manage">
            <EditClient />
          </PermissionRoute>
        }
      />
      <Route
        path="/leads"
        element={
          <PermissionRoute perm="leads.view">
            <Leads />
          </PermissionRoute>
        }
      />
      <Route
        path="/add-lead"
        element={
          <PermissionRoute perm="leads.manage">
            <AddLead />
          </PermissionRoute>
        }
      />
      <Route
        path="/edit-lead/:id"
        element={
          <PermissionRoute perm="leads.manage">
            <EditLead />
          </PermissionRoute>
        }
      />

      <Route
        path="/leads/:id"
        element={
          <PermissionRoute perm="leads.view">
            <LeadDetails />
          </PermissionRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <PermissionRoute perm="projects.view">
            <Projects />
          </PermissionRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <PermissionRoute perm="projects.view">
            <ProjectDetails />
          </PermissionRoute>
        }
      />
      <Route
        path="/pm/dashboard"
        element={
          <PermissionRoute perm={["projects.view", "projecttasks.view"]}>
            <ProjectDashboard />
          </PermissionRoute>
        }
      />
      <Route
        path="/pm/board"
        element={
          <PermissionRoute perm="projecttasks.view">
            <ProjectTaskBoard />
          </PermissionRoute>
        }
      />
      <Route
        path="/pm/tasks"
        element={
          <PermissionRoute perm="projecttasks.view">
            <ProjectTaskList />
          </PermissionRoute>
        }
      />
      <Route
        path="/pm/milestones"
        element={
          <PermissionRoute perm="milestones.view">
            <Milestones />
          </PermissionRoute>
        }
      />
      <Route
        path="/pm/time"
        element={
          <PermissionRoute perm="timelogs.view">
            <TimeTracking />
          </PermissionRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <PermissionRoute perm="reports.view">
            <Reports />
          </PermissionRoute>
        }
      />
      <Route
        path="/target-dashboard"
        element={
          <PermissionRoute perm="reports.view">
            <ReportDashboard />
          </PermissionRoute>
        }
      />
      <Route
        path="/finance/revenue"
        element={
          <PermissionRoute perm="finance.view">
            <FinanceRevenue />
          </PermissionRoute>
        }
      />
      <Route
        path="/finance/expenses"
        element={
          <PermissionRoute perm="expenses.view">
            <FinanceExpenses />
          </PermissionRoute>
        }
      />
      <Route
        path="/finance/invoices"
        element={
          <PermissionRoute perm="invoices.view">
            <FinanceInvoices />
          </PermissionRoute>
        }
      />
      <Route
        path="/finance/payments"
        element={
          <PermissionRoute perm="payments.view">
            <FinancePayments />
          </PermissionRoute>
        }
      />
      <Route
        path="/finance/subscriptions"
        element={
          <PermissionRoute perm="subscriptions.view">
            <FinanceSubscriptions />
          </PermissionRoute>
        }
      />
      <Route
        path="/finance/plans"
        element={
          <PermissionRoute perm="plans.view">
            <FinancePlans />
          </PermissionRoute>
        }
      />
      <Route
        path="/finance/tax"
        element={
          <PermissionRoute perm="tax.view">
            <FinanceTax />
          </PermissionRoute>
        }
      />
      <Route
        path="/finance/reports"
        element={
          <PermissionRoute perm="finance.view">
            <FinanceReports />
          </PermissionRoute>
        }
      />
      <Route
        path="/analytics/sales"
        element={
          <PermissionRoute perm="analytics.view">
            <AnalyticsSales />
          </PermissionRoute>
        }
      />
      <Route
        path="/analytics/revenue"
        element={
          <PermissionRoute perm="analytics.view">
            <AnalyticsRevenue />
          </PermissionRoute>
        }
      />
      <Route
        path="/analytics/users"
        element={
          <PermissionRoute perm="analytics.view">
            <AnalyticsUsers />
          </PermissionRoute>
        }
      />
      <Route
        path="/analytics/performance"
        element={
          <PermissionRoute perm="analytics.view">
            <AnalyticsPerformance />
          </PermissionRoute>
        }
      />
      <Route
        path="/analytics/lead-sources"
        element={
          <PermissionRoute perm="analytics.view">
            <AnalyticsLeadSources />
          </PermissionRoute>
        }
      />
      <Route
        path="/analytics/conversion"
        element={
          <PermissionRoute perm="analytics.view">
            <AnalyticsConversion />
          </PermissionRoute>
        }
      />
      <Route
        path="/analytics/custom"
        element={
          <PermissionRoute perm="analytics.view">
            <AnalyticsCustom />
          </PermissionRoute>
        }
      />
      <Route
        path="/analytics/export"
        element={
          <PermissionRoute perm="analytics.export">
            <AnalyticsExport />
          </PermissionRoute>
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
    </Routes>
  );
};

export default AppRoutes;
