import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './SessionContextProvider';
import { useProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';

const TeacherProtectedRoute: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { profile, isLoading: isProfileLoading, isTeacher, isAdmin } = useProfile(); // Adicionado isAdmin

  if (isAuthLoading || isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Permite acesso se o usuário estiver autenticado E for Professor OU Administrador
  if (!user || (!isTeacher && !isAdmin)) {
    // Se não estiver autenticado ou não for Professor/Admin, redireciona para o dashboard normal.
    return <Navigate to="/dashboard" replace />;
  }

  // Usuário é Professor ou Administrador, renderiza as rotas filhas
  return <Outlet />;
};

export default TeacherProtectedRoute;