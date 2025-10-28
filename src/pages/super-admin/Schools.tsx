import React from 'react';
import usePageTitle from '@/hooks/usePageTitle';

const SuperAdminSchools = () => {
  usePageTitle("Super Admin - Escolas");
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Gestão de Escolas</h1>
      <p className="text-muted-foreground">
        Visualize e gerencie todas as escolas cadastradas no sistema.
      </p>
      <div className="p-4 border rounded-lg bg-card">
        <h3 className="font-semibold">Tabela de Escolas</h3>
        <p className="text-muted-foreground">Aqui será exibida uma tabela com todas as escolas, seus status e opções de gerenciamento.</p>
      </div>
    </div>
  );
};

export default SuperAdminSchools;