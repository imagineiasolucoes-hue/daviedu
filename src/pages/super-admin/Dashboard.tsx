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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder for KPI Cards */}
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold">Total de Escolas</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold">Novas Escolas (Mês)</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold">MRR</h3>
          <p className="text-2xl font-bold">R$ 0,00</p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold">Alunos Totais</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>
      <div className="p-4 border rounded-lg bg-card">
        <h3 className="font-semibold">Gráfico de Crescimento de Escolas</h3>
        <p className="text-muted-foreground">Dados de crescimento de escolas ao longo do tempo.</p>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;