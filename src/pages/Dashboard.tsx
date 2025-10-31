import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { Loader2, Users, UserPlus, GraduationCap, User, Briefcase, DollarSign, Clock, ArrowDownCircle, Share2 } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import SecretaryDashboardSection from '@/components/dashboard/SecretaryDashboardSection';

// Componente Placeholder para o Gráfico
const EnrollmentChartPlaceholder: React.FC = () => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="text-xl font-semibold">Novas Matrículas (Últimos 6 Meses)</CardTitle>
    </CardHeader>
    <CardContent className="h-[400px] flex items-center justify-center">
      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-end p-4">
        {/* Mock Bar Chart */}
        <div className="flex w-full h-full items-end justify-around">
          <div className="w-8 bg-gray-300 dark:bg-gray-600 h-1/4 rounded-t-sm" />
          <div className="w-8 bg-gray-300 dark:bg-gray-600 h-1/6 rounded-t-sm" />
          <div className="w-8 bg-gray-300 dark:bg-gray-600 h-1/12 rounded-t-sm" />
          <div className="w-8 bg-gray-300 dark:bg-gray-600 h-1/3 rounded-t-sm" />
          <div className="w-8 bg-gray-300 dark:bg-gray-600 h-1/5 rounded-t-sm" />
          <div className="w-8 bg-primary h-3/4 rounded-t-sm" />
        </div>
      </div>
    </CardContent>
  </Card>
);


const Dashboard: React.FC = () => {
  const { profile, isLoading, isSuperAdmin, isSchoolUser } = useProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
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
  
  if (!isSchoolUser) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Bem-vindo(a)!</h1>
        <Card>
          <CardHeader>
            <CardTitle>Aguardando Ativação da Escola</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Seu perfil está ativo, mas ainda não está associado a uma escola (Tenant). 
              Se você acabou de se cadastrar, aguarde a confirmação.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard para Admin de Escola
  return (
    <div className="space-y-6">
      {/* Header com Título e Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" asChild>
            <Link to="/pre-matricula">
              <Share2 className="mr-2 h-4 w-4" />
              Link Pré-Matrícula
            </Link>
          </Button>
          <Button asChild>
            <Link to="/students">
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Aluno
            </Link>
          </Button>
        </div>
      </div>

      {/* Linha 1: Métricas de Pessoas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Alunos Ativos" 
          value="22" 
          icon={Users} 
          iconColor="text-primary"
        />
        <MetricCard 
          title="Pré-Matriculados" 
          value="2" 
          icon={UserPlus} 
          iconColor="text-yellow-500"
        />
        <MetricCard 
          title="Turmas Ativas" 
          value="9" 
          icon={GraduationCap} 
          iconColor="text-green-500"
        />
        <MetricCard 
          title="Professores Ativos" 
          value="3" 
          icon={User} 
          iconColor="text-indigo-500"
        />
      </div>

      {/* Linha 2: Métricas Financeiras */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Funcionários Ativos" 
          value="6" 
          icon={Briefcase} 
          iconColor="text-primary"
        />
        <MetricCard 
          title="Receita Paga (Mês)" 
          value="R$ 11.150,00" 
          icon={DollarSign} 
          iconColor="text-green-600"
        />
        <MetricCard 
          title="Receita Pendente (Mês)" 
          value="R$ 430,00" 
          icon={Clock} 
          iconColor="text-yellow-600"
        />
        <MetricCard 
          title="Despesa Paga (Mês)" 
          value="R$ 7.200,00" 
          icon={ArrowDownCircle} 
          iconColor="text-red-600"
        />
      </div>

      {/* Nova Seção: Secretaria */}
      <SecretaryDashboardSection />

      {/* Linha 3: Gráfico e Atividades Recentes */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EnrollmentChartPlaceholder />
        </div>
        <RecentActivity />
      </div>
    </div>
  );
};

export default Dashboard;