import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShoppingCart, Repeat, DollarSign, LayoutDashboard } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile } from '@/hooks/useProfile';
import { Navigate } from 'react-router-dom';

interface KiwifyMetrics {
  totalSales: number;
  totalSubscriptions: number;
}

const fetchKiwifyMetrics = async (): Promise<KiwifyMetrics> => {
  const { data, error } = await supabase.functions.invoke('get-kiwify-metrics');
  if (error) throw new Error(error.message);
  // @ts-ignore
  if (data.error) throw new Error(data.error);
  return data as KiwifyMetrics;
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

const KiwifyPage: React.FC = () => {
  const { isSuperAdmin, isLoading: isProfileLoading } = useProfile();

  const { data: kiwifyMetrics, isLoading: areKiwifyMetricsLoading, error } = useQuery<KiwifyMetrics, Error>({
    queryKey: ['kiwifyMetrics'],
    queryFn: fetchKiwifyMetrics,
    enabled: isSuperAdmin, // Only fetch if the current user is a Super Admin
  });

  if (isProfileLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    // Redirect if not a Super Admin
    return <Navigate to="/dashboard" replace />;
  }

  if (areKiwifyMetricsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <DollarSign className="h-8 w-8 text-kiwify" />
          Métricas Kiwify
        </h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 2 }).map((_, i) => <MetricCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive">Erro ao carregar métricas do Kiwify: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <DollarSign className="h-8 w-8 text-kiwify" />
        Métricas Kiwify
      </h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Vendas Kiwify (Total)" 
          value={formatCurrency(kiwifyMetrics?.totalSales ?? 0)} 
          icon={ShoppingCart} 
          iconColor="text-kiwify" 
        />
        <MetricCard 
          title="Assinaturas Ativas" 
          value={kiwifyMetrics?.totalSubscriptions ?? 0} 
          icon={Repeat} 
          iconColor="text-kiwify" 
        />
        {/* Adicione mais MetricCards para outras métricas do Kiwify aqui */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visão Geral das Vendas e Assinaturas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta página apresenta os principais indicadores de vendas e assinaturas gerenciados pela Kiwify.
            Futuramente, gráficos e filtros mais detalhados podem ser adicionados aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default KiwifyPage;