import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './SessionContextProvider';
import { useProfile } from '@/hooks/useProfile'; // Importando useProfile
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { profile, isLoading: isProfileLoading, isTeacher, isSuperAdmin } = useProfile(); // Usando useProfile

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

  // Redirecionamento baseado na role, se estiver na rota raiz protegida (/dashboard)
  // Se for professor e não for Super Admin, redireciona para o dashboard de professor.
  if (isTeacher && !isSuperAdmin && window.location.pathname === '/dashboard') {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  // User is authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;