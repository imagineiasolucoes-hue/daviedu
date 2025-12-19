import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './SessionContextProvider';
import { useProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { profile, isLoading: isProfileLoading, isStudent } = useProfile(); // isTeacher and isSuperAdmin are no longer needed for redirection logic here

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

  // 1. Redirecionamento para Aluno
  // Se for estudante, redireciona para o portal do aluno, a menos que já esteja lá.
  if (isStudent && window.location.pathname !== '/student-portal') {
    return <Navigate to="/student-portal" replace />;
  }
  
  // Se for Admin, Secretary, Teacher ou Super Admin, renderiza as rotas filhas (que usam AppLayout)
  return <Outlet />;
};

export default ProtectedRoute;