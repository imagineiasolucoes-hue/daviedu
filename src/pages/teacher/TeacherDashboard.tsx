import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ClipboardList, LayoutDashboard, GraduationCap, CalendarDays } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';

const TeacherDashboard: React.FC = () => {
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const teacherName = profile?.first_name || 'Professor(a)';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <LayoutDashboard className="h-8 w-8 text-primary" />
        Bem-vindo(a), {teacherName}!
      </h1>
      <p className="text-muted-foreground">
        Aqui você pode gerenciar suas turmas, lançar notas e registrar o diário de classe.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Lançar Notas</CardTitle>
            <GraduationCap className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Registre as avaliações e notas dos seus alunos.
            </CardDescription>
            <Button asChild className="w-full">
              <Link to="/teacher/grade-entry">
                <ClipboardList className="mr-2 h-4 w-4" />
                Ir para Lançamento de Notas
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Diário de Classe</CardTitle>
            <BookOpen className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Faça anotações diárias sobre o andamento das suas turmas.
            </CardDescription>
            <Button asChild className="w-full">
              <Link to="/teacher/class-diary">
                <CalendarDays className="mr-2 h-4 w-4" />
                Ir para Diário de Classe
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Adicione mais cards para outras funcionalidades do professor aqui */}
      </div>
    </div>
  );
};

export default TeacherDashboard;