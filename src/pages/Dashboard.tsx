import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, DollarSign, BarChart, Activity, PlusCircle } from "lucide-react";
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { fetchTenantId } from "@/lib/tenant";

const fetchDashboardData = async () => {
  const { tenantId, error: tenantError } = await fetchTenantId();
  if (tenantError) throw new Error(tenantError);

  // 1. Total Students
  const { count: studentCount, error: studentError } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);
  if (studentError) throw studentError;

  // 2. Active Classes
  const { count: classCount, error: classError } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);
  if (classError) throw classError;

  // 3. Monthly Revenue
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const { data: revenueData, error: revenueError } = await supabase
    .from('revenues')
    .select('amount')
    .eq('tenant_id', tenantId)
    .gte('date', firstDayOfMonth.toISOString().split('T')[0])
    .lte('date', lastDayOfMonth.toISOString().split('T')[0])
    .eq('status', 'pago');
  if (revenueError) throw revenueError;

  const monthlyRevenue = revenueData.reduce((sum, rev) => sum + rev.amount, 0);

  return {
    totalStudents: studentCount ?? 0,
    activeClasses: classCount ?? 0,
    monthlyRevenue: monthlyRevenue,
  };
};

const Dashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
  });

  const kpiCards = [
    { title: "Total de Alunos", value: data?.totalStudents, icon: Users, format: (v: number) => v },
    { title: "Turmas Ativas", value: data?.activeClasses, icon: GraduationCap, format: (v: number) => v },
    { title: "Receita Mensal", value: data?.monthlyRevenue, icon: DollarSign, format: (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v) },
    { title: "Inadimplência", value: "Em breve", icon: BarChart },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Aluno
            </Button>
            <Button variant="outline" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Turma
            </Button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-[108px]" />
            <Skeleton className="h-[108px]" />
            <Skeleton className="h-[108px]" />
            <Skeleton className="h-[108px]" />
          </>
        ) : error ? (
          <div className="col-span-4 text-red-500">Erro ao carregar os indicadores.</div>
        ) : (
          kpiCards.map((kpi) => (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {typeof kpi.value === 'number' ? kpi.format(kpi.value) : kpi.value}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Novas Matrículas (Últimos 6 Meses)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2 flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">Gráfico em breve.</p>
          </CardContent>
        </Card>

        {/* Recent Activities & Quick Actions */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-full">
             <p className="text-muted-foreground">Recurso em breve.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;