import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, TrendingUp, Users, BookOpen, DollarSign, CalendarDays, GraduationCap, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardMetrics {
  activeStudents: number;
  preEnrolledStudents: number;
  activeClasses: number;
  activeTeachers: number;
  activeEmployees: number;
  paidRevenueMonth: number;
  pendingRevenueMonth: number;
  paidExpenseMonth: number;
  totalCourses: number;
  totalAcademicEvents: number;
  totalGuardians: number;
  totalRevenuesOverall: number;
  totalExpensesOverall: number;
}

const fetchDashboardMetrics = async (tenantId: string): Promise<DashboardMetrics> => {
  const { data, error } = await supabase.functions.invoke('get-dashboard-metrics', {
    body: JSON.stringify({ tenant_id: tenantId }),
  });
  if (error) throw new Error(error.message);
  // @ts-ignore
  if (data.error) throw new Error(data.error);
  return data as DashboardMetrics;
};

interface EvolutionStep {
  id: string;
  label: string;
  icon: React.ElementType;
  isCompleted: (metrics: DashboardMetrics) => boolean;
  currentValue: (metrics: DashboardMetrics) => number;
  targetValue: number;
  description: string;
}

const evolutionSteps: EvolutionStep[] = [
  {
    id: 'teachers',
    label: 'Professores Cadastrados',
    icon: Users,
    isCompleted: (m) => m.activeTeachers > 0,
    currentValue: (m) => m.activeTeachers,
    targetValue: 1,
    description: 'Cadastre pelo menos um professor para começar a organizar as aulas.',
  },
  {
    id: 'students',
    label: 'Alunos Cadastrados',
    icon: GraduationCap,
    isCompleted: (m) => m.activeStudents >= 5,
    currentValue: (m) => m.activeStudents,
    targetValue: 5,
    description: 'Adicione pelo menos 5 alunos para popular suas turmas.',
  },
  {
    id: 'courses',
    label: 'Cursos/Séries Definidos',
    icon: BookOpen,
    isCompleted: (m) => m.totalCourses > 0,
    currentValue: (m) => m.totalCourses,
    targetValue: 1,
    description: 'Defina os cursos ou séries oferecidos pela sua escola.',
  },
  {
    id: 'classes',
    label: 'Turmas Criadas',
    icon: FolderKanban,
    isCompleted: (m) => m.activeClasses > 0,
    currentValue: (m) => m.activeClasses,
    targetValue: 1,
    description: 'Crie pelo menos uma turma e vincule-a a um curso.',
  },
  {
    id: 'revenues',
    label: 'Receitas Registradas',
    icon: TrendingUp,
    isCompleted: (m) => m.totalRevenuesOverall > 0,
    currentValue: (m) => m.totalRevenuesOverall,
    targetValue: 1,
    description: 'Registre sua primeira receita para acompanhar o fluxo de caixa.',
  },
  {
    id: 'expenses',
    label: 'Despesas Registradas',
    icon: DollarSign,
    isCompleted: (m) => m.totalExpensesOverall > 0,
    currentValue: (m) => m.totalExpensesOverall,
    targetValue: 1,
    description: 'Registre sua primeira despesa para ter controle financeiro total.',
  },
  {
    id: 'events',
    label: 'Eventos Acadêmicos',
    icon: CalendarDays,
    isCompleted: (m) => m.totalAcademicEvents > 0,
    currentValue: (m) => m.totalAcademicEvents,
    targetValue: 1,
    description: 'Adicione eventos importantes ao calendário acadêmico.',
  },
];

const SchoolEvolutionIndicator: React.FC = () => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const tenantId = profile?.tenant_id;

  const { data: metrics, isLoading: areMetricsLoading, error } = useQuery<DashboardMetrics, Error>({
    queryKey: ['dashboardMetrics', tenantId],
    queryFn: () => fetchDashboardMetrics(tenantId!),
    enabled: !!tenantId,
  });

  const overallProgress = useMemo(() => {
    if (!metrics) return 0;
    const completedSteps = evolutionSteps.filter(step => step.isCompleted(metrics)).length;
    return (completedSteps / evolutionSteps.length) * 100;
  }, [metrics]);

  if (isProfileLoading || areMetricsLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Evolução da Escola</CardTitle>
          <CardDescription>Acompanhe o progresso da sua escola no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <Progress value={0} className="w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Evolução da Escola</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Erro ao carregar dados de evolução: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Evolução da Escola</CardTitle>
        <CardDescription>Acompanhe o progresso da sua escola no sistema.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Progresso Geral</p>
          <Progress value={overallProgress} className="w-full" />
          <p className="text-right text-sm text-muted-foreground">{overallProgress.toFixed(0)}% Completo</p>
        </div>

        <div className="space-y-3">
          {metrics && evolutionSteps.map(step => {
            const isCompleted = step.isCompleted(metrics);
            const Icon = step.icon;
            const currentValue = step.currentValue(metrics);
            const progress = Math.min((currentValue / step.targetValue) * 100, 100);

            return (
              <div key={step.id} className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center justify-center h-6 w-6 rounded-full",
                  isCompleted ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300"
                )}>
                  {isCompleted ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="flex-grow">
                  <p className="text-sm font-medium">{step.label}</p>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentValue} de {step.targetValue} {step.label.split(' ')[0].toLowerCase()} {isCompleted ? 'concluído' : 'para concluir'}.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SchoolEvolutionIndicator;