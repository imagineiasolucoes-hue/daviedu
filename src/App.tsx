import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PreEnrollment from "./pages/PreEnrollment";
import { SessionContextProvider } from "./components/auth/SessionContextProvider";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import AppLayout from "./components/layout/AppLayout";
import TenantsPage from "./pages/super-admin/TenantsPage";
import StudentsPage from "./pages/StudentsPage";
import ClassesPage from "./pages/ClassesPage";
import FinancePage from "./pages/FinancePage";
import RevenuesPage from "./pages/RevenuesPage";
import ExpensesPage from "./pages/ExpensesPage";
import SettingsPage from "./pages/SettingsPage";
import CalendarPage from "./pages/CalendarPage";
import DocumentsPage from "./pages/DocumentsPage";

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
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SessionContextProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/pre-matricula" element={<PreEnrollment />} />

              {/* Protected Routes using AppLayout */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/students" element={<StudentsPage />} />
                  <Route path="/classes" element={<ClassesPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/documents" element={<DocumentsPage />} />
                  <Route path="/finance" element={<FinancePage />} />
                  <Route path="/revenues" element={<RevenuesPage />} />
                  <Route path="/expenses" element={<ExpensesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  
                  {/* Super Admin Routes */}
                  <Route path="/super-admin/tenants" element={<TenantsPage />} />
                  
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