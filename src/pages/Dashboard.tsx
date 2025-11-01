import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { Loader2, Users, UserPlus, GraduationCap, User, Briefcase, DollarSign, Clock, ArrowDownCircle, Share2, School, LayoutDashboard } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import SecretaryDashboardSection from '@/components/dashboard/SecretaryDashboardSection';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import SchoolEvolutionIndicator from '@/components/dashboard/SchoolEvolutionIndicator';
import MonthlyEnrollmentChart from '@/components/dashboard/MonthlyEnrollmentChart'; // NOVO IMPORT

const MetricCardSkeleton: React.FC = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-7 w-32" />
    </CardContent>
  </Card>
);

interface SuperAdminMetrics {
  totalTenants: number;
  totalUsers: number;
}

interface MonthlyEnrollmentData {
  name: string;
  'Novas Matrículas': number;
}

const fetchSuperAdminMetrics = async (): Promise<SuperAdminMetrics> => {
  const { data, error } = await supabase.functions.invoke('get-super-admin-metrics');
  if (error) throw new Error(error.message);
  // @ts-ignore
  if (data.error) throw new Error(data.error);
  return data as SuperAdminMetrics;
};

const fetchMonthlyEnrollments = async (tenantId: string): Promise<MonthlyEnrollmentData[]> => {
  const { data, error } = await supabase.functions.invoke('get-monthly-enrollments', {
    body: JSON.stringify({ tenant_id: tenantId }),
  });
  if (error) throw new Error(error.message);
  // @ts-ignore
  if (data.error) throw new Error(data.error);
  return data as MonthlyEnrollmentData[];
};

const Dashboard: React.FC = () => {
  const { profile, isLoading: isProfileLoading, isSuperAdmin, isSchoolUser } = useProfile();
  const tenantId = profile?.tenant_id;

  const fetchDashboardMetrics = async (tenantId: string) => {
    const { data, error } = await supabase.functions.invoke('get-dashboard-metrics', {
      body: JSON.stringify({ tenant_id: tenantId }),
    });
    if (error) throw new Error(error.message);
    // @ts-ignore
    if (data.error) throw new Error(data.error);
    return data;
  };

  const { data: metrics, isLoading: areMetricsLoading } = useQuery({
    queryKey: ['dashboardMetrics', tenantId],
    queryFn: () => fetchDashboardMetrics(tenantId!),
    enabled: !!tenantId && !isSuperAdmin, // Only fetch for school users
  });

  const { data: superAdminMetrics, isLoading: areSuperAdminMetricsLoading } = useQuery<SuperAdminMetrics, Error>({
    queryKey: ['superAdminMetrics'],
    queryFn: fetchSuperAdminMetrics,
    enabled: isSuperAdmin, // Only fetch for Super Admin
  });

  const { data: monthlyEnrollments, isLoading: areMonthlyEnrollmentsLoading } = useQuery<MonthlyEnrollmentData[], Error>({
    queryKey: ['monthlyEnrollments', tenantId],
    queryFn: () => fetchMonthlyEnrollments(tenantId!),
    enabled: !!tenantId && !isSuperAdmin, // Only fetch for school users
  });

  const handleCopyLink = () => {
    if (!profile?.tenant_id) return;
    const link = `${window.location.origin}/pre-matricula/${profile.tenant_id}`;
    navigator.clipboard.writeText(link);
    toast.success("Link Copiado!", {
      description: "O link de pré-matrícula foi copiado para a área de transferência.",
    });
  };

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isSuperAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          Dashboard Super Administrador
        </h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {areSuperAdminMetricsLoading ? Array.from({ length: 2 }).map((_, i) => <MetricCardSkeleton key={i} />) : (
            <>
              <MetricCard 
                title="Total de Escolas" 
                value={superAdminMetrics?.totalTenants ?? 0} 
                icon={School} 
                iconColor="text-primary" 
              />
              <MetricCard 
                title="Total de Usuários" 
                value={superAdminMetrics?.totalUsers ?? 0} 
                icon={Users} 
                iconColor="text-indigo-500" 
              />
            </>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Visão Geral do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Use o menu lateral para navegar para a Gestão de Escolas, Usuários e Métricas Kiwify.
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleCopyLink}>
            <Share2 className="mr-2 h-4 w-4" />
            Copiar Link de Pré-Matrícula
          </Button>
          <Button asChild>
            <Link to="/students">
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Aluno
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {areMetricsLoading ? Array.from({ length: 8 }).map((_, i) => <MetricCardSkeleton key={i} />) : (
          <>
            <MetricCard title="Alunos Ativos" value={metrics?.activeStudents ?? 0} icon={Users} iconColor="text-primary" />
            <MetricCard title="Pré-Matriculados" value={metrics?.preEnrolledStudents ?? 0} icon={UserPlus} iconColor="text-yellow-500" />
            <MetricCard title="Turmas Ativas" value={metrics?.activeClasses ?? 0} icon={GraduationCap} iconColor="text-green-500" />
            <MetricCard title="Professores Ativos" value={metrics?.activeTeachers ?? 0} icon={User} iconColor="text-indigo-500" />
            <MetricCard title="Funcionários Ativos" value={metrics?.activeEmployees ?? 0} icon={Briefcase} iconColor="text-primary" />
            <MetricCard title="Receita Paga (Mês)" value={formatCurrency(metrics?.paidRevenueMonth)} icon={DollarSign} iconColor="text-green-600" />
            <MetricCard title="Receita Pendente (Mês)" value={formatCurrency(metrics?.pendingRevenueMonth)} icon={Clock} iconColor="text-yellow-600" />
            <MetricCard title="Despesa Paga (Mês)" value={formatCurrency(metrics?.paidExpenseMonth)} icon={ArrowDownCircle} iconColor="text-red-600" />
          </>
        )}
      </div>

      <SecretaryDashboardSection />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {areMonthlyEnrollmentsLoading ? (
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Novas Matrículas (Últimos 6 Meses)</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : (
            <MonthlyEnrollmentChart data={monthlyEnrollments || []} />
          )}
        </div>
        <RecentActivity />
      </div>

      {/* Novo Indicador de Evolução da Escola */}
      <SchoolEvolutionIndicator />
    </div>
  );
};

export default Dashboard;