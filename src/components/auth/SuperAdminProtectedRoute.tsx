import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './SessionContextProvider';
import { useProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';

const SuperAdminProtectedRoute: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { profile, isLoading: isProfileLoading, isSuperAdmin } = useProfile();

  if (isAuthLoading || isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    // Se não estiver autenticado ou não for Super Admin, redireciona para o dashboard
    // ou para a página de login, dependendo da preferência.
    // Aqui, redirecionamos para o dashboard para usuários logados que não são Super Admin.
    // Para usuários não logados, o ProtectedRoute pai já os redirecionaria para o login.
    return <Navigate to="/dashboard" replace />;
  }

  // Usuário é Super Admin, renderiza as rotas filhas
  return <Outlet />;
};

export default SuperAdminProtectedRoute;