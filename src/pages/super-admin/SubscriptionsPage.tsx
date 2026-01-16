import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import MetricCard from '@/components/dashboard/MetricCard';
import ExtendTrialDialog from '@/components/super-admin/ExtendTrialDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, RotateCw, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type TenantSubscriptionStatus = 'active' | 'trial' | 'suspended' | string;

interface TenantSubscriptionMetrics {
  id: string;
  name: string;
  status: TenantSubscriptionStatus;
  trial_expires_at: string | null;
  created_at: string;
  student_count: number;
  class_count: number;
  teacher_count: number;
  employee_count: number;
  plan_value: number;
}

const STATUS_LABELS: Record<TenantSubscriptionStatus, string> = {
  active: 'Ativa',
  trial: 'Trial',
  suspended: 'Suspensa',
};

const STATUS_VARIANTS: Record<TenantSubscriptionStatus, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  trial: 'secondary',
  suspended: 'destructive',
};

const STATUS_FILTERS: { value: 'all' | TenantSubscriptionStatus; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativas' },
  { value: 'trial', label: 'Trial' },
  { value: 'suspended', label: 'Suspensas' },
];

const fetchTenantMetrics = async (): Promise<TenantSubscriptionMetrics[]> => {
  const { data, error } = await supabase.functions.invoke('get-all-tenant-metrics');
  if (error) throw new Error(error.message);
  return (data ?? []) as TenantSubscriptionMetrics[];
};

const IndicatorSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-4 w-28" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-7 w-32" />
    </CardContent>
  </Card>
);

const SubscriptionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TenantSubscriptionStatus>('all');
  const [selectedTenant, setSelectedTenant] = useState<TenantSubscriptionMetrics | null>(null);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);

  const {
    data: tenants,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<TenantSubscriptionMetrics[], Error>({
    queryKey: ['tenantMetrics'],
    queryFn: fetchTenantMetrics,
  });

  const handleExtendClick = (tenant: TenantSubscriptionMetrics) => {
    setSelectedTenant(tenant);
    setExtendDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setExtendDialogOpen(open);
    if (!open) {
      setSelectedTenant(null);
      queryClient.invalidateQueries({ queryKey: ['tenantMetrics'] });
    }
  };

  const filteredTenants = useMemo(() => {
    if (!tenants) return [];
    const term = searchTerm.trim().toLowerCase();
    return tenants.filter((tenant) => {
      const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
      const matchesSearch =
        !term ||
        tenant.name.toLowerCase().includes(term) ||
        tenant.id.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [tenants, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    if (!tenants) {
      return {
        total: 0,
        active: 0,
        trial: 0,
        suspended: 0,
        mrr: 0,
        newLast30Days: 0,
        trialsExpiringSoon: 0,
      };
    }

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const soonThreshold = now + 7 * 24 * 60 * 60 * 1000;

    return tenants.reduce(
      (acc, tenant) => {
        acc.total += 1;
        acc.mrr += Number(tenant.plan_value ?? 0);

        if (tenant.status === 'active') acc.active += 1;
        if (tenant.status === 'trial') acc.trial += 1;
        if (tenant.status === 'suspended') acc.suspended += 1;

        const createdAt = tenant.created_at ? new Date(tenant.created_at).getTime() : 0;
        if (createdAt >= thirtyDaysAgo) acc.newLast30Days += 1;

        if (tenant.status === 'trial' && tenant.trial_expires_at) {
          const trialEnds = new Date(tenant.trial_expires_at).getTime();
          if (trialEnds >= now && trialEnds <= soonThreshold) {
            acc.trialsExpiringSoon += 1;
          }
        }

        return acc;
      },
      {
        total: 0,
        active: 0,
        trial: 0,
        suspended: 0,
        mrr: 0,
        newLast30Days: 0,
        trialsExpiringSoon: 0,
      },
    );
  }, [tenants]);

  const statusCounts = useMemo(
    () => ({
      active: stats.active,
      trial: stats.trial,
      suspended: stats.suspended,
    }),
    [stats],
  );

  const hasPendingTrial = (tenants?.some((tenant) => tenant.status === 'trial') ?? false) && !isLoading;

  const handleQuickExtend = () => {
    const nextTrial = tenants?.find((tenant) => tenant.status === 'trial');
    if (nextTrial) {
      handleExtendClick(nextTrial);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Super Admin
          </p>
          <h1 className="text-3xl font-bold">Gestão de Assinaturas</h1>
          <p className="text-sm text-muted-foreground">
            Monitore evolução, status e ações rápidas para cada assinante do SaaS.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="items-center gap-2"
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCw className="h-4 w-4" />
          )}
          Atualizar indicadores
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {isLoading || !tenants ? (
          Array.from({ length: 3 }).map((_, index) => <IndicatorSkeleton key={`ind-${index}`} />)
        ) : (
          <>
            <MetricCard
              title="Assinantes ativos"
              value={stats.active}
              icon={Badge}
              iconColor="text-primary-foreground"
              description="Base de contratos em produção"
            />
            <MetricCard
              title="Base total"
              value={stats.total}
              icon={Badge}
              iconColor="text-neutral-500"
              description="Inclui trials e suspensos"
            />
            <MetricCard
              title="MRR estimado"
              value={formatCurrency(stats.mrr)}
              icon={Badge}
              iconColor="text-emerald-500"
              description="Receita mensal recorrente simulada"
            />
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {isLoading || !tenants ? (
          Array.from({ length: 3 }).map((_, index) => <IndicatorSkeleton key={`ind2-${index}`} />)
        ) : (
          <>
            <MetricCard
              title="Trials em andamento"
              value={stats.trial}
              icon={Badge}
              iconColor="text-yellow-500"
              description="Potenciais conversões"
            />
            <MetricCard
              title="Novos (30 dias)"
              value={stats.newLast30Days}
              icon={Badge}
              iconColor="text-sky-500"
              description="Assinantes que chegaram recentemente"
            />
            <MetricCard
              title="Trials finais em 7 dias"
              value={stats.trialsExpiringSoon}
              icon={Badge}
              iconColor="text-orange-500"
              description="Atenção para renovações"
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ferramentas de gestão</CardTitle>
          <CardDescription>
            Filtre a base, encontre trials e abra ações rápidas sem sair da visão geral.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar escola ou ID"
                className="pl-10"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((filter) => (
                <Button
                  key={filter.value}
                  size="sm"
                  variant={statusFilter === filter.value ? 'secondary' : 'outline'}
                  onClick={() => setStatusFilter(filter.value as 'all' | TenantSubscriptionStatus)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCw className="h-4 w-4" />
              )}
              Recarregar dados
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleQuickExtend}
              disabled={!hasPendingTrial}
            >
              Extender próximo trial
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/super-admin/tenants">Ir para Gestão de Escolas</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(statusCounts) as Array<'active' | 'trial' | 'suspended'>).map((status) => (
              <Badge key={status} variant={STATUS_VARIANTS[status]}>
                {STATUS_LABELS[status]}: {statusCounts[status]}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Base de assinantes</CardTitle>
          <CardDescription>
            Tenants com detalhes de plano, usuários e ação direta de extensão de trial.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Escola</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Trial expira</TableHead>
                <TableHead>Base acadêmica</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : filteredTenants.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <p className="text-sm text-muted-foreground">Nenhum assinante encontrado.</p>
                    </TableCell>
                  </TableRow>
                )
                : filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">{tenant.id.slice(0, 8)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[tenant.status] ?? 'outline'}>
                          {STATUS_LABELS[tenant.status] ?? tenant.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold">{formatCurrency(tenant.plan_value ?? 0)}</p>
                        <p className="text-xs text-muted-foreground">{tenant.employee_count} equipes</p>
                      </TableCell>
                      <TableCell>
                        {tenant.trial_expires_at
                          ? format(new Date(tenant.trial_expires_at), 'dd/MM/yyyy')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm leading-snug">
                          {tenant.student_count} alunos<br />
                          {tenant.teacher_count} professores
                        </p>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExtendClick(tenant)}
                          disabled={tenant.status !== 'trial'}
                        >
                          Estender trial
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
            <TableCaption>
              Mostrando {filteredTenants.length} de {tenants?.length ?? 0} assinantes.
            </TableCaption>
          </Table>
        </CardContent>
      </Card>

      <ExtendTrialDialog
        tenantId={selectedTenant?.id ?? null}
        tenantName={selectedTenant?.name ?? null}
        currentExpiration={selectedTenant?.trial_expires_at ?? null}
        open={extendDialogOpen}
        onOpenChange={handleDialogOpenChange}
      />

      {isError && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao carregar assinantes</CardTitle>
            <CardDescription className="text-destructive">
              {(error as Error)?.message ?? 'Verifique sua conexão e tente novamente.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionsPage;