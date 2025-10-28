import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, DollarSign, ArrowDownCircle, Activity, PlusCircle, Share2, UserCheck, UserPlus, Clock, Briefcase, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { fetchTenantId } from "@/lib/tenant";
import StudentForm from "@/components/secretaria/students/StudentForm";
import ShareEnrollmentLink from "@/components/dashboard/ShareEnrollmentLink";
import { format, subMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import usePageTitle from "@/hooks/usePageTitle";
import EnrollmentChart from "@/components/dashboard/EnrollmentChart";
import RecentActivities from "@/components/dashboard/RecentActivities";

const fetchDashboardData = async () => {
  const { tenantId, error: tenantError } = await fetchTenantId();
  if (tenantError) throw new Error(tenantError);

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const firstDayOfMonthISO = format(firstDayOfMonth, 'yyyy-MM-dd');
  const lastDayOfMonthISO = format(lastDayOfMonth, 'yyyy-MM-dd');

  // --- KPIs & Chart Data in Parallel ---
  const [
    activeStudentRes,
    preEnrolledStudentRes,
    classRes,
    paidRevenueRes,
    pendingRevenueRes,
    expenseRes,
    teacherRes,
    employeeRes,
    newStudentsRes,
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'active'),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'pre-enrolled'),
    supabase.from('classes').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('revenues').select('amount').eq('tenant_id', tenantId).gte('date', firstDayOfMonthISO).lte('date', lastDayOfMonthISO).eq('status', 'pago'),
    supabase.from('revenues').select('amount').eq('tenant_id', tenantId).gte('date', firstDayOfMonthISO).lte('date', lastDayOfMonthISO).eq('status', 'pendente'),
    supabase.from('expenses').select('amount').eq('tenant_id', tenantId).gte('date', firstDayOfMonthISO).lte('date', lastDayOfMonthISO).eq('status', 'pago'),
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('is_teacher', true).eq('status', 'active'),
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'active'),
    supabase.from('students').select('created_at').eq('tenant_id', tenantId).gte('created_at', format(startOfMonth(subMonths(today, 5)), 'yyyy-MM-dd')),
  ]);

  // Error handling for all promises
  const results = [activeStudentRes, preEnrolledStudentRes, classRes, paidRevenueRes, pendingRevenueRes, expenseRes, teacherRes, employeeRes, newStudentsRes];
  for (const res of results) {
    if (res.error) throw res.error;
  }

  const monthlyPaidRevenue = paidRevenueRes.data.reduce((sum, rev) => sum + rev.amount, 0);
  const monthlyPendingRevenue = pendingRevenueRes.data.reduce((sum, rev) => sum + rev.amount, 0);
  const monthlyExpenses = expenseRes.data.reduce((sum, exp) => sum + exp.amount, 0);

  // --- Process Enrollment Chart Data ---
  const enrollmentData: { [key: string]: number } = {};
  const monthLabels: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const month = subMonths(today, i);
    const monthKey = format(month, 'yyyy-MM');
    const monthLabel = format(month, 'MMM', { locale: ptBR });
    enrollmentData[monthKey] = 0;
    monthLabels.push(monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1));
  }

  newStudentsRes.data.forEach(student => {
    const monthKey = format(new Date(student.created_at), 'yyyy-MM');
    if (enrollmentData[monthKey] !== undefined) {
      enrollmentData[monthKey]++;
    }
  });

  const enrollmentChartData = Object.keys(enrollmentData).map((key, index) => ({
    name: monthLabels[index],
    total: enrollmentData[key],
  }));

  return {
    totalActiveStudents: activeStudentRes.count ?? 0,
    totalPreEnrolledStudents: preEnrolledStudentRes.count ?? 0,
    activeClasses: classRes.count ?? 0,
    monthlyPaidRevenue,
    monthlyPendingRevenue,
    monthlyExpenses,
    totalTeachers: teacherRes.count ?? 0,
    totalEmployees: employeeRes.count ?? 0,
    enrollmentChartData,
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
    { title: "Professores Ativos", value: data?.totalTeachers, icon: UsersRound, format: (v: number) => v },
    { title: "Funcionários Ativos", value: data?.totalEmployees, icon: Briefcase, format: (v: number) => v },
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
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          <CardContent className="pl-2">
            {isLoading ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <EnrollmentChart data={data?.enrollmentChartData || []} />
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
             <RecentActivities />
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