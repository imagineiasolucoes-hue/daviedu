import React, { useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Printer, ArrowLeft, School, DollarSign, TrendingUp, TrendingDown, Scale, Clock, BarChart, PieChart as PieChartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProfile } from '@/hooks/useProfile';
import { formatCurrency } from '@/lib/utils';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// --- Tipos de Dados ---
interface FinanceMetrics {
  paidRevenueMonth: number;
  pendingRevenueMonth: number;
  paidExpenseMonth: number;
  balanceMonth: number;
  monthlyFinancialData: { name: string; Receita: number; Despesa: number }[];
  categorizedExpenses: { name: string; value: number }[];
}

interface TenantConfig {
  cnpj: string | null;
  phone: string | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip_code: string | null;
  logo_url: string | null;
}

interface TenantDetails {
  name: string;
  config: TenantConfig | null;
}

// --- Funções de Busca ---
const fetchFinanceMetrics = async (tenantId: string, year: string, month: string): Promise<FinanceMetrics> => {
  const { data, error } = await supabase.functions.invoke('get-finance-metrics', {
    body: JSON.stringify({ tenant_id: tenantId, year: parseInt(year), month: month === 'all' ? null : parseInt(month) }),
  });
  if (error) throw new Error(error.message);
  // @ts-ignore
  if (data.error) throw new Error(data.error);
  return data as FinanceMetrics;
};

