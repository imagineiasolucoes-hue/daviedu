import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './SessionContextProvider';
import { useProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';

const TeacherProtectedRoute: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { profile, isLoading: isProfileLoading, isTeacher } = useProfile();

  if (isAuthLoading || isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isTeacher) {
    // Se não estiver autenticado ou não for Professor, redireciona para o dashboard normal.
    // O ProtectedRoute pai já lida com usuários não logados.
    return <Navigate to="/dashboard" replace />;
  }

  // Usuário é Professor, renderiza as rotas filhas
  return <Outlet />;
};

export default TeacherProtectedRoute;