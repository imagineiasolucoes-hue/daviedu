import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Link, Navigate } from 'react-router-dom';
import {
  Loader2,
  School,
  Users,
  HardDrive,
  LayoutDashboard,
  AlertTriangle,
  Cloud,
  UserCheck,
  BookOpen,
  User as UserIcon,
  Clock,
  TrendingUp,
  TimerReset,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MetricCard from '@/components/dashboard/MetricCard';
import { Skeleton } from '@/components/ui/skeleton';
import GlobalBackupStatusWidget from '@/components/backup/GlobalBackupStatusWidget';
import useAllTenantsBackupStatus from '@/hooks/useAllTenantsBackupStatus';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const { isLoading: isLoadingAllTenantsBackup, startBackupAllTenants, tenantsSummary } = useAllTenantsBackupStatus();

  const { data: metrics, isLoading: areMetricsLoading } = useQuery<GlobalMetrics, Error>({
    queryKey: ['globalMetrics'],
    queryFn: fetchGlobalMetrics,
    enabled: isSuperAdmin,
  });

  const handleBackupAllTenants = async () => {
    try {
      await startBackupAllTenants();
      toast.success('Backup de Todos os Tenants Concluído!', {
        description: 'O backup para todas as escolas foi realizado com sucesso.',
      });
    } catch (error) {
      toast.error('Falha no Backup de Todos os Tenants', {
        description:
          (error as Error).message || 'Não foi possível completar o backup para todas as escolas.',
      });
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

  const criticalTenantsCount = tenantsSummary.filter((t) => t.status === 'critical').length;
  const warningTenantsCount = tenantsSummary.filter((t) => t.status === 'warning').length;

  const overviewBadge = (() => {
    if (criticalTenantsCount > 0) return <Badge variant="destructive">Crítico</Badge>;
    if (warningTenantsCount > 0)
      return (
        <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">
          Atenção
        </Badge>
      );
    return <Badge className="bg-green-500 hover:bg-green-600">Saudável</Badge>;
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            Visão Geral do Sistema
          </h1>
          <p className="text-sm text-muted-foreground">
            Indicadores essenciais, saúde da plataforma e atalhos administrativos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Saúde geral:</span>
          {overviewBadge}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Coluna principal */}
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold">Indicadores</CardTitle>
            <CardDescription>
              Tudo em um só lugar: Tenants, crescimento, alertas e base de usuários.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Tabs defaultValue="tenants">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="tenants" className="gap-2">
                  <School className="h-4 w-4" />
                  Tenants
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-2">
                  <Users className="h-4 w-4" />
                  Usuários
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tenants" className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">Base de escolas</h3>
                    <Badge variant="outline" className="text-xs">
                      {warningTenantsCount} atenção • {criticalTenantsCount} críticos
                    </Badge>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {areMetricsLoading ? (
                      Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={`t-${i}`} />)
                    ) : (
                      <>
                        <MetricCard
                          title="Total de Escolas"
                          value={metrics?.totalTenants ?? 0}
                          icon={School}
                          iconColor="text-primary"
                        />
                        <MetricCard
                          title="Ativas"
                          value={metrics?.activeTenants ?? 0}
                          icon={School}
                          iconColor="text-green-500"
                          description="Operando normalmente"
                        />
                        <MetricCard
                          title="Em Trial"
                          value={metrics?.trialTenants ?? 0}
                          icon={Clock}
                          iconColor="text-yellow-500"
                          description="Em avaliação"
                        />
                        <MetricCard
                          title="Suspensas"
                          value={metrics?.suspendedTenants ?? 0}
                          icon={AlertTriangle}
                          iconColor="text-red-500"
                          description="Atenção necessária"
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Crescimento & alertas</h3>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {areMetricsLoading ? (
                      Array.from({ length: 2 }).map((_, i) => (
                        <MetricCardSkeleton key={`g-${i}`} />
                      ))
                    ) : (
                      <>
                        <MetricCard
                          title="Novas Escolas (30 dias)"
                          value={metrics?.newTenantsLast30Days ?? 0}
                          icon={TrendingUp}
                          iconColor="text-emerald-500"
                          description="Aquisição recente"
                        />
                        <MetricCard
                          title="Trials vencendo (7 dias)"
                          value={metrics?.trialExpiringSoon ?? 0}
                          icon={TimerReset}
                          iconColor="text-orange-500"
                          description="Prioridade comercial"
                        />
                      </>
                    )}
                    <MetricCard
                      title="Backups em Atenção"
                      value={warningTenantsCount}
                      icon={Activity}
                      iconColor="text-yellow-500"
                      description="Tenants com alerta"
                    />
                    <MetricCard
                      title="Backups Críticos"
                      value={criticalTenantsCount}
                      icon={AlertTriangle}
                      iconColor="text-red-500"
                      description="Intervenção imediata"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="users" className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Base de usuários</h3>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    {areMetricsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => <MetricCardSkeleton key={`u-${i}`} />)
                    ) : (
                      <>
                        <MetricCard
                          title="Total"
                          value={metrics?.totalUsers ?? 0}
                          icon={Users}
                          iconColor="text-indigo-500"
                        />
                        <MetricCard
                          title="Admins"
                          value={metrics?.totalAdmins ?? 0}
                          icon={UserCheck}
                          iconColor="text-blue-500"
                        />
                        <MetricCard
                          title="Secretários"
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
                          icon={UserIcon}
                          iconColor="text-green-500"
                        />
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Coluna lateral */}
        <div className="grid gap-4">
          <GlobalBackupStatusWidget />

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Atalhos</CardTitle>
              <CardDescription>Ações frequentes do Super Admin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
                  <Link to="/super-admin/tenants">
                    <School className="h-6 w-6 text-primary" />
                    <span className="text-xs font-semibold">Escolas</span>
                  </Link>
                </Button>

                <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
                  <Link to="/super-admin/users">
                    <Users className="h-6 w-6 text-primary" />
                    <span className="text-xs font-semibold">Usuários</span>
                  </Link>
                </Button>

                <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
                  <Link to="/backup">
                    <HardDrive className="h-6 w-6 text-primary" />
                    <span className="text-xs font-semibold">Backup</span>
                  </Link>
                </Button>

                <Button
                  onClick={handleBackupAllTenants}
                  disabled={isLoadingAllTenantsBackup}
                  className="h-auto py-4 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoadingAllTenantsBackup ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Cloud className="h-6 w-6" />
                  )}
                  <span className="text-xs font-semibold">Backup (Todos)</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminOverviewPage;