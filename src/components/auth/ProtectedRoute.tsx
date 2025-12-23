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

  // 1. Redirecionamento para Aluno
  // Se for estudante, redireciona para o portal do aluno, a menos que já esteja lá.
  if (isStudent && window.location.pathname !== '/student-portal') {
    return <Navigate to="/student-portal" replace />;
  }
  
  // 2. Redirecionamento para Professor
  // Se for professor, redireciona para o painel do professor, a menos que já esteja lá.
  if (isTeacher && window.location.pathname !== '/teacher/dashboard') {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  // Se for Admin, Secretary, ou Super Admin, renderiza as rotas filhas (que usam AppLayout)
  // Ou se for professor e já estiver no dashboard do professor, ou se for estudante e já estiver no portal do estudante.
  return <Outlet />;
};

export default ProtectedRoute;