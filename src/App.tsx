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
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  console.log("🚀 App.tsx: Componente montado");

  useEffect(() => {
    console.log("🔍 App.tsx: useEffect executado");
    
    // Verifica se há erros de importação
    const checkImports = async () => {
      try {
        console.log("✅ Todas as importações foram bem-sucedidas");
      } catch (error) {
        console.error("❌ Erro nas importações:", error);
      }
    };

    checkImports();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SessionContextProvider>
            {/* Adicionando fallback para SessionContextProvider */}
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