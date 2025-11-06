import React, { useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Printer, ArrowLeft, School, User, Calendar, BookOpen, GraduationCap, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProfile } from '@/hooks/useProfile';

// --- Tipos de Dados ---
interface StudentDetails {
  id: string;
  full_name: string;
  registration_code: string;
  birth_date: string;
  tenant_id: string;
  classes: { 
    id: string;
    name: string; 
    school_year: number; 
    class_courses: { // Agora aninhado diretamente sob 'classes'
      courses: { name: string } | null;
    }[];
  } | null;
}

interface TenantConfig {
  logo_url: string | null;
}

interface TenantDetails {
  name: string;
  config: TenantConfig | null;
}

interface Grade {
  subject_name: string;
  grade_value: number;
  assessment_type: string;
  period: string;
  date_recorded: string;
}

// --- Funções de Busca ---
const fetchStudentData = async (studentId: string): Promise<StudentDetails> => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      id, 
      full_name, 
      registration_code, 
      birth_date, 
      tenant_id, 
      classes (
        id,
        name, 
        school_year,
        class_courses (
          courses (name)
        )
      )
    `)
    .eq('id', studentId)
    .single();
  if (error) throw new Error(error.message);
  
  // A estrutura de dados agora corresponde diretamente à interface StudentDetails
  return data as unknown as StudentDetails;
};

const fetchTenantDetails = async (tenantId: string): Promise<TenantDetails> => {
  const { data, error } = await supabase
    .from('tenants')
    .select('name, config')
    .eq('id', tenantId)
    .single();
  if (error) throw new Error(error.message);
  return data as TenantDetails;
};

const fetchGrades = async (studentId: string): Promise<Grade[]> => {
  const { data, error } = await supabase
    .from('grades')
    .select(`subject_name, grade_value, assessment_type, period, date_recorded`)
    .eq('student_id', studentId)
    .order('period')
    .order('subject_name');
  
  if (error) throw new Error(error.message);
  return data as Grade[];
};

const ReportCard: React.FC = () => {
  const { entityId: studentId } = useParams<{ entityId: string }>();
  const { profile } = useProfile();
  const tenantId = profile?.tenant_id;
  const printRef = useRef<HTMLDivElement>(null);

  const { data: student, isLoading: isLoadingStudent, error: studentError } = useQuery<StudentDetails, Error>({
    queryKey: ['studentDetails', studentId],
    queryFn: () => fetchStudentData(studentId!),
    enabled: !!studentId,
  });

  const { data: tenant, isLoading: isLoadingTenant, error: tenantError } = useQuery<TenantDetails, Error>({
    queryKey: ['tenantDetails', tenantId],
    queryFn: () => fetchTenantDetails(tenantId!),
    enabled: !!tenantId && !!student?.tenant_id,
  });

  const { data: grades, isLoading: isLoadingGrades, error: gradesError } = useQuery<Grade[], Error>({
    queryKey: ['studentGrades', studentId],
    queryFn: () => fetchGrades(studentId!),
    enabled: !!studentId,
  });

  const handlePrint = () => {
    window.print();
  };

  const isLoading = isLoadingStudent || isLoadingTenant || isLoadingGrades;
  const error = studentError || tenantError || gradesError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl text-destructive">Erro ao Carregar Dados</h1>
        <p className="text-muted-foreground">Verifique se o aluno e a escola estão corretamente cadastrados. Erro: {error.message}</p>
        <Button asChild variant="link" className="mt-4 print-hidden">
          <Link to="/secretaria/documents">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Link>
        </Button>
      </div>
    );
  }

  if (!student || !tenant) {
    return <div className="text-destructive p-8">Aluno ou escola não encontrados.</div>;
  }

  // Agrupar notas por período e disciplina para exibição
  const groupedGrades = grades?.reduce((acc, grade) => {
    if (!acc[grade.period]) {
      acc[grade.period] = {};
    }
    if (!acc[grade.period][grade.subject_name]) {
      acc[grade.period][grade.subject_name] = [];
    }
    acc[grade.period][grade.subject_name].push(grade);
    return acc;
  }, {} as Record<string, Record<string, Grade[]>>);

  // Acessando os nomes dos cursos diretamente da estrutura aninhada
  const courseNames = student.classes?.class_courses
    .map(cc => cc.courses?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 shadow-lg print:shadow-none print:p-0" ref={printRef}>
      
      {/* Botões de Ação (Ocultos na Impressão) */}
      <div className="flex justify-between items-center mb-6 print-hidden">
        <Button variant="outline" asChild>
          <Link to="/secretaria/documents">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Link>
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir Boletim
        </Button>
      </div>

      {/* Cabeçalho do Documento */}
      <div className="text-center mb-8 border-b pb-4">
        {tenant.config?.logo_url && (
          <img src={tenant.config.logo_url} alt="Logo da Escola" className="h-16 mx-auto mb-3" />
        )}
        <h1 className="text-2xl font-bold text-primary">{tenant.name}</h1>
        <p className="text-sm text-muted-foreground">Boletim Escolar</p>
      </div>

      {/* Dados do Aluno */}
      <Card className="mb-6 border-dashed">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-accent" />
            {student.full_name}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Nome:</span> {student.full_name}
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Turma:</span> {student.classes?.name || 'N/A'}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Nascimento:</span> {format(new Date(student.birth_date), 'dd/MM/yyyy', { locale: ptBR })}
          </div>
          <div className="flex items-center gap-2">
            <School className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Série/Ano:</span> 
            <div className="flex flex-wrap gap-1">
              {courseNames || 'N/A'}
            </div>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <span className="font-semibold">Matrícula:</span> {student.registration_code}
          </div>
        </CardContent>
      </Card>

      {/* Seção de Notas e Histórico */}
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-primary" />
        Notas por Período
      </h2>
      
      {grades && grades.length > 0 ? (
        Object.entries(groupedGrades || {}).map(([period, subjects]) => (
          <div key={period} className="mb-8 break-inside-avoid">
            <h3 className="text-lg font-semibold mb-3 p-2 bg-muted rounded-md">{period}</h3>
            
            {Object.entries(subjects).map(([subjectName, subjectGrades]) => (
              <div key={subjectName} className="mb-4 border p-3 rounded-md">
                <h4 className="font-medium text-primary mb-2">{subjectName}</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Avaliação</TableHead>
                      <TableHead className="text-right">Nota</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectGrades.map((grade, index) => (
                      <TableRow key={index}>
                        <TableCell>{grade.assessment_type}</TableCell>
                        <TableCell className="text-right font-bold">{grade.grade_value.toFixed(1)}</TableCell>
                        <TableCell>{format(new Date(grade.date_recorded), 'dd/MM/yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        ))
      ) : (
        <p className="text-center py-8 text-muted-foreground">Nenhuma nota registrada para este aluno ainda.</p>
      )}

      {/* Rodapé do Documento (para impressão) */}
      <div className="mt-12 pt-4 border-t text-center text-xs text-muted-foreground print:mt-4">
        <p>Documento gerado pelo sistema Davi EDU em {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}.</p>
        <p>Validade sujeita à conferência da Secretaria Escolar.</p>
      </div>
    </div>
  );
};

export default ReportCard;