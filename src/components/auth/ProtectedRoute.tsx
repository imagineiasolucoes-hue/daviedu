import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './SessionContextProvider';
import { useProfile } from '@/hooks/useProfile'; // Importando useProfile
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { profile, isLoading: isProfileLoading, isTeacher, isSuperAdmin, isStudent } = useProfile(); // Usando isStudent

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
  
  // 2. Redirecionamento baseado na Role (Admin/Teacher)
  // Se for professor e não for Super Admin, redireciona para o dashboard de professor.
  if (isTeacher && !isSuperAdmin && window.location.pathname === '/dashboard') {
    return <Navigate to="/teacher/dashboard" replace />;
  }
  
  // 3. Bloqueio de Acesso para Aluno ao AppLayout
  // Se for estudante, mas a rota atual for uma rota do AppLayout (como /dashboard, /students, etc.),
  // e ele não foi pego pelo redirecionamento acima (o que não deve acontecer se o redirecionamento funcionar),
  // garantimos que ele não veja o AppLayout.
  // No entanto, como a rota /student-portal está fora do AppLayout no App.tsx,
  // o Outlet aqui só deve renderizar para não-alunos.

  // Se for aluno, e a rota atual for /student-portal, ele continua.
  if (isStudent) {
    return <Outlet />; // Permite que o Outlet renderize o StudentPage
  }

  // Se for Admin, Secretary, Teacher ou Super Admin, renderiza as rotas filhas (que usam AppLayout)
  return <Outlet />;
};

export default ProtectedRoute;