import React from "react";
import { useProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import TaskManager from "@/components/super-admin/TaskManager";

const SuperAdminTasksPage: React.FC = () => {
  const { isSuperAdmin, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">Gestor de Atualizações (Super Admin)</h1>
      <p className="text-muted-foreground">Registre ideias de atualizações, mantenha um histórico e agende próximas ações do sistema.</p>

      <TaskManager />
    </div>
  );
};

export default SuperAdminTasksPage;