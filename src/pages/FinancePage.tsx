import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Scale, Clock, Loader2 } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import BarChartComponent from '@/components/finance/BarChartComponent';
import PieChartComponent from '@/components/finance/PieChartComponent';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface FinanceMetrics {
  paidRevenueMonth: number;
  pendingRevenueMonth: number;
  paidExpenseMonth: number;
  balanceMonth: number;
  paidRevenueYear: number; // Ainda mockado, mas mantido para o layout
  monthlyFinancialData: { name: string; Receita: number; Despesa: number }[]; // Novo
  categorizedExpenses: { name: string; value: number }[]; // Novo
}

// Função para buscar métricas financeiras (reutilizando a função do dashboard, mas tipando o retorno)
const fetchFinanceMetrics = async (tenantId: string): Promise<FinanceMetrics> => {
  const { data, error } = await supabase.functions.invoke('get-dashboard-metrics', {
    body: JSON.stringify({ tenant_id: tenantId }),
  });
  if (error) throw new Error(error.message);
  // @ts-ignore
  if (data.error) throw new Error(data.error);

  const metrics = data as {
    paidRevenueMonth: number;
    pendingRevenueMonth: number;
    paidExpenseMonth: number;
    monthlyFinancialData: { name: string; Receita: number; Despesa: number }[];
    categorizedExpenses: { name: string; value: number }[];
  };

  // Cálculo de Saldo (simplificado)
  const balanceMonth = metrics.paidRevenueMonth - metrics.paidExpenseMonth;

  // Mock de métrica anual (para fins de layout)
  const paidRevenueYear = metrics.paidRevenueMonth * 10; 

  return {
    ...metrics,
    balanceMonth,
    paidRevenueYear,
  };
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

const FinancePage: React.FC = () => {
  const { profile } = useProfile();
  const tenantId = profile?.tenant_id;

  const { data: metrics, isLoading: areMetricsLoading, error } = useQuery<FinanceMetrics, Error>({
    queryKey: ['financeMetrics', tenantId],
    queryFn: () => fetchFinanceMetrics(tenantId!),
    enabled: !!tenantId,
  });

  if (areMetricsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive">Erro ao carregar dados financeiros: {error.message}</div>;
  }

  const balanceColor = (metrics?.balanceMonth ?? 0) >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Visão Geral Financeira</h1>
        <DollarSign className="h-8 w-8 text-primary" />
      </div>
      
      {/* Linha de Métricas Chave */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {areMetricsLoading ? Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />) : (
          <>
            <MetricCard 
              title="Receita Paga (Mês)" 
              value={formatCurrency(metrics?.paidRevenueMonth)} 
              icon={TrendingUp} 
              iconColor="text-green-600" 
            />
            <MetricCard 
              title="Despesa Paga (Mês)" 
              value={formatCurrency(metrics?.paidExpenseMonth)} 
              icon={TrendingDown} 
              iconColor="text-red-600" 
            />
            <MetricCard 
              title="Saldo (Mês)" 
              value={formatCurrency(metrics?.balanceMonth)} 
              icon={Scale} 
              iconColor={balanceColor} 
              description="Receita Paga - Despesa Paga"
            />
            <MetricCard 
              title="Receita Pendente (Mês)" 
              value={formatCurrency(metrics?.pendingRevenueMonth)} 
              icon={Clock} 
              iconColor="text-yellow-600" 
            />
          </>
        )}
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BarChartComponent data={metrics?.monthlyFinancialData || []} />
        <PieChartComponent data={metrics?.categorizedExpenses || []} />
      </div>

      {/* Resumo Anual (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Anual</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Receita Total no Ano: <span className="font-bold text-primary">{formatCurrency(metrics?.paidRevenueYear)}</span>.
            Aqui serão adicionados relatórios detalhados e filtros por categoria.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancePage;