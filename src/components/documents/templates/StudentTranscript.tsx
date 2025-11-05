import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Printer, ArrowLeft, School, User, Calendar, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudentDetails {
  full_name: string;
  registration_code: string;
  birth_date: string;
  gender: string | null;
  classes: { name: string; school_year: number; courses: { name: string } | null } | null;
}

interface TenantDetails {
  name: string;
  config: { logo_url: string | null } | null;
}

interface Grade {
  subject_name: string;
  grade_value: number;
  assessment_type: string;
  period: string;
}

// Mock de dados de notas (será substituído pela busca real na tabela 'grades')
const mockGrades: Grade[] = [
  { subject_name: 'Matemática', grade_value: 8.5, assessment_type: 'Média Final', period: '2024' },
  { subject_name: 'Português', grade_value: 9.2, assessment_type: 'Média Final', period: '2024' },
  { subject_name: 'História', grade_value: 7.8, assessment_type: 'Média Final', period: '2024' },
];

const fetchStudentData = async (studentId: string) => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      full_name, 
      registration_code, 
      birth_date, 
      gender,
      classes (
        name, 
        school_year,
        courses (name)
      )
    `)
    .eq('id', studentId)
    .single();
  if (error) throw new Error(error.message);
  return data as StudentDetails;
};

const fetchTenantData = async (tenantId: string) => {
  const { data, error } = await supabase
    .from('tenants')
    .select('name, config')
    .eq('id', tenantId)
    .single();
  if (error) throw new Error(error.message);
  return data as TenantDetails;
};

const StudentTranscript: React.FC = () => {
  const { entityId: studentId } = useParams<{ entityId: string }>();
  const tenantId = supabase.auth.getSession()?.user?.user_metadata.tenant_id; // Assumindo que o tenantId está no metadata da sessão

  const { data: student, isLoading: isLoadingStudent, error: studentError } = useQuery({
    queryKey: ['studentDetails', studentId],
    queryFn: () => fetchStudentData(studentId!),
    enabled: !!studentId,
  });

  const { data: tenant, isLoading: isLoadingTenant, error: tenantError } = useQuery({
    queryKey: ['tenantDetails', tenantId],
    queryFn: () => fetchTenantData(tenantId!),
    enabled: !!tenantId,
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoadingStudent || isLoadingTenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (studentError || tenantError || !student || !tenant) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl text-destructive">Erro ao Carregar Dados</h1>
        <p className="text-muted-foreground">Verifique se o aluno e a escola estão corretamente cadastrados.</p>
        <Button asChild variant="link" className="mt-4 print-hidden">
          <a href="/documents">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg print:shadow-none print:p-0">
      
      {/* Botões de Ação (Ocultos na Impressão) */}
      <div className="flex justify-between items-center mb-6 print-hidden">
        <Button asChild variant="outline">
          <a href="/documents">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </a>
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir Documento
        </Button>
      </div>

      {/* Cabeçalho do Documento */}
      <div className="flex justify-between items-center border-b-2 border-primary pb-4 mb-6">
        <div className="flex items-center gap-4">
          {tenant.config?.logo_url && (
            <img src={tenant.config.logo_url} alt="Logo da Escola" className="h-16 w-auto object-contain" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-primary">{tenant.name}</h1>
            <p className="text-sm text-muted-foreground">Histórico Escolar Oficial</p>
          </div>
        </div>
        <div className="text-right text-sm">
          <p>Data de Emissão: {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}</p>
          <p>Ano Letivo: {student.classes?.school_year || 'N/A'}</p>
        </div>
      </div>

      {/* Dados do Aluno */}
      <Card className="mb-6 border-dashed print:border-solid">
        <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
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
            <span className="font-semibold">Curso/Série:</span> {student.classes?.courses?.name || 'N/A'}
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <span className="font-semibold">Matrícula:</span> {student.registration_code}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Notas (Histórico) */}
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">Registro de Notas</h2>
      <Table className="border">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Disciplina</TableHead>
            <TableHead>Tipo de Avaliação</TableHead>
            <TableHead className="text-right">Nota</TableHead>
            <TableHead className="text-right">Período</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockGrades.map((grade, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{grade.subject_name}</TableCell>
              <TableCell>{grade.assessment_type}</TableCell>
              <TableCell className="text-right font-bold">{grade.grade_value.toFixed(1)}</TableCell>
              <TableCell className="text-right">{grade.period}</TableCell>
            </TableRow>
          ))}
          {mockGrades.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                Nenhuma nota registrada para este aluno.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Rodapé para Assinaturas (Apenas na Impressão) */}
      <div className="mt-16 pt-8 border-t border-dashed print:border-solid print:border-gray-400 print-only">
        <div className="flex justify-around text-sm">
          <div className="text-center">
            <Separator className="w-48 mx-auto mb-2" />
            <p>Assinatura do Diretor(a)</p>
          </div>
          <div className="text-center">
            <Separator className="w-48 mx-auto mb-2" />
            <p>Assinatura do Secretário(a)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTranscript;