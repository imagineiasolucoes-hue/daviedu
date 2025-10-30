import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { profile, isLoading, isSuperAdmin, isAdmin } = useProfile();

  if (isLoading) {
    // Embora o AppLayout já trate o loading, mantemos aqui como fallback
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isSuperAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard Super Administrador</h1>
        <Card>
          <CardHeader>
            <CardTitle>Visão Geral do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Use o menu lateral para navegar para a Gestão de Escolas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard para Admin de Escola (ou outros perfis)
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard da Escola</h1>
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo(a) à sua Escola!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Seu Tenant ID: {profile?.tenant_id || 'N/A'}
          </p>
          <p className="mt-2">
            Comece a gerenciar alunos, classes e finanças usando o menu lateral.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;