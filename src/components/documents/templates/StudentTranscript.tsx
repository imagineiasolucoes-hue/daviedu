import React, { useRef, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Printer, ArrowLeft, School, User, Calendar, BookOpen, GraduationCap, ClipboardList, QrCode, Link as LinkIcon, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProfile } from '@/hooks/useProfile';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

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
  pix_key: string | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
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
      gender,
      nationality,
      naturality,
      cpf,
      rg,
      phone,
      email,
      classes (
        id,
        name, 
        school_year
      ),
      courses (name),
      student_guardians (
        guardians (
          full_name,
          relationship,
          phone,
          email
        )
      )
    `)
    .eq('id', studentId)
    .single();
  if (error) throw new Error(error.message);
  
  const student = data as unknown as StudentDetails;
  student.guardians = (student as any).student_guardians?.map((sg: any) => sg.guardians).filter(Boolean) || [];
  delete (student as any).student_guardians; 
  return student;
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

const fetchAcademicSummary = async (studentId: string): Promise<AcademicSummary> => {
    const { data, error } = await supabase.rpc(
        'calculate_student_academic_summary', 
        { p_student_id: studentId }
    );
    if (error) throw new Error(error.message);
    return data as AcademicSummary;
};

const StudentTranscript: React.FC = () => {
  const { entityId: studentId } = useParams<{ entityId: string }>();
  const { profile } = useProfile();
  const tenantId = profile?.tenant_id;
  const printRef = useRef<HTMLDivElement>(null);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);

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

  const { data: academicSummary, isLoading: isLoadingSummary, error: summaryError } = useQuery<AcademicSummary, Error>({
    queryKey: ['academicSummary', studentId],
    queryFn: () => fetchAcademicSummary(studentId!),
    enabled: !!studentId,
  });

  const generateTokenMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-document-token', {
        body: JSON.stringify({ document_id: documentId }),
      });
      if (error) throw new Error(error.message);
      // @ts-ignore
      if (data.error) throw new Error(data.error);
      // @ts-ignore
      return data.token as string;
    },
    onSuccess: (token) => {
      setVerificationLink(`${window.location.origin}/verify-document/${token}`);
      toast.success("Link de verificação gerado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar link de verificação", { description: error.message });
    },
  });

  const handleGenerateVerificationLink = async () => {
    if (!studentId) {
      toast.error("Erro", { description: "ID do aluno não encontrado para gerar o documento." });
      return;
    }

    const { data: existingDoc, error: docError } = await supabase
      .from('documents')
      .select('id')
      .eq('related_entity_id', studentId)
      .eq('document_type', 'transcript')
      .maybeSingle();

    let documentIdToUse = existingDoc?.id;

    if (!documentIdToUse) {
      const { data: newDoc, error: insertDocError } = await supabase
        .from('documents')
        .insert({
          tenant_id: tenantId,
          document_type: 'transcript',
          related_entity_id: studentId,
          file_url: 'generated_on_demand',
          description: `Histórico Escolar de ${student?.full_name || 'Aluno'}`,
          metadata: { generatedBy: profile?.id, studentName: student?.full_name },
        })
        .select('id')
        .single();

      if (insertDocError) {
        toast.error("Erro ao criar registro do documento", { description: insertDocError.message });
        return;
      }
      documentIdToUse = newDoc.id;
    }

    if (documentIdToUse) {
      generateTokenMutation.mutate(documentIdToUse);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isLoading = isLoadingStudent || isLoadingTenant || isLoadingSummary;
  const error = studentError || tenantError || summaryError;

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
  
  const processedGrades = academicSummary?.subjects || [];
  const sortedPeriods = academicSummary?.periods.sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      return numA - numB;
  }) || [];


  return (
    <div className="max-w-4xl mx-auto bg-white p-6 shadow-lg print:shadow-none print:p-0 print:w-full print:max-w-none print:mx-0" ref={printRef}>
      
      {/* Botões de Ação (Ocultos na Impressão) */}
      <div className="flex justify-between items-center mb-6 print-hidden">
        <Button variant="outline" asChild>
          <Link to="/documents">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerateVerificationLink} 
            disabled={generateTokenMutation.isPending}
            variant="secondary"
          >
            {generateTokenMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LinkIcon className="mr-2 h-4 w-4" />
            )}
            Gerar Link de Verificação
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir Histórico
          </Button>
        </div>
      </div>

      {/* Cabeçalho do Documento (Agora igual ao Boletim) */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        {/* Informações da Escola (Esquerda) */}
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
        <CardContent className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm print:text-xs">
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
            <div className="col-span-2 text-xs space-y-0.5">
              <Separator className="my-1" />
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
                <TableHead className="min-w-[120px] text-left text-xs py-1 px-2 print:min-w-[100px] print:text-[10px] print:py-0.5 print:px-1">Disciplina</TableHead>
                {sortedPeriods.map(period => (
                  <TableHead key={period} className="text-center min-w-[60px] text-xs py-1 px-2 print:min-w-[40px] print:text-[10px] print:py-0.5 print:px-1">{period}</TableHead>
                ))}
                <TableHead className="text-center min-w-[70px] text-xs py-1 px-2 print:min-w-[50px] print:text-[10px] print:py-0.5 print:px-1">Total</TableHead>
                <TableHead className="text-center min-w-[90px] text-xs py-1 px-2 print:min-w-[60px] print:text-[10px] print:py-0.5 print:px-1">Média Final</TableHead>
                <TableHead className="text-center min-w-[60px] text-xs py-1 px-2 print:min-w-[40px] print:text-[10px] print:py-0.5 print:px-1">Faltas</TableHead>
                <TableHead className="text-center min-w-[90px] text-xs py-1 px-2 print:min-w-[60px] print:text-[10px] print:py-0.5 print:px-1">Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedGrades.map((subject) => (
                <TableRow key={subject.subject_name} className="page-break-inside-avoid">
                  <TableCell className="font-medium text-xs py-1 px-2 print:text-[10px] print:py-0.5 print:px-1">{subject.subject_name}</TableCell>
                  {sortedPeriods.map(period => (
                    <TableCell key={`${subject.subject_name}-${period}`} className="text-center text-xs py-1 px-2 print:text-[10px] print:py-0.5 print:px-1">
                      {subject.unit_grades[period] !== null ? subject.unit_grades[period]?.toFixed(1) : 'N/A'}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold text-xs py-1 px-2 print:text-[10px] print:py-0.5 print:px-1">
                    {subject.total_units_grade !== null ? subject.total_units_grade.toFixed(1) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-center font-bold text-xs py-1 px-2 print:text-[10px] print:py-0.5 print:px-1">
                    {subject.final_average !== null ? subject.final_average.toFixed(1) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-center text-xs py-1 px-2 print:text-[10px] print:py-0.5 print:px-1">
                    {subject.absences !== null ? subject.absences : 'N/A'}
                  </TableCell>
                  <TableCell className="text-center text-xs py-1 px-2 print:text-[10px] print:py-0.5 print:px-1">
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
          <li>As notas por período são a última nota registrada para o período correspondente.</li>
          <li>A coluna "Faltas" é um placeholder.</li>
          <li>A regra de "Resultado" é calculada pelo servidor (Média Final &gt;= 7: Aprovado; &gt;= 5: Recuperação; &lt; 5: Reprovado).</li>
        </ul>
      </div>

      {/* Seção de Verificação (Visível na Impressão) */}
      {verificationLink && (
        <div className="mt-12 pt-4 border-t border-dashed flex flex-col items-center justify-center gap-4 text-center print:mt-4 print:pt-2 print:border-t-0 print:border-b print:pb-2">
          <h3 className="text-lg font-semibold flex items-center gap-2 print:text-base">
            <CheckCircle className="h-5 w-5 text-green-600 print:h-4 print:w-4" />
            Verificação de Autenticidade
          </h3>
          <p className="text-sm text-muted-foreground print:text-xs">
            Escaneie o QR Code ou acesse o link para verificar a autenticidade deste documento.
          </p>
          <div className="p-2 border rounded-md bg-white print:p-1 print:border-0">
            <QRCodeSVG value={verificationLink} size={100} />
          </div>
          <p className="text-xs text-muted-foreground break-all print:text-[10px]">
            {verificationLink}
          </p>
        </div>
      )}

      {/* Rodapé do Documento (para impressão) */}
      <div className="mt-12 pt-4 border-t text-center text-xs text-muted-foreground print:mt-4">
        <p>Documento gerado pelo sistema Davi EDU em {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}.</p>
        <p>Validade sujeita à conferência da Secretaria Escolar.</p>
      </div>
    </div>
  );
};

export default StudentTranscript;