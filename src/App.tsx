import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PreEnrollment from "./pages/PreEnrollment";
import PreEnrollmentInfoPage from "./pages/PreEnrollmentInfoPage";
import { SessionContextProvider } from "./components/auth/SessionContextProvider";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SuperAdminProtectedRoute from "./components/auth/SuperAdminProtectedRoute"; // NOVO IMPORT
import Dashboard from "./pages/Dashboard";
import AppLayout from "./components/layout/AppLayout";
import TenantsPage from "./pages/super-admin/TenantsPage";
import UsersPage from "./pages/super-admin/UsersPage";
import KiwifyPage from "./pages/super-admin/KiwifyPage";
import StudentsPage from "./pages/StudentsPage";
import ClassesPage from "./pages/ClassesPage";
import FinancePage from "./pages/FinancePage";
import RevenuesPage from "./pages/RevenuesPage";
import ExpensesPage from "./pages/ExpensesPage";
import SettingsPage from "./pages/SettingsPage";
import CalendarPage from "./pages/CalendarPage";
import DocumentsPage from "./pages/DocumentsPage";
import TeachersPage from "./pages/TeachersPage";
import CoursesPage from "./pages/CoursesPage";
import BackupDashboard from "./pages/BackupDashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <SessionContextProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/pre-matricula" element={<PreEnrollmentInfoPage />} />
              <Route path="/pre-matricula/:tenantId" element={<PreEnrollment />} />

              {/* Protected Routes using AppLayout */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/students" element={<StudentsPage />} />
                  <Route path="/teachers" element={<TeachersPage />} />
                  <Route path="/classes" element={<ClassesPage />} />
                  <Route path="/classes/courses" element={<CoursesPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/documents" element={<DocumentsPage />} />
                  <Route path="/finance" element={<FinancePage />} />
                  <Route path="/revenues" element={<RevenuesPage />} />
                  <Route path="/expenses" element={<ExpensesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  
                  {/* Super Admin Routes */}
                  <Route element={<SuperAdminProtectedRoute />}>
                    <Route path="/backup" element={<BackupDashboard />} /> {/* MOVIDO PARA CÁ */}
                    <Route path="/super-admin/tenants" element={<TenantsPage />} />
                    <Route path="/super-admin/users" element={<UsersPage />} />
                    <Route path="/super-admin/kiwify" element={<KiwifyPage />} />
                  </Route>
                  
                  {/* Add other protected routes here later */}
                </Route>
              </Route>

              {/* Fallback Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;