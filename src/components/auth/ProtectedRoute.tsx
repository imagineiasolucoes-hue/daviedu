import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './SessionContextProvider';
import { useProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { profile, isLoading: isProfileLoading, isStudent, isTeacher } = useProfile(); // Adicionado isTeacher

  const isLoading = isAuthLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // User is not authenticated, redirect them to the login page
    return <Navigate to="/login" replace />;
  }
  
  // Se o usuário estiver autenticado, mas o perfil ainda não foi carregado (caso raro, mas seguro)
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only perform role-based automatic redirects when the user is at a generic entry path.
  // This prevents forcing navigation away when users click internal links (e.g., /grades/entry).
  const path = window.location.pathname;
  const isGenericEntryPath = path === '/' || path === '/dashboard' || path === '/login';

  // 1. Redirecionamento para Aluno (only from generic entry paths)
  if (isStudent && isGenericEntryPath) {
    return <Navigate to="/student-portal" replace />;
  }
  
  // 2. Redirecionamento para Professor (only from generic entry paths)
  if (isTeacher && isGenericEntryPath) {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  // Se for Admin, Secretary, ou Super Admin, renderiza as rotas filhas (que usam AppLayout)
  // Ou se for professor e já estiver no dashboard do professor, ou se for estudante e já estiver no portal do estudante.
  return <Outlet />;
};

export default ProtectedRoute;