import React, { useMemo } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, GraduationCap, ClipboardList, User, ArrowRight, LogOut, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate, Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StudentClassDiarySection from '@/components/student/StudentClassDiarySection';
import StudentGradesSection from '@/components/student/StudentGradesSection';
import StudentSnapshot from '@/components/student/StudentSnapshot';
import AppFooter from '@/components/layout/AppFooter';

interface StudentInfo {
  id: string;
  full_name: string;
  registration_code: string;
  class_id: string | null;
  course_id: string | null;
  birth_date: string;
  classes: { name: string; school_year: number } | null;
  courses: { name: string } | null;
  tenant_id: string;
  tenants: { name: string } | null;
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
      tenant_id,
      classes (name, school_year),
      courses (name),
      tenants (name)
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

  // Fetch guardians linked to the student to show responsible name
  const { data: guardiansData, isLoading: isLoadingGuardians } = useQuery<any[] | null, Error>({
    queryKey: ['studentGuardians', studentInfo?.id],
    queryFn: async () => {
      if (!studentInfo?.id) return null;
      const { data, error } = await supabase
        .from('student_guardians')
        .select('is_primary, guardians ( full_name )')
        .eq('student_id', studentInfo.id);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!studentInfo?.id,
  });

  const primaryGuardian = guardiansData && guardiansData.length > 0
    ? guardiansData.find(g => g.is_primary) || guardiansData[0]
    : null;
  const responsibleName = primaryGuardian?.guardians?.full_name ?? null;

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
    return <Navigate to="/dashboard" replace />;
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
          <div className="flex flex-col">
            <h1 className="text-xl font-bold">Portal do Aluno</h1>
            {studentInfo?.tenants?.name && (
              <p className="text-sm text-muted-foreground">{studentInfo.tenants.name}</p>
            )}
          </div>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          {/* Make the tab list scrollable on small screens to avoid cramped buttons */}
          <TabsList className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <TabsTrigger value="overview" className="whitespace-nowrap">Visão Geral</TabsTrigger>
            <TabsTrigger value="class-diary" className="whitespace-nowrap">Diário de Classe</TabsTrigger>
            <TabsTrigger value="grades" className="whitespace-nowrap">Notas</TabsTrigger>
            <TabsTrigger value="documents" className="whitespace-nowrap">Documentos</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 gap-4">
              <StudentSnapshot
                fullName={studentInfo.full_name}
                registrationCode={studentInfo.registration_code}
                className={studentInfo.classes?.name || null}
                tenantName={studentInfo.tenants?.name || null}
                birthDate={format(new Date(studentInfo.birth_date), 'dd/MM/yyyy', { locale: ptBR })}
                courseName={studentInfo.courses?.name || null}
                avatarUrl={undefined}
                responsibleName={responsibleName}
                onGenerateReport={handleViewReportCard}
                onContactSecretary={() => {
                  toast("Para falar com a secretaria, envie um email para a secretaria da escola.", { type: "info" });
                }}
              />
            </div>
          </TabsContent>
          <TabsContent value="class-diary" className="mt-4">
            {studentInfo.class_id && studentInfo.tenant_id ? (
              <StudentClassDiarySection studentInfo={studentInfo} />
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Você não está vinculado a uma turma para visualizar o diário de classe.
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="grades" className="mt-4">
            {studentInfo.id && studentInfo.tenant_id ? (
              <StudentGradesSection studentInfo={studentInfo} />
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Não foi possível carregar as notas. Informações do aluno incompletas.
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Conteúdo da aba de Documentos (em breve).
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Use the same footer as the school panel */}
      <AppFooter />
    </div>
  );
};

export default StudentPage;