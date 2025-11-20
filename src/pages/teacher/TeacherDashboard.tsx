import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ClipboardList, LayoutDashboard, GraduationCap, CalendarDays, Users, Clock, School } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useTeacherMetrics } from '@/hooks/useTeacherMetrics';
import { Loader2 } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import { Skeleton } from '@/components/ui/skeleton';

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

const TeacherDashboard: React.FC = () => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const { metrics, isLoading: isMetricsLoading, error: metricsError } = useTeacherMetrics();

  const isLoading = isProfileLoading || isMetricsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (metricsError) {
    return <div className="text-destructive">Erro ao carregar métricas: {metricsError.message}</div>;
  }

  const teacherName = profile?.first_name || 'Professor(a)';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <LayoutDashboard className="h-8 w-8 text-primary" />
        Bem-vindo(a), {teacherName}!
      </h1>
      <p className="text-muted-foreground">
        Visão geral das suas responsabilidades e acesso rápido às ferramentas essenciais.
      </p>

      {/* Linha de KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />) : (
          <>
            <MetricCard 
              title="Minhas Turmas" 
              value={metrics?.totalClasses ?? 0} 
              icon={School} 
              iconColor="text-primary" 
              description="Total de turmas atribuídas"
            />
            <MetricCard 
              title="Total de Alunos" 
              value={metrics?.totalStudents ?? 0} 
              icon={Users} 
              iconColor="text-green-600" 
              description="Alunos ativos nas suas turmas"
            />
            <MetricCard 
              title="Notas Pendentes" 
              value={metrics?.pendingGrades ?? 0} 
              icon={ClipboardList} 
              iconColor="text-yellow-600" 
              description="Avaliações aguardando lançamento (Mock)"
            />
            <MetricCard 
              title="Próxima Aula" 
              value="8:00 AM" 
              icon={Clock} 
              iconColor="text-indigo-500" 
              description="Matemática - 3º Ano (Mock)"
            />
          </>
        )}
      </div>

      {/* Ações Principais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Ações Essenciais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Lançar Notas</CardTitle>
                <GraduationCap className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Registre as avaliações e notas dos seus alunos.
                </CardDescription>
                <Button asChild className="w-full">
                  <Link to="/teacher/grade-entry">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Ir para Lançamento
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Diário de Classe</CardTitle>
                <BookOpen className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Faça anotações diárias sobre o andamento das suas turmas.
                </CardDescription>
                <Button asChild className="w-full">
                  <Link to="/teacher/class-diary">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Ir para Diário
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Minhas Turmas</CardTitle>
                <School className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Visualize a lista de todas as turmas que você leciona.
                </CardDescription>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/teacher/my-classes"> {/* Rota corrigida */}
                    <Users className="mr-2 h-4 w-4" />
                    Ver Turmas
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;