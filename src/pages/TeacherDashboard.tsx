import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, GraduationCap, BookOpen, ClipboardList, CalendarDays, FileText, User, ArrowRight, BookMarked } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface TeacherClassAssignment {
  class_id: string;
  course_id: string;
  period: 'Manhã' | 'Tarde' | 'Noite' | 'Integral';
  classes: {
    name: string;
    school_year: number;
  } | null;
  courses: {
    name: string;
  } | null;
}

interface TeacherDetails {
  id: string;
  full_name: string;
  main_subject: string | null;
  teacher_classes: TeacherClassAssignment[];
}

const fetchTeacherDetails = async (employeeId: string): Promise<TeacherDetails | null> => {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      id, 
      full_name, 
      main_subject,
      teacher_classes (
        class_id,
        course_id,
        period,
        classes (
          name,
          school_year
        ),
        courses (name)
      )
    `)
    .eq('id', employeeId)
    .maybeSingle(); // Alterado para maybeSingle()
  if (error) throw new Error(error.message);
  return data as unknown as TeacherDetails | null;
};

const TeacherDashboard: React.FC = () => {
  const { profile, isLoading: isProfileLoading, isTeacher } = useProfile();
  const employeeId = profile?.employee_id;
  const navigate = useNavigate();

  const { data: teacherDetails, isLoading: isLoadingTeacherDetails, error: teacherError } = useQuery<TeacherDetails | null, Error>({
    queryKey: ['teacherDetails', employeeId],
    queryFn: () => fetchTeacherDetails(employeeId!),
    enabled: !!employeeId && isTeacher,
  });

  if (isProfileLoading || isLoadingTeacherDetails) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isTeacher) {
    // Se não for professor, redireciona para o dashboard principal
    return <Navigate to="/dashboard" replace />;
  }

  if (teacherError) {
    return <div className="text-destructive">Erro ao carregar dados do professor: {teacherError.message}</div>;
  }

  if (!teacherDetails) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="h-8 w-8 text-primary" />
          Painel do Professor
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Perfil de Professor Não Encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Seu usuário está logado, mas não está vinculado a um registro de professor ativo.
              Por favor, entre em contato com a administração da escola.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <User className="h-8 w-8 text-primary" />
        Bem-vindo(a), Professor(a) {teacherDetails.full_name.split(' ')[0]}!
      </h1>
      <p className="text-muted-foreground">
        Aqui você pode gerenciar suas turmas, lançar notas e acessar recursos acadêmicos.
      </p>

      {/* Seção de Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>Acesse as principais funcionalidades para o seu dia a dia.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center justify-center gap-2 text-center" onClick={() => navigate('/grades/entry')}>
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
              <span className="font-semibold text-sm mt-1">Lançar Notas</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center justify-center gap-2 text-center" onClick={() => navigate('/classes/subjects')}>
              <BookMarked className="h-6 w-6 text-muted-foreground" />
              <span className="font-semibold text-sm mt-1">Matérias e Períodos</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center justify-center gap-2 text-center" onClick={() => navigate('/classes/courses')}>
              <BookOpen className="h-6 w-6 text-muted-foreground" />
              <span className="font-semibold text-sm mt-1">Séries/Anos</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center justify-center gap-2 text-center" onClick={() => navigate('/calendar')}>
              <CalendarDays className="h-6 w-6 text-muted-foreground" />
              <span className="font-semibold text-sm mt-1">Calendário</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center justify-center gap-2 text-center" onClick={() => navigate('/documents')}>
              <FileText className="h-6 w-6 text-muted-foreground" />
              <span className="font-semibold text-sm mt-1">Documentos</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center justify-center gap-2 text-center" onClick={() => navigate('/settings?tab=profile')}>
              <User className="h-6 w-6 text-muted-foreground" />
              <span className="font-semibold text-sm mt-1">Meu Perfil</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Minhas Turmas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Minhas Turmas ({teacherDetails.teacher_classes.length})
          </CardTitle>
          <CardDescription>Visão geral das turmas que você leciona.</CardDescription>
        </CardHeader>
        <CardContent>
          {teacherDetails.teacher_classes.length === 0 ? (
            <p className="text-muted-foreground">Você não tem turmas atribuídas no momento.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacherDetails.teacher_classes.map((assignment, index) => (
                <Card key={index} className="p-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-accent" />
                    {assignment.classes?.name || 'Turma Desconhecida'}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Ano Letivo: {assignment.classes?.school_year || 'N/A'}
                  </CardDescription>
                  <div className="mt-3 space-y-1 text-sm">
                    <p><span className="font-semibold">Série/Ano:</span> {assignment.courses?.name || 'N/A'}</p>
                    <p><span className="font-semibold">Período:</span> <Badge variant="secondary">{assignment.period}</Badge></p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                    <Link to="/grades/entry">
                      Lançar Notas <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;