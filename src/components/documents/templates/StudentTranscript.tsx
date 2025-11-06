import React, { useRef, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge'; // Adicionado Badge

// --- Tipos de Dados ---
interface StudentDetails {
  id: string;
  full_name: string;
  registration_code: string;
  birth_date: string;
  tenant_id: string;
  class_id: string | null; // Adicionado class_id
  course_id: string | null; // Adicionado course_id
  classes: { 
    id: string; // Adicionado ID da classe para buscar cursos
    name: string; 
    school_year: number; 
  } | null;
  courses: { name: string } | null; // Adicionado para buscar o nome do curso diretamente
}

interface TenantConfig {
  cnpj: string | null;
  phone: string | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip_code: string | null;
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

interface ProcessedSubjectGrade {
  subject_name: string;
  unit_grades: { [periodName: string]: number | null }; // Ex: { "1ª Unidade": 8.5, "2ª Unidade": 7.0 }
  total_units_grade: number | null; // Soma das médias das unidades
  final_average: number | null; // Média das unidades
  absences: number | null; // Placeholder para faltas
  result: 'Aprovado' | 'Reprovado' | 'Recuperação' | 'N/A';
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
      class_id,
      course_id,
      created_at, 
      classes (
        id,
        name, 
        school_year
      ),
      courses (name)
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

const StudentTranscript: React.FC = () => {
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

  // Processar as notas para o formato do boletim
  const processedGrades = useMemo(() => {
    if (!grades || grades.length === 0) return [];

    const subjectsMap = new Map<string, ProcessedSubjectGrade>();
    const allPeriods = new Set<string>(); // Para coletar todos os períodos existentes

    grades.forEach(grade => {
      if (!subjectsMap.has(grade.subject_name)) {
        subjectsMap.set(grade.subject_name, {
          subject_name: grade.subject_name,
          unit_grades: {},
          total_units_grade: null,
          final_average: null,
          absences: 0, // Placeholder
          result: 'N/A',
        });
      }
      const subject = subjectsMap.get(grade.subject_name)!;

      // Agrupar notas por período e calcular a média para cada período
      if (!subject.unit_grades[grade.period]) {
        subject.unit_grades[grade.period] = grade.grade_value; // Para simplificar, pegamos a última nota
      } else {
        // Se houver múltiplas notas para o mesmo período, podemos calcular uma média aqui
        // Por simplicidade, vamos sobrescrever com a última nota para o mesmo período/tipo de avaliação
        subject.unit_grades[grade.period] = grade.grade_value;
      }
      allPeriods.add(grade.period);
    });

    // Converter para array e calcular totais e médias
    const result: ProcessedSubjectGrade[] = Array.from(subjectsMap.values()).map(subject => {
      const validUnitGrades = Object.values(subject.unit_grades).filter(g => g !== null) as number[];
      
      if (validUnitGrades.length > 0) {
        subject.total_units_grade = validUnitGrades.reduce((sum, g) => sum + g, 0);
        subject.final_average = subject.total_units_grade / validUnitGrades.length;
        
        if (subject.final_average >= 7) { // Exemplo de regra de aprovação
          subject.result = 'Aprovado';
        } else if (subject.final_average >= 5) { // Exemplo de regra de recuperação
          subject.result = 'Recuperação';
        } else {
          subject.result = 'Reprovado';
        }
      } else {
        subject.result = 'N/A';
      }
      return subject;
    });

    return result;
  }, [grades]);

  // Ordenar os períodos para o cabeçalho da tabela (ex: 1ª Unidade, 2ª Unidade)
  const sortedPeriods = useMemo(() => {
    const periods = Array.from(new Set(grades?.map(g => g.period) || []));
    // Tenta ordenar numericamente se os nomes dos períodos forem "1ª Unidade", "2º Bimestre", etc.
    return periods.sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      return numA - numB;
    });
  }, [grades]);


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
          <Link to="/documents">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Link>
        </Button>
      </div>
    );
  }

  if (!student || !tenant) {
    return <div className="text-destructive p-8">Aluno ou escola não encontrados.</div>;
  }

  // Acessando o nome do curso diretamente da relação 'courses' do aluno
  const studentCourseName = student.courses?.name || 'N/A';

  const schoolConfig = tenant.config;
  const fullAddress = [
    schoolConfig?.address_street,
    schoolConfig?.address_number ? `, ${schoolConfig.address_number}` : '',
    schoolConfig?.address_neighborhood ? ` - ${schoolConfig.address_neighborhood}` : '',
    schoolConfig?.address_city,
    schoolConfig?.address_state,
    schoolConfig?.address_zip_code ? ` - CEP: ${schoolConfig.address_zip_code}` : '',
  ].filter(Boolean).join('');

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 shadow-lg print:shadow-none print:p-0" ref={printRef}>
      
      {/* Botões de Ação (Ocultos na Impressão) */}
      <div className="flex justify-between items-center mb-6 print-hidden">
        <Button variant="outline" asChild>
          <Link to="/documents">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Link>
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir Histórico
        </Button>
      </div>

      {/* Cabeçalho do Documento (Agora igual ao Boletim) */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        {/* Informações da Escola (Esquerda) */}
        <div className="text-left space-y-1">
          <h1 className="text-2xl font-bold text-primary">{tenant.name}</h1>
          <p className="text-sm text-muted-foreground">HISTÓRICO ESCOLAR DO ALUNO</p> {/* Título específico */}
          <div className="mt-2 text-xs text-muted-foreground space-y-1">
            {schoolConfig?.cnpj && <p>CNPJ: {schoolConfig.cnpj}</p>}
            {schoolConfig?.phone && <p>Telefone: {schoolConfig.phone}</p>}
            {fullAddress && <p>Endereço: {fullAddress}</p>}
          </div>
        </div>

        {/* Logo da Escola (Direita) */}
        {tenant.config?.logo_url && (
          <img src={tenant.config.logo_url} alt="Logo da Escola" className="h-32 w-auto object-contain" />
        )}
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
              {studentCourseName}
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
        Registro Acadêmico
      </h2>
      
      {processedGrades && processedGrades.length > 0 ? (
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Disciplina</TableHead>
                {sortedPeriods.map(period => (
                  <TableHead key={period} className="text-center min-w-[80px]">{period}</TableHead>
                ))}
                <TableHead className="text-center min-w-[80px]">Total</TableHead>
                <TableHead className="text-center min-w-[100px]">Média Final</TableHead>
                <TableHead className="text-center min-w-[80px]">Faltas</TableHead>
                <TableHead className="text-center min-w-[100px]">Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedGrades.map((subject) => (
                <TableRow key={subject.subject_name}>
                  <TableCell className="font-medium">{subject.subject_name}</TableCell>
                  {sortedPeriods.map(period => (
                    <TableCell key={`${subject.subject_name}-${period}`} className="text-center">
                      {subject.unit_grades[period] !== null ? subject.unit_grades[period]?.toFixed(1) : 'N/A'}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold">
                    {subject.total_units_grade !== null ? subject.total_units_grade.toFixed(1) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-center font-bold">
                    {subject.final_average !== null ? subject.final_average.toFixed(1) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-center">
                    {subject.absences !== null ? subject.absences : 'N/A'}
                  </TableCell>
                  <TableCell className="text-center">
                    {subject.result === 'Aprovado' && <span className="text-green-600 font-semibold">Aprovado</span>}
                    {subject.result === 'Reprovado' && <span className="text-red-600 font-semibold">Reprovado</span>}
                    {subject.result === 'Recuperação' && <span className="text-yellow-600 font-semibold">Recup.</span>}
                    {subject.result === 'N/A' && 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-center py-8 text-muted-foreground">Nenhuma nota registrada para este aluno ainda.</p>
      )}

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md text-sm text-blue-800 dark:text-blue-200 print-hidden">
        <p className="font-semibold">Atenção:</p>
        <ul className="list-disc list-inside ml-2">
          <li>As colunas de "Unidade" são preenchidas com a última nota registrada para o período correspondente. Para um cálculo de média mais preciso por unidade, seria necessário um sistema de pesos ou múltiplas avaliações por período.</li>
          <li>A coluna "Faltas" é um placeholder. A funcionalidade de registro de faltas não está implementada no sistema atual e exigiria uma extensão no banco de dados.</li>
          <li>A regra de "Resultado" é um exemplo (Média Final &gt;= 7: Aprovado; &gt;= 5: Recuperação; &lt; 5: Reprovado).</li>
        </ul>
      </div>

      {/* Rodapé do Documento (para impressão) */}
      <div className="mt-12 pt-4 border-t text-center text-xs text-muted-foreground print:mt-4">
        <p>Documento gerado pelo sistema Davi EDU em {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}.</p>
        <p>Validade sujeita à conferência da Secretaria Escolar.</p>
      </div>
    </div>
  );
};

export default StudentTranscript;