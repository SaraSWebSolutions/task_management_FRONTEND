import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import AppSkeleton from "../components/PageSkeleton";

import ProtectedRoute from "../components/ProtectedRoute";
import PermissionRoute from "../components/PermissionRoute";

import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
const Profile = lazy(() => import("../pages/Profile"));
const MyWork = lazy(() => import("../pages/MyWork"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const FinanceDashboard = lazy(() => import("../pages/FinanceDashboard"));
const Notifications = lazy(() => import("../pages/Notifications"));
const Calendar = lazy(() => import("../pages/Calendar"));
const CalendarEvent = lazy(() => import("../pages/CalendarEvent"));


const TaskDetails = lazy(() => import("../pages/TaskDetails"));

const Clients = lazy(() => import("../pages/Clients"));
const AddClient = lazy(() => import("../pages/AddClient"));
const EditClient = lazy(() => import("../pages/EditClient"));
const Campaigns = lazy(() => import("../pages/Campaigns"));

const Leads = lazy(() => import("../pages/Leads"));
const AddLead = lazy(() => import("../pages/AddLead"));
const EditLead = lazy(() => import("../pages/EditLead"));

const LeadDetails = lazy(() => import("../pages/LeadDetails"));
const Quotations = lazy(() => import("../pages/Quotations"));
const QuotationForm = lazy(() => import("../pages/QuotationForm"));
const Projects = lazy(() => import("../pages/Projects"));
const Products = lazy(() => import("../pages/Products"));
const ProductForm = lazy(() => import("../pages/ProductForm"));
const ProductDetails = lazy(() => import("../pages/ProductDetails"));
const Categories = lazy(() => import("../pages/Categories"));
const ProjectDashboard = lazy(() => import("../pages/ProjectDashboard"));
const ProjectTaskBoard = lazy(() => import("../pages/ProjectTaskBoard"));
const ProjectTaskList = lazy(() => import("../pages/ProjectTaskList"));
const TimeTracking = lazy(() => import("../pages/TimeTracking"));
const Reports = lazy(() => import("../pages/Reports"));
const ReportDashboard = lazy(() => import("../pages/ReportDashboard"));
const Users = lazy(() => import("../pages/Users"));
const UserForm = lazy(() => import("../pages/UserForm"));
const UserProfile = lazy(() => import("../pages/UserProfile"));
const Roles = lazy(() => import("../pages/Roles"));
const CrmDashboard = lazy(() => import("../pages/CrmDashboard"));
const LeadPipeline = lazy(() => import("../pages/LeadPipeline"));
const Customers = lazy(() => import("../pages/Customers"));
const FollowUps = lazy(() => import("../pages/FollowUps"));
const FinanceRevenue = lazy(() => import("../pages/FinanceRevenue"));
const FinanceExpenses = lazy(() => import("../pages/FinanceExpenses"));
const FinanceInvoices = lazy(() => import("../pages/FinanceInvoices"));
const InvoiceForm = lazy(() => import("../pages/InvoiceForm"));
const FinancePayments = lazy(() => import("../pages/FinancePayments"));
const FinanceSubscriptions = lazy(() => import("../pages/FinanceSubscriptions"));
const FinancePlans = lazy(() => import("../pages/FinancePlans"));
const FinanceTax = lazy(() => import("../pages/FinanceTax"));
const FinanceReports = lazy(() => import("../pages/FinanceReports"));
const AnalyticsSales = lazy(() => import("../pages/AnalyticsSales"));
const AnalyticsRevenue = lazy(() => import("../pages/AnalyticsRevenue"));
const AnalyticsUsers = lazy(() => import("../pages/AnalyticsUsers"));
const AnalyticsPerformance = lazy(() => import("../pages/AnalyticsPerformance"));
const AnalyticsLeadSources = lazy(() => import("../pages/AnalyticsLeadSources"));
const AnalyticsConversion = lazy(() => import("../pages/AnalyticsConversion"));
const AnalyticsCustom = lazy(() => import("../pages/AnalyticsCustom"));
const AnalyticsExport = lazy(() => import("../pages/AnalyticsExport"));

// The old project overview page is gone: opening a project opens its edit drawer
const ProjectRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/projects?edit=${id}`} replace />;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<AppSkeleton />}>
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
          <PermissionRoute perm="mywork.view">
            <MyWork />
          </PermissionRoute>
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
      <Route path="/calendar" element={<PermissionRoute perm="calendar.view"><Calendar /></PermissionRoute>} />
      <Route path="/calendar/event/:id" element={<PermissionRoute perm="calendar.view"><CalendarEvent /></PermissionRoute>} />
      {/* One dashboard for everyone; each card only appears if the person may see that data */}
      <Route path="/dashboard" element={<PermissionRoute perm="dashboard.view"><Dashboard /></PermissionRoute>} />
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
      {/* Deals and CRM Tasks are removed from CRM */}
      <Route path="/crm/deals" element={<Navigate to="/leads" replace />} />
      <Route path="/crm/tasks" element={<Navigate to="/leads" replace />} />
      <Route
        path="/crm/follow-ups"
        element={
          <PermissionRoute perm="followups.view">
            <FollowUps />
          </PermissionRoute>
        }
      />
      <Route
        path="/add-customer"
        element={
          <PermissionRoute perm="clients.manage">
            <Customers />
          </PermissionRoute>
        }
      />
      <Route
        path="/edit-customer/:id"
        element={
          <PermissionRoute perm="clients.manage">
            <Customers />
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
          <PermissionRoute perm="campaigns.view">
            <Campaigns />
          </PermissionRoute>
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
        path="/products"
        element={
          <PermissionRoute perm="products.view">
            <Products />
          </PermissionRoute>
        }
      />
      <Route
        path="/products/add"
        element={
          <PermissionRoute perm="products.manage">
            <ProductForm />
          </PermissionRoute>
        }
      />
      <Route
        path="/products/:id/edit"
        element={
          <PermissionRoute perm="products.manage">
            <ProductForm />
          </PermissionRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <PermissionRoute perm="products.view">
            <ProductDetails />
          </PermissionRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <PermissionRoute perm="categories.view">
            <Categories />
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
            <ProjectRedirect />
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
      {/* Milestones are hidden for now */}
      <Route path="/pm/milestones" element={<Navigate to="/projects" replace />} />
      <Route
        path="/pm/time"
        element={
          <PermissionRoute perm="timelogs.view">
            <TimeTracking />
          </PermissionRoute>
        }
      />
      <Route
        path="/quotations"
        element={
          <PermissionRoute perm="leads.view">
            <Quotations />
          </PermissionRoute>
        }
      />
      <Route
        path="/quotations/new"
        element={
          <PermissionRoute perm="leads.manage">
            <QuotationForm />
          </PermissionRoute>
        }
      />
      <Route
        path="/quotations/:id"
        element={
          <PermissionRoute perm="leads.view">
            <QuotationForm />
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
        path="/finance/invoices/new"
        element={
          <PermissionRoute perm="invoices.manage">
            <InvoiceForm />
          </PermissionRoute>
        }
      />
      <Route
        path="/finance/invoices/:id/edit"
        element={
          <PermissionRoute perm="invoices.manage">
            <InvoiceForm />
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
          <PermissionRoute perm="analytics.view" also={["finance.view", "invoices.view"]}>
            <AnalyticsSales />
          </PermissionRoute>
        }
      />
      <Route
        path="/analytics/revenue"
        element={
          <PermissionRoute perm="analytics.view" also="finance.view">
            <AnalyticsRevenue />
          </PermissionRoute>
        }
      />
      <Route
        path="/analytics/users"
        element={
          <PermissionRoute perm="analytics.view" also={["users.view", "employees.view"]}>
            <AnalyticsUsers />
          </PermissionRoute>
        }
      />
      <Route
        path="/analytics/performance"
        element={
          <PermissionRoute perm="analytics.view" also={["projecttasks.view", "projects.view"]}>
            <AnalyticsPerformance />
          </PermissionRoute>
        }
      />
      <Route
        path="/analytics/lead-sources"
        element={
          <PermissionRoute perm="analytics.view" also="leads.view">
            <AnalyticsLeadSources />
          </PermissionRoute>
        }
      />
      <Route
        path="/analytics/conversion"
        element={
          <PermissionRoute perm="analytics.view" also={["leads.view", "deals.view"]}>
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
          <PermissionRoute perm="analytics.export" also="analytics.view">
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
    </Suspense>
  );
};

export default AppRoutes;
