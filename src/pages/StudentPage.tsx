import React, { useMemo } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, GraduationCap, ClipboardList, User, ArrowRight, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate, Navigate } from 'react-router-dom'; // Importar Navigate
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudentInfo {
  id: string;
  full_name: string;
  registration_code: string;
  class_id: string | null;
  course_id: string | null;
  birth_date: string;
  classes: { name: string; school_year: number } | null;
  courses: { name: string } | null;
}

const fetchStudentInfo = async (userId: string, tenantId: string): Promise<StudentInfo | null> => {
  // Busca o registro do aluno vinculado ao user_id
  const { data, error } = await supabase
    .from('students')
    .select(`
      id, 
      full_name, 
      registration_code, 
      class_id,
      course_id,
      birth_date,
      classes (name, school_year),
      courses (name)
    `)
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as unknown as StudentInfo;
};

const StudentPage: React.FC = () => {
  const { profile, isLoading: isProfileLoading, isStudent } = useProfile();
  const navigate = useNavigate();
  const userId = profile?.id;
  const tenantId = profile?.tenant_id;

  const { data: studentInfo, isLoading: isLoadingStudentInfo, error: studentError } = useQuery<StudentInfo | null, Error>({
    queryKey: ['studentInfo', userId, tenantId],
    queryFn: () => fetchStudentInfo(userId!, tenantId!),
    enabled: !!userId && !!tenantId && isStudent,
  });

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Você foi desconectado.");
      navigate('/', { replace: true });
    } catch (error) {
      toast.error("Erro ao Sair", { description: "Não foi possível desconectar." });
    }
  };

  const handleViewReportCard = () => {
    if (studentInfo?.id) {
      navigate(`/documents/generate/report_card/${studentInfo.id}`);
    } else {
      toast.error("Erro", { description: "Não foi possível encontrar o ID do aluno para gerar o boletim." });
    }
  };

  if (isProfileLoading || isLoadingStudentInfo) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isStudent) {
    // Se não for estudante, mas chegou aqui, redireciona para o dashboard principal
    return <Navigate to="/dashboard" replace />; // CORREÇÃO AQUI
  }

  if (studentError) {
    return <div className="text-destructive">Erro ao carregar dados do aluno: {studentError.message}</div>;
  }

  if (!studentInfo) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          Portal do Aluno
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Acesso Não Vinculado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Seu usuário está logado, mas não está vinculado a um registro de aluno ativo nesta escola. 
              Por favor, entre em contato com a secretaria para vincular sua conta.
            </p>
            <Button variant="outline" onClick={handleLogout} className="mt-4">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="w-full py-4 px-6 border-b border-border/50 bg-background/90 backdrop-blur-sm sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Portal do Aluno</h1>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <User className="h-6 w-6 text-accent" />
              Bem-vindo(a), {studentInfo.full_name}!
            </CardTitle>
            <CardDescription>
              Informações da sua matrícula e acesso rápido aos seus documentos.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <p><span className="font-semibold">Matrícula:</span> {studentInfo.registration_code}</p>
            <p><span className="font-semibold">Turma:</span> {studentInfo.classes?.name || 'N/A'} ({studentInfo.classes?.school_year || 'N/A'})</p>
            <p><span className="font-semibold">Série/Ano:</span> {studentInfo.courses?.name || 'N/A'}</p>
            <p><span className="font-semibold">Nascimento:</span> {format(new Date(studentInfo.birth_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Documentos Acadêmicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleViewReportCard} className="w-full md:w-auto">
              <ClipboardList className="mr-2 h-4 w-4" />
              Visualizar Boletim Escolar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Para outros documentos (Histórico, Contratos), entre em contato com a secretaria.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentPage;