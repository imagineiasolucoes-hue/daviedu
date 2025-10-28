import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, DollarSign, ArrowDownCircle, Activity, PlusCircle, Share2, UserCheck, UserPlus, Clock, Briefcase, UsersRound } from "lucide-react"; // Importando UsersRound
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { fetchTenantId } from "@/lib/tenant";
import StudentForm from "@/components/secretaria/students/StudentForm";
import ShareEnrollmentLink from "@/components/dashboard/ShareEnrollmentLink"; // Import the new component
import { format } from "date-fns";
import usePageTitle from "@/hooks/usePageTitle";

const fetchDashboardData = async () => {
  const { tenantId, error: tenantError } = await fetchTenantId();
  if (tenantError) throw new Error(tenantError);

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const firstDayISO = format(firstDayOfMonth, 'yyyy-MM-dd');
  const lastDayISO = format(lastDayOfMonth, 'yyyy-MM-dd');

  // 1. Total Active Students
  const { count: activeStudentCount, error: activeStudentError } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'active');
  if (activeStudentError) throw activeStudentError;

  // 2. Total Pre-enrolled Students
  const { count: preEnrolledStudentCount, error: preEnrolledStudentError } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'pre-enrolled');
  if (preEnrolledStudentError) throw preEnrolledStudentError;

  // 3. Active Classes
  const { count: classCount, error: classError } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);
  if (classError) throw classError;

  // 4. Monthly Paid Revenue
  const { data: paidRevenueData, error: paidRevenueError } = await supabase
    .from('revenues')
    .select('amount')
    .eq('tenant_id', tenantId)
    .gte('date', firstDayISO)
    .lte('date', lastDayISO)
    .eq('status', 'pago');
  if (paidRevenueError) throw paidRevenueError;
  const monthlyPaidRevenue = paidRevenueData.reduce((sum, rev) => sum + rev.amount, 0);

  // 5. Monthly Pending Revenue
  const { data: pendingRevenueData, error: pendingRevenueError } = await supabase
    .from('revenues')
    .select('amount')
    .eq('tenant_id', tenantId)
    .gte('date', firstDayISO)
    .lte('date', lastDayISO)
    .eq('status', 'pendente');
  if (pendingRevenueError) throw pendingRevenueError;
  const monthlyPendingRevenue = pendingRevenueData.reduce((sum, rev) => sum + rev.amount, 0);

  // 6. Monthly Paid Expenses
  const { data: expenseData, error: expenseError } = await supabase
    .from('expenses')
    .select('amount')
    .eq('tenant_id', tenantId)
    .gte('date', firstDayISO)
    .lte('date', lastDayISO)
    .eq('status', 'pago');
  if (expenseError) throw expenseError;
  const monthlyExpenses = expenseData.reduce((sum, exp) => sum + exp.amount, 0);

  // 7. Total Teachers
  const { count: teacherCount, error: teacherError } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('is_teacher', true)
    .eq('status', 'active'); // Only count active teachers
  if (teacherError) throw teacherError;

  return {
    totalActiveStudents: activeStudentCount ?? 0,
    totalPreEnrolledStudents: preEnrolledStudentCount ?? 0,
    activeClasses: classCount ?? 0,
    monthlyPaidRevenue: monthlyPaidRevenue,
    monthlyPendingRevenue: monthlyPendingRevenue,
    monthlyExpenses: monthlyExpenses,
    totalTeachers: teacherCount ?? 0,
  };
};

const Dashboard = () => {
  usePageTitle("Dashboard");
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [isShareLinkOpen, setIsShareLinkOpen] = useState(false);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
  });

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const kpiCards = [
    { title: "Alunos Ativos", value: data?.totalActiveStudents, icon: UserCheck, format: (v: number) => v },
    { title: "Pré-Matriculados", value: data?.totalPreEnrolledStudents, icon: UserPlus, format: (v: number) => v },
    { title: "Turmas Ativas", value: data?.activeClasses, icon: GraduationCap, format: (v: number) => v },
    { title: "Total de Professores", value: data?.totalTeachers, icon: UsersRound, format: (v: number) => v }, // Ícone atualizado aqui
    { title: "Receita Paga (Mês)", value: data?.monthlyPaidRevenue, icon: DollarSign, format: formatCurrency },
    { title: "Receita Pendente (Mês)", value: data?.monthlyPendingRevenue, icon: Clock, format: formatCurrency },
    { title: "Despesa Paga (Mês)", value: data?.monthlyExpenses, icon: ArrowDownCircle, format: formatCurrency },
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
            {/* <Button variant="outline" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Turma
            </Button> */} {/* Removido para simplificar o dashboard, pode ser adicionado na secretaria */}
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4"> {/* Ajustado para 4 colunas */}
        {isLoading ? (
          <>
            {kpiCards.map((_, index) => <Skeleton key={index} className="h-[108px]" />)}
          </>
        ) : error ? (
          <div className="col-span-full text-red-500">Erro ao carregar os indicadores: {error.message}</div>
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