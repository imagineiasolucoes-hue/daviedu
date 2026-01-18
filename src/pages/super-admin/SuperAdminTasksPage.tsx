import React from "react";
import { useProfile } from "@/hooks/useProfile";
import { Loader2, ClipboardList } from "lucide-react";
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-primary" />
            Gestor de Atualizações
          </h1>
          <p className="text-sm text-muted-foreground">
            Registre ideias de atualizações, mantenha um histórico e agende próximas ações do sistema.
          </p>
        </div>
      </div>

      <TaskManager />
    </div>
  );
};

export default SuperAdminTasksPage;