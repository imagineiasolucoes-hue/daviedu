import React from 'react';
import usePageTitle from '@/hooks/usePageTitle';

const SuperAdminDashboard = () => {
  usePageTitle("Super Admin Dashboard");
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard do Super Admin</h1>
      <p className="text-muted-foreground">
        Visão geral e métricas de todas as escolas e do SaaS.
      </p>
      {/* Conteúdo será adicionado aqui, parte por parte */}
    </div>
  );
};

export default SuperAdminDashboard;