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
import SuperAdminProtectedRoute from "./components/auth/SuperAdminProtectedRoute";
import TeacherProtectedRoute from "./components/auth/TeacherProtectedRoute";
import Dashboard from "./pages/Dashboard";
import AppLayout from "./components/layout/AppLayout";
import DocumentLayout from "./components/layout/DocumentLayout";
import TenantsPage from "./pages/super-admin/TenantsPage";
import UsersPage from "./pages/super-admin/UsersPage";
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
import SubjectsPage from "./pages/SubjectsPage";
import BackupDashboard from "./pages/BackupDashboard";
import FAQPage from "./pages/FAQPage";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import GradeEntryPage from "./pages/teacher/GradeEntryPage";
import ClassDiaryPage from "./pages/teacher/ClassDiaryPage";
import ReportCard from "./components/documents/templates/ReportCard";
import StudentTranscript from "./components/documents/templates/StudentTranscript";
import MonthlyFeeCollection from "./components/documents/templates/MonthlyFeeCollection";
import SecretariaPage from "./pages/SecretariaPage";
import VerifyDocumentPage from "./pages/VerifyDocumentPage";
import StudentPage from "./pages/StudentPage"; // NOVO IMPORT

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
        <BrowserRouter 
          future={{ 
            v7_startTransition: true, 
            v7_relativeSplatPath: true 
          }}
        >
          <SessionContextProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/pre-matricula" element={<PreEnrollmentInfoPage />} />
              <Route path="/pre-matricula/:tenantId" element={<PreEnrollment />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/verify-document/:token" element={<VerifyDocumentPage />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                
                {/* Student Portal Route (No AppLayout) */}
                <Route path="/student-portal" element={<StudentPage />} />

                {/* AppLayout Routes (Admin, Secretary, Teacher, SuperAdmin) */}
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/secretaria" element={<SecretariaPage />} />
                  <Route path="/students" element={<StudentsPage />} />
                  <Route path="/teachers" element={<TeachersPage />} />
                  <Route path="/classes" element={<ClassesPage />} /> 
                  <Route path="/classes/courses" element={<CoursesPage />} /> 
                  <Route path="/classes/subjects" element={<SubjectsPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/documents" element={<DocumentsPage />} />
                  <Route path="/finance" element={<FinancePage />} />
                  <Route path="/revenues" element={<RevenuesPage />} />
                  <Route path="/expenses" element={<ExpensesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  
                  {/* Super Admin Routes */}
                  <Route element={<SuperAdminProtectedRoute />}>
                    <Route path="/backup" element={<BackupDashboard />} />
                    <Route path="/super-admin/tenants" element={<TenantsPage />} />
                    <Route path="/super-admin/users" element={<UsersPage />} />
                  </Route>

                  {/* Teacher Routes */}
                  <Route element={<TeacherProtectedRoute />}>
                    <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                    <Route path="/teacher/grade-entry" element={<GradeEntryPage />} />
                    <Route path="/teacher/class-diary" element={<ClassDiaryPage />} />
                  </Route>
                </Route>

                {/* Document Generation Routes (using DocumentLayout for print-friendly view) */}
                <Route element={<DocumentLayout />}>
                  <Route path="/documents/generate/transcript/:entityId" element={<StudentTranscript />} />
                  <Route path="/documents/generate/report_card/:entityId" element={<ReportCard />} />
                  <Route path="/documents/generate/monthly_fee_collection/:entityId" element={<MonthlyFeeCollection />} />
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