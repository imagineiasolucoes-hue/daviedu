import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Secretaria from "./pages/Secretaria";
import Pedagogico from "./pages/Pedagogico";
import Comunicacao from "./pages/Comunicacao";
import Settings from "./pages/Settings";
import { SessionContextProvider } from "@/components/auth/SessionContextProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import LandingPage from "./pages/LandingPage";
import FinancialLayout from "@/components/layout/FinancialLayout";
import FinancialDashboard from "@/pages/financial/Dashboard";
import Revenues from "@/pages/financial/Revenues";
import Expenses from "@/pages/financial/Expenses";
import Payroll from "@/pages/financial/Payroll";
import PreEnrollment from "./pages/PreEnrollment";
import { TenantProvider } from "./hooks/useTenant";
// import SuperAdmin from "./pages/SuperAdmin"; // Removido
// import SuperAdminRoute from "./components/auth/SuperAdminRoute"; // Removido
// import { useEffect } from "react"; // Removido, pois o useEffect de teste será removido
// import { supabase } from "@/integrations/supabase/client"; // Removido, pois o useEffect de teste será removido

const queryClient = new QueryClient();

const App = () => {
  // O useEffect de teste de conexão Supabase foi removido conforme solicitado.
  // useEffect(() => {
  //   const testSupabaseConnection = async () => {
  //     console.log("Attempting Supabase connection test...");
  //     try {
  //       const { data, error } = await supabase.from('tenants').select('id').limit(1);
  //       if (error) {
  //         console.error("Supabase connection test failed:", error.message);
  //       } else {
  //         console.log("Supabase connection test successful. Data:", data);
  //       }
  //     } catch (e: any) {
  //       console.error("Supabase connection test threw an exception:", e.message);
  //     }
  //   };
  //   testSupabaseConnection();
  // }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SessionContextProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/pre-matricula" element={<PreEnrollment />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route
                  element={
                    <TenantProvider>
                      <AppLayout />
                    </TenantProvider>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/secretaria" element={<Secretaria />} />

                  <Route path="/financeiro" element={<FinancialLayout />}>
                    <Route index element={<Navigate to="/financeiro/dashboard" replace />} />
                    <Route path="dashboard" element={<FinancialDashboard />} />
                    <Route path="receitas" element={<Revenues />} />
                    <Route path="despesas" element={<Expenses />} />
                    <Route path="folha-de-pagamento" element={<Payroll />} />
                  </Route>

                  <Route path="/pedagogico" element={<Pedagogico />} />
                  <Route path="/comunicacao" element={<Comunicacao />} />
                  <Route path="/settings" element={<Settings />} />
                  
                  {/* Super Admin Route - Removido */}
                  {/* <Route element={<SuperAdminRoute />}>
                    <Route path="/super-admin" element={<SuperAdmin />} />
                  </Route> */}
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;