import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Link, Navigate } from 'react-router-dom';
import { Loader2, School, Users, HardDrive, LayoutDashboard, AlertTriangle, Cloud, UserCheck, BookOpen, User, Clock, TrendingUp, TimerReset, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MetricCard from '@/components/dashboard/MetricCard';
import { Skeleton } from '@/components/ui/skeleton';
import GlobalBackupStatusWidget from '@/components/backup/GlobalBackupStatusWidget';
import useAllTenantsBackupStatus from '@/hooks/useAllTenantsBackupStatus';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface GlobalMetrics {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  totalAdmins: number;
  totalSecretaries: number;
  totalTeachers: number;
  totalStudents: number;
  newTenantsLast30Days: number;
  trialExpiringSoon: number;
}

const fetchGlobalMetrics = async (): Promise<GlobalMetrics> => {
  const { data, error } = await supabase.functions.invoke('get-super-admin-metrics');
  if (error) throw new Error(error.message);
  // @ts-ignore
  if (data.error) throw new Error(data.error);
  return data as GlobalMetrics;
};

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

const SuperAdminOverviewPage: React.FC = () => {
  const { isSuperAdmin, isLoading: isProfileLoading } = useProfile();
  const { overallTenantsStatus, isLoading: isLoadingAllTenantsBackup, startBackupAllTenants, tenantsSummary } = useAllTenantsBackupStatus();
  const [backupAllTenantsProgressId, setBackupAllTenantsProgressId] = React.useState<string | null>(null);

  const { data: metrics, isLoading: areMetricsLoading } = useQuery<GlobalMetrics, Error>({
    queryKey: ['globalMetrics'],
    queryFn: fetchGlobalMetrics,
    enabled: isSuperAdmin,
  });

  const handleBackupAllTenants = async () => {
    try {
      await startBackupAllTenants();
      toast.success('Backup de Todos os Tenants Concluído!', { description: 'O backup para todas as escolas foi realizado com sucesso.' });
    } catch (error) {
      toast.error('Falha no Backup de Todos os Tenants', {
        description: (error as Error).message || 'Não foi possível completar o backup para todas as escolas.',
      });
    } finally {
      setBackupAllTenantsProgressId(null);
    }
  };

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const getOverallTenantsStatusBadge = (status: typeof overallTenantsStatus) => {
    switch (status) {
      case 'healthy': return <Badge className="bg-green-500 hover:bg-green-600">Saudável</Badge>;
      case 'warning': return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Atenção</Badge>;
      case 'critical': return <Badge variant="destructive">Crítico</Badge>;
      default: return <Badge variant="outline">N/A</Badge>;
    }
  };

  const criticalTenantsCount = tenantsSummary.filter(t => t.status === 'critical').length;
  const warningTenantsCount = tenantsSummary.filter(t => t.status === 'warning').length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <LayoutDashboard className="h-8 w-8 text-primary" />
        Visão Geral do Sistema SaaS
      </h1>

      {/* Linha de Métricas de Tenants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Métricas de Escolas (Tenants)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {areMetricsLoading ? Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />) : (
              <>
                <MetricCard 
                  title="Total de Escolas" 
                  value={metrics?.totalTenants ?? 0} 
                  icon={School} 
                  iconColor="text-primary" 
                />
                <MetricCard 
                  title="Escolas Ativas" 
                  value={metrics?.activeTenants ?? 0} 
                  icon={School} 
                  iconColor="text-green-500" 
                />
                <MetricCard 
                  title="Escolas em Trial" 
                  value={metrics?.trialTenants ?? 0} 
                  icon={Clock} 
                  iconColor="text-yellow-500" 
                />
                <MetricCard 
                  title="Escolas Suspensas" 
                  value={metrics?.suspendedTenants ?? 0} 
                  icon={AlertTriangle} 
                  iconColor="text-red-500" 
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Crescimento e Saúde da Plataforma</CardTitle>
          <CardDescription>Monitoramento de novos tenants e alertas críticos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {areMetricsLoading ? Array.from({ length: 2 }).map((_, i) => <MetricCardSkeleton key={`growth-${i}`} />) : (
              <>
                <MetricCard
                  title="Novas Escolas (30 dias)"
                  value={metrics?.newTenantsLast30Days ?? 0}
                  icon={TrendingUp}
                  iconColor="text-emerald-500"
                  description="Novos tenants criados no último mês"
                />
                <MetricCard
                  title="Trials expirando em 7 dias"
                  value={metrics?.trialExpiringSoon ?? 0}
                  icon={TimerReset}
                  iconColor="text-orange-500"
                  description="Trials próximos do vencimento"
                />
              </>
            )}
            <MetricCard
              title="Tenants em Atenção"
              value={warningTenantsCount}
              icon={Activity}
              iconColor="text-yellow-500"
              description="Backups com status de atenção"
            />
            <MetricCard
              title="Tenants Críticos"
              value={criticalTenantsCount}
              icon={AlertTriangle}
              iconColor="text-red-500"
              description="Backups com falhas críticas"
            />
          </div>
        </CardContent>
      </Card>

      {/* Linha de Métricas de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Métricas de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {areMetricsLoading ? Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />) : (
              <>
                <MetricCard 
                  title="Total de Usuários" 
                  value={metrics?.totalUsers ?? 0} 
                  icon={Users} 
                  iconColor="text-indigo-500" 
                />
                <MetricCard 
                  title="Administradores" 
                  value={metrics?.totalAdmins ?? 0} 
                  icon={UserCheck} 
                  iconColor="text-blue-500" 
                />
                <MetricCard 
                  title="Secretários(as)" 
                  value={metrics?.totalSecretaries ?? 0} 
                  icon={UserCheck} 
                  iconColor="text-purple-500" 
                />
                <MetricCard 
                  title="Professores" 
                  value={metrics?.totalTeachers ?? 0} 
                  icon={BookOpen} 
                  iconColor="text-orange-500" 
                />
                <MetricCard 
                  title="Estudantes" 
                  value={metrics?.totalStudents ?? 0} 
                  icon={User} 
                  iconColor="text-green-500" 
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status de Backup Global e Ações Rápidas */}
      <div className="grid gap-4 lg:grid-cols-3">
        <GlobalBackupStatusWidget />
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Ações de Configuração Rápida</CardTitle>
            <CardDescription>Acesse as áreas de gestão detalhada do sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center justify-center gap-2 text-center">
                <Link to="/super-admin/tenants">
                  <School className="h-6 w-6 text-primary" />
                  <span className="font-semibold text-sm mt-1">Gerenciar Escolas</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center justify-center gap-2 text-center">
                <Link to="/super-admin/users">
                  <Users className="h-6 w-6 text-primary" />
                  <span className="font-semibold text-sm mt-1">Gerenciar Usuários</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center justify-center gap-2 text-center">
                <Link to="/backup">
                  <HardDrive className="h-6 w-6 text-primary" />
                  <span className="font-semibold text-sm mt-1">Painel de Backup</span>
                </Link>
              </Button>
              <Button 
                onClick={handleBackupAllTenants}
                disabled={isLoadingAllTenantsBackup || !!backupAllTenantsProgressId}
                className="h-auto p-4 flex flex-col items-center justify-center gap-2 text-center bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoadingAllTenantsBackup || !!backupAllTenantsProgressId ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Cloud className="h-6 w-6" />
                )}
                <span className="font-semibold text-sm mt-1">Backup Todos Tenants</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Consolidado dos Tenants */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <School className="h-5 w-5 text-primary" />
            Status Consolidado dos Tenants
          </CardTitle>
          {getOverallTenantsStatusBadge(overallTenantsStatus)}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {criticalTenantsCount} escolas estão em estado crítico de backup e {warningTenantsCount} em atenção. 
            Acesse a <Link to="/super-admin/tenants" className="text-primary hover:underline">Gestão de Escolas</Link> para detalhes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminOverviewPage;