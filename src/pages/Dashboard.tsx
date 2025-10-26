import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, DollarSign, ArrowDownCircle, Activity, PlusCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { fetchTenantId } from "@/lib/tenant";
import StudentForm from "@/components/secretaria/students/StudentForm";
import ShareEnrollmentLink from "@/components/dashboard/ShareEnrollmentLink"; // Import the new component

const fetchDashboardData = async () => {
  const { tenantId, error: tenantError } = await fetchTenantId();
  if (tenantError) throw new Error(tenantError);

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const firstDayISO = firstDayOfMonth.toISOString().split('T')[0];
  const lastDayISO = lastDayOfMonth.toISOString().split('T')[0];

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
  const { data: revenueData, error: revenueError } = await supabase
    .from('revenues')
    .select('amount')
    .eq('tenant_id', tenantId)
    .gte('date', firstDayISO)
    .lte('date', lastDayISO)
    .eq('status', 'pago');
  if (revenueError) throw revenueError;
  const monthlyRevenue = revenueData.reduce((sum, rev) => sum + rev.amount, 0);

  // 4. Monthly Expenses
  const { data: expenseData, error: expenseError } = await supabase
    .from('expenses')
    .select('amount')
    .eq('tenant_id', tenantId)
    .gte('date', firstDayISO)
    .lte('date', lastDayISO)
    .eq('status', 'pago');
  if (expenseError) throw expenseError;
  const monthlyExpenses = expenseData.reduce((sum, exp) => sum + exp.amount, 0);

  return {
    totalStudents: studentCount ?? 0,
    activeClasses: classCount ?? 0,
    monthlyRevenue: monthlyRevenue,
    monthlyExpenses: monthlyExpenses,
  };
};

const Dashboard = () => {
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [isShareLinkOpen, setIsShareLinkOpen] = useState(false); // New state for share link
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
  });

  const kpiCards = [
    { title: "Total de Alunos", value: data?.totalStudents, icon: Users, format: (v: number) => v },
    { title: "Turmas Ativas", value: data?.activeClasses, icon: GraduationCap, format: (v: number) => v },
    { title: "Receita Mensal", value: data?.monthlyRevenue, icon: DollarSign, format: (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v) },
    { title: "Despesa Mensal", value: data?.monthlyExpenses, icon: ArrowDownCircle, format: (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsShareLinkOpen(true)}>
                <Share2 className="mr-2 h-4 w-4" />
                Link Pré-Matrícula
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsStudentFormOpen(true)}>
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
      
      {/* Modals */}
      <StudentForm
        isOpen={isStudentFormOpen}
        onClose={() => setIsStudentFormOpen(false)}
        initialData={null}
      />
      <ShareEnrollmentLink
        isOpen={isShareLinkOpen}
        onClose={() => setIsShareLinkOpen(false)}
      />
    </div>
  );
};

export default Dashboard;