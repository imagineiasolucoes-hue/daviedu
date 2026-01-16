import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Scale, Clock, Loader2, FileText } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import BarChartComponent from '@/components/finance/BarChartComponent';
import PieChartComponent from '@/components/finance/PieChartComponent';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface FinanceMetrics {
  paidRevenueMonth: number;
  pendingRevenueMonth: number;
  paidExpenseMonth: number;
  balanceMonth: number;
  monthlyFinancialData: { name: string; Receita: number; Despesa: number }[];
  categorizedExpenses: { name: string; value: number }[];
}

const fetchFinanceMetrics = async (tenantId: string, year: string, month: string): Promise<FinanceMetrics> => {
  const { data, error } = await supabase.functions.invoke('get-finance-metrics', {
    body: JSON.stringify({ tenant_id: tenantId, year: parseInt(year), month: month === 'all' ? null : parseInt(month) }),
  });
  if (error) throw new Error(error.message);
  // @ts-ignore
  if (data.error) throw new Error(data.error);
  return data as FinanceMetrics;
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
  const navigate = useNavigate();
  const [showDebug, setShowDebug] = useState(false);
  const [rawRevenues, setRawRevenues] = useState<any[] | null>(null);

  const currentYear = String(new Date().getFullYear());
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' for all months, or '01' to '12'

  // On mount (or when tenant changes), try to detect the most recent revenue year
  // and use it as the default selectedYear so the overview shows existing data.
  useEffect(() => {
    if (!tenantId) return;
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('revenues')
          .select('date')
          .eq('tenant_id', tenantId)
          .order('date', { ascending: false })
          .limit(1);

        if (!mounted) return;
        if (data && data.length > 0 && data[0].date) {
          const latestYear = new Date(data[0].date).getFullYear().toString();
          // Only update if different so we don't unnecessarily re-render
          if (latestYear !== selectedYear) {
            setSelectedYear(latestYear);
          }
        }
      } catch (err) {
        console.error('[FinancePage] error fetching latest revenue date', err);
      }
    })();
    return () => { mounted = false; };
  }, [tenantId]);

  const { data: metrics, isLoading: areMetricsLoading, error } = useQuery<FinanceMetrics, Error>({
    queryKey: ['financeMetrics', tenantId, selectedYear, selectedMonth],
    queryFn: () => fetchFinanceMetrics(tenantId!, selectedYear, selectedMonth),
    enabled: !!tenantId,
  });

  const fetchRecentRevenues = async () => {
    if (!tenantId) {
      setRawRevenues(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('revenues')
        .select('id, date, description, amount, payment_method, status, created_at, student_id')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        console.error('[FinancePage] fetchRecentRevenues error', error);
        setRawRevenues(null);
      } else {
        setRawRevenues(data || []);
      }
    } catch (err) {
      console.error('[FinancePage] fetchRecentRevenues exception', err);
      setRawRevenues(null);
    }
  };

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

  // Debug: show raw metrics and optionally direct revenue rows
  const handleToggleDebug = async () => {
    const next = !showDebug;
    setShowDebug(next);
    if (next) {
      await fetchRecentRevenues();
    } else {
      setRawRevenues(null);
    }
  };

  const balanceColor = (metrics?.balanceMonth ?? 0) >= 0 ? 'text-green-600' : 'text-red-600';

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const monthNum = String(i + 1).padStart(2, '0');
    const monthName = new Date(0, i).toLocaleString('pt-BR', { month: 'long' });
    return { value: monthNum, label: monthName };
  });

  const yearOptions = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Visão Geral Financeira</h1>
        <DollarSign className="h-8 w-8 text-primary" />
      </div>
      
      {/* Filtros e Botão de Relatório */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-4 w-full md:w-auto">
            <div className="space-y-2 flex-1">
              <Label htmlFor="year-select">Ano</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="month-select">Mês</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos os Meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Meses</SelectItem>
                  {monthOptions.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="ghost" onClick={handleToggleDebug}>
              {showDebug ? 'Ocultar Debug' : 'Mostrar Debug'}
            </Button>
          </div>
          <Button 
            onClick={() => navigate(`/documents/generate/finance_report/${selectedYear}/${selectedMonth}`)}
            disabled={areMetricsLoading}
            className="w-full md:w-auto mt-auto"
          >
            <FileText className="mr-2 h-4 w-4" />
            Gerar Relatório
          </Button>
        </div>
      </Card>

      {showDebug && (
        <Card>
          <CardHeader>
            <CardTitle>Debug: resposta bruta da função e receitas recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <strong>Edge function response (metrics):</strong>
              <pre className="mt-2 max-h-60 overflow-auto bg-slate-50 p-2 rounded text-sm">
                {JSON.stringify(metrics, null, 2)}
              </pre>
            </div>
            <div>
              <strong>Revenues (client query):</strong>
              {rawRevenues === null ? (
                <p className="text-sm text-muted-foreground">Nenhum dado carregado.</p>
              ) : rawRevenues.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem registros de receitas</p>
              ) : (
                <pre className="mt-2 max-h-60 overflow-auto bg-slate-50 p-2 rounded text-sm">
                  {JSON.stringify(rawRevenues.slice(0, 50), null, 2)}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Linha de Métricas Chave */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {areMetricsLoading ? Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />) : (
          <>
            <MetricCard 
              title="Receita Paga" 
              value={formatCurrency(metrics?.paidRevenueMonth)} 
              icon={TrendingUp} 
              iconColor="text-green-600" 
            />
            <MetricCard 
              title="Despesa Paga" 
              value={formatCurrency(metrics?.paidExpenseMonth)} 
              icon={TrendingDown} 
              iconColor="text-red-600" 
            />
            <MetricCard 
              title="Saldo" 
              value={formatCurrency(metrics?.balanceMonth)} 
              icon={Scale} 
              iconColor={balanceColor} 
              description="Receita Paga - Despesa Paga"
            />
            <MetricCard 
              title="Receita Pendente" 
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
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Os dados acima refletem o período selecionado nos filtros. Para uma análise mais aprofundada, utilize a função de "Gerar Relatório".
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancePage;