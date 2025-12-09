import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle, ShieldCheck, School, User, Calendar, BookOpen, GraduationCap, ClipboardList, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Tipos de Dados ---
interface GuardianDetails {
  full_name: string;
  relationship: string;
  phone: string | null;
  email: string | null;
}

interface StudentDetails {
  id: string;
  full_name: string;
  registration_code: string;
  birth_date: string;
  tenant_id: string;
  class_id: string | null;
  course_id: string | null;
  created_at: string;
  gender: 'Masculino' | 'Feminino' | 'Outro' | null;
  nationality: string | null;
  naturality: string | null;
  cpf: string | null;
  rg: string | null;
  phone: string | null;
  email: string | null;
  classes: { 
    id: string;
    name: string; 
    school_year: number; 
  } | null;
  courses: { name: string } | null;
  guardians: GuardianDetails[];
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
  authorization_act: string | null;
}

interface TenantDetails {
  name: string;
  config: TenantConfig | null;
}

interface ProcessedSubjectGrade {
  subject_name: string;
  unit_grades: { [periodName: string]: number | null };
  total_units_grade: number | null;
  final_average: number | null;
  absences: number | null;
  result: 'Aprovado' | 'Reprovado' | 'Recuperação' | 'N/A';
}

interface AcademicSummary {
    subjects: ProcessedSubjectGrade[];
    periods: string[];
}

interface VerificationData {
  success: boolean;
  student: StudentDetails;
  tenant: TenantDetails;
  academicSummary: AcademicSummary; // Usando o resumo pré-calculado
  documentId: string;
}

const fetchVerifiedDocument = async (token: string): Promise<VerificationData> => {
  const { data, error } = await supabase.functions.invoke('verify-document', {
    body: JSON.stringify({ token }),
  });
  if (error) throw new Error(error.message);
  // @ts-ignore
  if (data.error) throw new Error(data.error);
  return data as VerificationData;
};

const VerifyDocumentPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery<VerificationData, Error>({
    queryKey: ['verifiedDocument', token],
    queryFn: () => fetchVerifiedDocument(token!),
    enabled: !!token,
    retry: false,
  });

  const student = data?.student;
  const tenant = data?.tenant;
  const academicSummary = data?.academicSummary;

  const processedGrades = academicSummary?.subjects || [];
  
  // Ordenar os períodos para o cabeçalho da tabela
  const sortedPeriods = useMemo(() => {
    const periods = academicSummary?.periods || [];
    return periods.sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      return numA - numB;
    });
  }, [academicSummary]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data?.success || !student || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-destructive">
              <XCircle className="h-8 w-8" /> Documento Inválido
            </CardTitle>
            <CardDescription>
              O token de verificação é inválido, expirou ou o documento não foi encontrado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Por favor, verifique o link ou entre em contato com a escola emissora.
            </p>
            <Button asChild>
              <Link to="/">Voltar à Página Inicial</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const studentCourseName = student.courses?.name || 'N/A';
  const primaryGuardian = student.guardians.find(g => g.relationship === 'Pai' || g.relationship === 'Mãe' || g.relationship === 'Tutor') || student.guardians[0];

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
    <div className="max-w-4xl mx-auto bg-white p-6 shadow-lg">
      <div className="text-center mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-2" />
        <h2 className="text-xl font-bold text-green-700">Documento Autêntico Verificado!</h2>
        <p className="text-sm text-green-600">Este documento é oficial e foi emitido por {tenant.name}.</p>
      </div>

      {/* Cabeçalho do Documento */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div className="text-left space-y-1">
          <h1 className="text-2xl font-bold text-primary">{tenant.name}</h1>
          <p className="text-sm text-muted-foreground">HISTÓRICO ESCOLAR DO ALUNO</p>
          <div className="mt-2 text-xs text-muted-foreground space-y-1">
            {schoolConfig?.cnpj && <p>CNPJ: {schoolConfig.cnpj}</p>}
            {schoolConfig?.phone && <p>Telefone: {schoolConfig.phone}</p>}
            {fullAddress && <p>Endereço: {fullAddress}</p>}
            {schoolConfig?.authorization_act && <p>Ato de Criação/Autorização: {schoolConfig.authorization_act}</p>}
          </div>
        </div>
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
          {student.cpf && (
            <div className="flex items-center gap-2">
              <span className="font-semibold">CPF:</span> {student.cpf}
            </div>
          )}
          {student.rg && (
            <div className="flex items-center gap-2">
              <span className="font-semibold">RG:</span> {student.rg}
            </div>
          )}
          {student.gender && (
            <div className="flex items-center gap-2">
              <span className="font-semibold">Gênero:</span> {student.gender}
            </div>
          )}
          {student.nationality && (
            <div className="flex items-center gap-2">
              <span className="font-semibold">Nacionalidade:</span> {student.nationality}
            </div>
          )}
          {student.naturality && (
            <div className="flex items-center gap-2">
              <span className="font-semibold">Naturalidade:</span> {student.naturality}
            </div>
          )}
          {primaryGuardian && (
            <div className="col-span-2">
              <Separator className="my-2" />
              <p className="font-semibold">Responsável Principal:</p>
              <p>{primaryGuardian.full_name} ({primaryGuardian.relationship})</p>
              {primaryGuardian.phone && <p>Telefone: {primaryGuardian.phone}</p>}
              {primaryGuardian.email && <p>Email: {primaryGuardian.email}</p>}
            </div>
          )}
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

      {/* Rodapé do Documento */}
      <div className="mt-12 pt-4 border-t text-center text-xs text-muted-foreground">
        <p>Documento verificado pelo sistema Davi EDU em {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}.</p>
        <p>Este documento é uma representação autêntica do histórico escolar do aluno.</p>
      </div>
    </div>
  );
};

export default VerifyDocumentPage;