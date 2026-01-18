import React, { useRef, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Printer, ArrowLeft, School, User, Calendar, BookOpen, GraduationCap, FileText, CheckCircle, Link as LinkIcon, Signature } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

// --- Tipos de Dados ---
interface GuardianDetails {
  id: string;
  full_name: string;
  relationship: string;
  phone: string | null;
  email: string | null;
  cpf: string | null;
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
  user_id: string | null;
  classes: { name: string; school_year: number } | null;
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

interface ContractTemplate {
  id: string;
  name: string;
  content: string;
  is_active: boolean;
}

interface DocumentDetails {
  id: string;
  status: 'pending' | 'signed';
  signed_at: string | null;
  signed_by_guardian_id: string | null;
  guardians?: {
    full_name: string;
    cpf: string | null;
  } | null;
  school_signed_at: string | null; // NOVO: Data da assinatura da escola
  school_signed_by_profile_id: string | null; // NOVO: ID do perfil que assinou pela escola
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
      user_id,
      classes (
        name, 
        school_year
      ),
      courses (name),
      student_guardians (
        guardians (
          id,
          full_name,
          relationship,
          phone,
          email,
          cpf
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

const fetchActiveTemplate = async (tenantId: string): Promise<ContractTemplate | null> => {
  const { data, error } = await supabase
    .from('contract_templates')
    .select('id, name, content, is_active')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
};

const fetchDocumentStatus = async (studentId: string): Promise<DocumentDetails | null> => {
    const { data, error } = await supabase
        .from('documents')
        .select(`
          id, 
          status, 
          signed_at, 
          signed_by_guardian_id,
          school_signed_at,
          school_signed_by_profile_id,
          guardians (full_name, cpf)
        `)
        .eq('related_entity_id', studentId)
        .eq('document_type', 'contract')
        .maybeSingle();
    
    if (error) throw new Error(error.message);
    return data as unknown as DocumentDetails;
};

const StudentContract: React.FC = () => {
  const { entityId: studentId } = useParams<{ entityId: string }>();
  const { profile, isAdmin, isSecretary } = useProfile();
  const { user } = useAuth();
  const tenantId = profile?.tenant_id;
  const printRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
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

  const { data: template, isLoading: isLoadingTemplate, error: templateError } = useQuery<ContractTemplate | null, Error>({
    queryKey: ['activeContractTemplate', tenantId],
    queryFn: () => fetchActiveTemplate(tenantId!),
    enabled: !!tenantId,
  });

  const { data: documentStatus, isLoading: isLoadingDocumentStatus, refetch: refetchDocumentStatus } = useQuery<DocumentDetails | null, Error>({
    queryKey: ['documentStatus', studentId],
    queryFn: () => fetchDocumentStatus(studentId!),
    enabled: !!studentId,
  });

  // Helper function to ensure document exists and return its ID
  const ensureDocumentExists = async (): Promise<string | null> => {
    if (!studentId || !tenantId || !student) {
      toast.error("Erro", { description: "Dados do aluno ou da escola ausentes para criar o documento." });
      return null;
    }

    if (documentStatus?.id) {
      return documentStatus.id;
    }

    // If no documentStatus.id, try to create one
    const { data: newDoc, error: insertDocError } = await supabase
      .from('documents')
      .insert({
        tenant_id: tenantId,
        document_type: 'contract',
        related_entity_id: studentId,
        file_url: 'generated_on_demand', 
        description: `Contrato de Matrícula de ${student?.full_name || 'Aluno'}`,
        metadata: { generatedBy: profile?.id, studentName: student?.full_name },
      })
      .select('id')
      .single();

    if (insertDocError) {
      toast.error("Erro ao criar registro do documento", { description: insertDocError.message });
      return null;
    }
    // After creation, refetch document status to update the UI and cache
    await refetchDocumentStatus();
    return newDoc.id;
  };

  // Nova mutação para a assinatura da escola
  const signSchoolContractMutation = useMutation({
    mutationFn: async (document_id: string) => {
      if (!tenantId || !studentId) throw new Error("Dados ausentes.");
      
      const { error } = await supabase.functions.invoke('sign-school-contract', {
        body: JSON.stringify({ 
          document_id: document_id, 
          tenant_id: tenantId, 
          student_id: studentId,
        }),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Contrato assinado pela escola com sucesso!");
      refetchDocumentStatus();
      queryClient.invalidateQueries({ queryKey: ['documents', tenantId] });
    },
    onError: (error) => {
      toast.error("Erro ao Assinar Contrato pela Escola", { description: error.message });
    },
  });

  const signContractMutation = useMutation({
    mutationFn: async (payload: { document_id: string, guardian_id: string }) => {
      if (!tenantId || !studentId) throw new Error("Dados ausentes.");
      
      const { error } = await supabase.functions.invoke('sign-contract', {
        body: JSON.stringify({ 
          document_id: payload.document_id, 
          tenant_id: tenantId, 
          student_id: studentId,
          guardian_id: payload.guardian_id,
        }),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Contrato assinado digitalmente com sucesso!");
      refetchDocumentStatus();
      queryClient.invalidateQueries({ queryKey: ['documents', tenantId] });
    },
    onError: (error) => {
      toast.error("Erro ao Assinar Contrato", { description: error.message });
    },
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
    const docId = await ensureDocumentExists();
    if (docId) {
      generateTokenMutation.mutate(docId);
    }
  };

  const handleSignSchoolContract = async () => {
    const docId = await ensureDocumentExists();
    if (docId) {
      signSchoolContractMutation.mutate(docId);
    } else {
      toast.error("Erro", { description: "Não foi possível criar ou encontrar o registro do contrato para assinatura da escola." });
    }
  };

  const handleSignContract = async () => {
    const primaryGuardian = student?.guardians.find(g => g.relationship === 'Pai' || g.relationship === 'Mãe' || g.relationship === 'Tutor') || student?.guardians[0];
    
    if (!primaryGuardian?.id) {
        toast.error("Erro", { description: "Nenhum responsável principal encontrado para assinar o contrato." });
        return;
    }

    const docId = await ensureDocumentExists(); // Ensure document exists and get its ID

    if (docId) {
        signContractMutation.mutate({ document_id: docId, guardian_id: primaryGuardian.id });
    } else {
        toast.error("Erro", { description: "Não foi possível criar ou encontrar o registro do contrato para assinatura." });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isLoading = isLoadingStudent || isLoadingTenant || isLoadingTemplate || isLoadingDocumentStatus;
  const error = studentError || tenantError || templateError;

  // --- Processamento do Template ---
  const processedContent = useMemo(() => {
    if (!template || !student || !tenant) return null;

    const primaryGuardian = student.guardians.find(g => g.relationship === 'Pai' || g.relationship === 'Mãe' || g.relationship === 'Tutor') || student.guardians[0];
    const monthlyFeeValue = formatCurrency(500.00); // Mock de valor de mensalidade

    let content = template.content;

    const replacements: { [key: string]: string } = {
      '{{school_name}}': tenant.name,
      '{{student_name}}': student.full_name,
      '{{student_registration_code}}': student.registration_code,
      '{{student_birth_date}}': format(new Date(student.birth_date), 'dd/MM/yyyy', { locale: ptBR }),
      '{{class_name}}': student.classes?.name || 'N/A',
      '{{course_name}}': student.courses?.name || 'N/A',
      '{{guardian_name}}': primaryGuardian?.full_name || 'N/A',
      '{{guardian_cpf}}': primaryGuardian?.cpf || 'N/A',
      '{{current_date}}': format(new Date(), 'dd/MM/yyyy', { locale: ptBR }),
      '{{monthly_fee_value}}': monthlyFeeValue,
    };

    Object.keys(replacements).forEach(key => {
      const value = replacements[key];
      content = content.replace(new RegExp(key, 'g'), value);
    });

    // Converte quebras de linha para tags <br> para renderização HTML
    return content.split('\n').map((line, index) => (
        <React.Fragment key={index}>
            {line}
            <br />
        </React.Fragment>
    ));
  }, [template, student, tenant]);

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
        <p className="text-muted-foreground">Verifique se o aluno e o template de contrato estão corretamente cadastrados. Erro: {error.message}</p>
        <Button asChild variant="link" className="mt-4 print-hidden">
          <Link to="/documents">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Link>
        </Button>
      </div>
    );
  }

  if (!template) {
    return (
        <div className="p-8 text-center">
            <h1 className="text-2xl text-destructive">Template de Contrato Ausente</h1>
            <p className="text-muted-foreground">O administrador da escola precisa configurar um template de contrato ativo em Configurações &gt; Contratos.</p>
            <Button asChild variant="link" className="mt-4 print-hidden">
                <Link to="/documents">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Link>
            </Button>
        </div>
    );
  }

  const isSignedByGuardian = documentStatus?.status === 'signed';
  const isSignedBySchool = !!documentStatus?.school_signed_at;
  const canSignBySchool = (isAdmin || isSecretary) && !isSignedBySchool;
  const canSignByGuardian = (isAdmin || isSecretary) && !isSignedByGuardian && isSignedBySchool; // Só pode assinar pelo responsável se a escola já assinou
  const canGenerateLink = (isAdmin || isSecretary) && isSignedBySchool; // Só pode gerar link se a escola já assinou

  const primaryGuardian = student?.guardians.find(g => g.relationship === 'Pai' || g.relationship === 'Mãe' || g.relationship === 'Tutor') || student?.guardians[0];
  const signedGuardianName = documentStatus?.guardians?.full_name || primaryGuardian?.full_name || 'N/A';
  const signedGuardianCpf = documentStatus?.guardians?.cpf || primaryGuardian?.cpf || 'N/A';

  return (
    <React.Fragment>
      <div className="max-w-4xl mx-auto bg-white p-6 shadow-lg print:shadow-none print:p-0" ref={printRef}>
        
        {/* Botões de Ação (Ocultos na Impressão) */}
        <div className="flex justify-between items-center mb-6 print-hidden">
          <Button variant="outline" asChild>
            <Link to="/documents">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
          </Button>
          <div className="flex gap-2">
            {canGenerateLink && (
              <Button 
                  onClick={handleGenerateVerificationLink} 
                  disabled={generateTokenMutation.isPending || !canGenerateLink}
                  variant="secondary"
              >
                  {generateTokenMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                  <LinkIcon className="mr-2 h-4 w-4" />
                  )}
                  Gerar Link de Verificação
              </Button>
            )}
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir Contrato
            </Button>
          </div>
        </div>

        {/* Cabeçalho do Documento */}
        <div className="flex justify-between items-start mb-6 border-b pb-4">
          <div className="text-left space-y-1 flex-1">
            <h1 className="text-xl font-bold text-primary">{tenant?.name}</h1>
            <p className="text-xs text-muted-foreground">CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS</p>
            <p className="text-sm font-semibold mt-2">{template.name}</p>
          </div>
          {tenant?.config?.logo_url && (
            <img src={tenant.config.logo_url} alt="Logo da Escola" className="h-20 w-auto object-contain" />
          )}
        </div>

        {/* Status de Assinatura */}
        <Card className="mb-6 p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status da Assinatura da Escola */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <School className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-sm">Assinatura da Escola:</span>
                    </div>
                    {isSignedBySchool ? (
                        <div className="flex items-center gap-2 text-green-600 font-bold">
                            <CheckCircle className="h-5 w-5" />
                            ASSINADO
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-yellow-600 font-bold">
                            <Signature className="h-5 w-5" />
                            PENDENTE
                        </div>
                    )}
                </div>

                {/* Status da Assinatura do Responsável */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-sm">Assinatura do Responsável:</span>
                    </div>
                    {isSignedByGuardian ? (
                        <div className="flex items-center gap-2 text-green-600 font-bold">
                            <CheckCircle className="h-5 w-5" />
                            ASSINADO
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-yellow-600 font-bold">
                            <Signature className="h-5 w-5" />
                            PENDENTE
                        </div>
                    )}
                </div>
            </div>
            {isSignedBySchool && (
                <p className="text-xs text-muted-foreground mt-1 text-right">
                    Pela escola em: {format(new Date(documentStatus!.school_signed_at!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
            )}
            {isSignedByGuardian && documentStatus?.signed_at && (
                <p className="text-xs text-muted-foreground mt-1 text-right">
                    Pelo responsável em: {format(new Date(documentStatus.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
            )}
        </Card>

        {/* Conteúdo do Contrato */}
        <div className="prose max-w-none text-sm leading-relaxed mb-8 print:text-xs print:leading-snug">
            {processedContent}
        </div>

        <Separator className="mb-8" />

        {/* Assinatura e Ações */}
        <div className="flex flex-col items-center justify-center space-y-6">
            <div className="grid grid-cols-2 gap-12 w-full max-w-lg text-center text-sm">
                <div className="space-y-2">
                    <Separator className="bg-foreground" />
                    <p className="font-semibold">{signedGuardianName}</p>
                    <p className="text-xs text-muted-foreground">Responsável Legal</p>
                    {signedGuardianCpf && <p className="text-xs text-muted-foreground">CPF: {signedGuardianCpf}</p>}
                    {isSignedByGuardian && documentStatus?.signed_at && (
                        <p className="text-xs text-muted-foreground">
                            Assinado em: {format(new Date(documentStatus.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                    )}
                </div>
                <div className="space-y-2">
                    <Separator className="bg-foreground" />
                    <p className="font-semibold">{tenant?.name}</p>
                    <p className="text-xs text-muted-foreground">Escola Contratada</p>
                    {tenant?.config?.cnpj && <p className="text-xs text-muted-foreground">CNPJ: {tenant.config.cnpj}</p>}
                    {isSignedBySchool && documentStatus?.school_signed_at && (
                        <p className="text-xs text-muted-foreground">
                            Assinado em: {format(new Date(documentStatus.school_signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                    )}
                </div>
            </div>

            {/* Botão de Assinatura da Escola */}
            {canSignBySchool && (
                <Button 
                    onClick={handleSignSchoolContract} 
                    disabled={signSchoolContractMutation.isPending}
                    className="w-full max-w-xs bg-primary hover:bg-primary/90 print-hidden"
                >
                    {signSchoolContractMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Signature className="mr-2 h-4 w-4" />
                    )}
                    Assinar Pela Escola
                </Button>
            )}

            {/* Botão de Assinatura Digital (Pelo Responsável) */}
            {canSignByGuardian && (
                <Button 
                    onClick={handleSignContract} 
                    disabled={signContractMutation.isPending || !canSignByGuardian}
                    className="w-full max-w-xs bg-accent hover:bg-accent/90 print-hidden"
                >
                    {signContractMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Signature className="mr-2 h-4 w-4" />
                    )}
                    Assinar Digitalmente (Pelo Responsável)
                </Button>
            )}
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
          <p>Este documento é válido mediante assinatura digital ou física.</p>
        </div>
      </div>
    </React.Fragment>
  );
};

export default StudentContract;