const fetchTenantDetails = async (tenantId: string): Promise<TenantDetails> => {
  const { data, error } = await supabase
    .from('tenants')
    .select('name, config')
    .eq('id', tenantId)
    .single();
  if (error) throw new Error(error.message);
  return data as TenantDetails;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57'];

const FinanceReportPDF: React.FC = () => {
  const { year, month } = useParams<{ year: string; month: string }>();
  const { profile } = useProfile();
  const tenantId = profile?.tenant_id;
  const printRef = useRef<HTMLDivElement>(null);

  const { data: financeData, isLoading: isLoadingFinanceData, error: financeError } = useQuery<FinanceMetrics, Error>({
    queryKey: ['financeReportData', tenantId, year, month],
    queryFn: () => fetchFinanceMetrics(tenantId!, year!, month!),
    enabled: !!tenantId && !!year && !!month,
  });

  const { data: tenant, isLoading: isLoadingTenant, error: tenantError } = useQuery<TenantDetails, Error>({
    queryKey: ['tenantDetails', tenantId],
    queryFn: () => fetchTenantDetails(tenantId!),
    enabled: !!tenantId,
  });

  const handlePrint = () => {
    window.print();
  };

  const isLoading = isLoadingFinanceData || isLoadingTenant;
  const error = financeError || tenantError;

  const periodLabel = useMemo(() => {
    if (!year || !month) return 'Período Desconhecido';
    if (month === 'all') {
      return `Ano: ${year}`;
    }
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('pt-BR', { month: 'long' });
    return `Mês: ${monthName} / Ano: ${year}`;
  }, [year, month]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl text-destructive">Erro ao Carregar Dados do Relatório</h1>
        <p className="text-muted-foreground">Verifique os filtros e tente novamente. Erro: {error.message}</p>
        <Button asChild variant="link" className="mt-4 print-hidden">
          <Link to="/finance">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Financeiro
          </Link>
        </Button>
      </div>
    );
  }

  if (!financeData || !tenant) {
    return <div className="text-destructive p-8">Dados financeiros ou da escola não encontrados.</div>;
  }

  const schoolConfig = tenant.config;
  const fullAddress = [
    schoolConfig?.address_street,
    schoolConfig?.address_number ? `, ${schoolConfig.address_number}` : '',
    schoolConfig?.address_neighborhood ? ` - ${schoolConfig.address_neighborhood}` : '',
    schoolConfig?.address_city,
    schoolConfig?.address_state,
    schoolConfig?.address_zip_code ? ` - CEP: ${schoolConfig.address_zip_code}` : '',
  ].filter(Boolean).join('');

  const balanceColor = financeData.balanceMonth >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 shadow-lg print:shadow-none print:p-0 print:w-full print:max-w-none print:mx-0" ref={printRef}>
      
      {/* Botões de Ação (Ocultos na Impressão) */}
      <div className="flex justify-between items-center mb-6 print-hidden">
        <Button variant="outline" asChild>
          <Link to="/finance">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Link>
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir Relatório
        </Button>
      </div>

      {/* Cabeçalho do Documento */}
      <div className="flex justify-between items-start mb-6 border-b pb-4">
        <div className="text-left space-y-1 flex-1">
          <h1 className="text-xl font-bold text-primary">{tenant.name}</h1>
          <p className="text-xs text-muted-foreground">RELATÓRIO FINANCEIRO</p>
          <p className="text-sm font-semibold mt-2">{periodLabel}</p>
          <div className="mt-2 text-xs text-muted-foreground space-y-1">
            {schoolConfig?.cnpj && <p>CNPJ: {schoolConfig.cnpj}</p>}
            {schoolConfig?.phone && <p>Telefone: {schoolConfig.phone}</p>}
            {fullAddress && <p>Endereço: {fullAddress}</p>}
          </div>
        </div>
        {tenant.config?.logo_url && (
          <img src={tenant.config.logo_url} alt="Logo da Escola" className="h-20 w-auto object-contain" />
        )}
      </div>

      {/* Métricas Chave */}
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-primary" />
        Métricas Financeiras
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Receita Paga</CardTitle>
          <CardContent className="p-0 pt-2 text-xl font-bold text-green-600">{formatCurrency(financeData.paidRevenueMonth)}</CardContent>
        </Card>
        <Card className="p-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Despesa Paga</CardTitle>
          <CardContent className="p-0 pt-2 text-xl font-bold text-red-600">{formatCurrency(financeData.paidExpenseMonth)}</CardContent>
        </Card>
        <Card className="p-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
          <CardContent className={`p-0 pt-2 text-xl font-bold ${balanceColor}`}>{formatCurrency(financeData.balanceMonth)}</CardContent>
        </Card>
        <Card className="p-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Receita Pendente</CardTitle>
          <CardContent className="p-0 pt-2 text-xl font-bold text-yellow-600">{formatCurrency(financeData.pendingRevenueMonth)}</CardContent>
        </Card>
      </div>

      <Separator className="mb-8" />

      {/* Gráfico de Barras */}
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <BarChart className="h-5 w-5 text-primary" />
        Fluxo de Caixa Mensal
      </h2>
      <Card className="mb-8">
        <CardContent className="h-[300px] p-2 md:p-6">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={financeData.monthlyFinancialData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                tickFormatter={(value: number) => formatCurrency(value)}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))', 
                  borderRadius: '0.5rem' 
                }}
                formatter={(value: number) => [formatCurrency(value), 'Valor']}
              />
              <Legend />
              <Bar dataKey="Receita" fill="hsl(142.1 76.2% 36.3%)" name="Receita" />
              <Bar dataKey="Despesa" fill="hsl(0 84.2% 60.2%)" name="Despesa" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Separator className="mb-8" />

      {/* Gráfico de Pizza */}
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <PieChartIcon className="h-5 w-5 text-primary" />
        Distribuição de Despesas por Categoria
      </h2>
      <Card className="mb-8">
        <CardContent className="h-[300px] p-2 md:p-6 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={financeData.categorizedExpenses}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {financeData.categorizedExpenses.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))', 
                  borderRadius: '0.5rem' 
                }}
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
              />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Rodapé do Documento */}
      <div className="mt-12 pt-4 border-t text-center text-xs text-muted-foreground print:mt-4">
        <p>Relatório financeiro gerado pelo sistema Davi EDU em {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}.</p>
        <p>Este documento é para fins informativos e de gestão interna.</p>
      </div>
    </div>
  );
};

export default FinanceReportPDF;