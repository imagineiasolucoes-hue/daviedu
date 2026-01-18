import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileText, CheckCircle, Signature, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface StudentInfo {
  id: string;
  tenant_id: string;
  full_name: string;
}

interface DocumentDetails {
  id: string;
  status: 'pending' | 'signed';
  signed_at: string | null;
  signed_by_guardian_id: string | null;
  school_signed_at: string | null;
  school_signed_by_profile_id: string | null;
  verification_link: string | null; // Adicionado para buscar o link de verificação
  guardians?: {
    full_name: string;
    cpf: string | null;
  } | null;
}

interface StudentDocumentsSectionProps {
  studentInfo: StudentInfo;
}

const fetchContractDocumentStatus = async (studentId: string): Promise<DocumentDetails | null> => {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      id, 
      status, 
      signed_at, 
      signed_by_guardian_id,
      school_signed_at,
      school_signed_by_profile_id,
      verification_link,
      guardians (full_name, cpf)
    `)
    .eq('related_entity_id', studentId)
    .eq('document_type', 'contract')
    .maybeSingle();
  
  if (error) {
    console.error("[StudentDocumentsSection] Error fetching contract document status:", error);
    throw new Error(error.message);
  }
  return data as unknown as DocumentDetails;
};

const StudentDocumentsSection: React.FC<StudentDocumentsSectionProps> = ({ studentInfo }) => {
  const { data: contractDocument, isLoading, error } = useQuery<DocumentDetails | null, Error>({
    queryKey: ['studentContractDocument', studentInfo.id],
    queryFn: () => fetchContractDocumentStatus(studentInfo.id),
    enabled: !!studentInfo.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-destructive">
          Erro ao carregar o status do contrato: {error.message}
        </CardContent>
      </Card>
    );
  }

  const isSignedBySchool = !!contractDocument?.school_signed_at;
  const isSignedByGuardian = contractDocument?.status === 'signed';
  const verificationLink = contractDocument?.verification_link;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Contrato de Matrícula
        </CardTitle>
        <CardDescription>
          Acompanhe o status do seu contrato de prestação de serviços educacionais.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!contractDocument ? (
          <p className="text-muted-foreground">Nenhum contrato de matrícula encontrado para este aluno.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Signature className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Assinatura da Escola:</span>
              </div>
              {isSignedBySchool ? (
                <span className="flex items-center gap-1 text-green-600 font-semibold">
                  <CheckCircle className="h-4 w-4" /> Assinado em {format(new Date(contractDocument.school_signed_at!), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                  <Signature className="h-4 w-4" /> Pendente
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Signature className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Assinatura do Responsável:</span>
              </div>
              {isSignedByGuardian ? (
                <span className="flex items-center gap-1 text-green-600 font-semibold">
                  <CheckCircle className="h-4 w-4" /> Assinado em {format(new Date(contractDocument.signed_at!), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                  <Signature className="h-4 w-4" /> Pendente
                </span>
              )}
            </div>

            {isSignedBySchool && !isSignedByGuardian && verificationLink && (
              <div className="mt-6 p-4 border rounded-md bg-blue-50/50 dark:bg-blue-950/30 space-y-3">
                <p className="font-semibold text-blue-700 dark:text-blue-300">
                  Seu contrato está pronto para ser assinado!
                </p>
                <p className="text-sm text-muted-foreground">
                  A escola já assinou o contrato. Por favor, clique no link abaixo para revisar e assinar digitalmente.
                </p>
                <Button asChild className="w-full">
                  <a href={verificationLink} target="_blank" rel="noopener noreferrer">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Assinar Contrato Digitalmente
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground break-all mt-2">
                  Link de Verificação: {verificationLink}
                </p>
              </div>
            )}

            {isSignedBySchool && isSignedByGuardian && (
              <div className="mt-6 p-4 border rounded-md bg-green-50/50 dark:bg-green-950/30 space-y-3">
                <p className="font-semibold text-green-700 dark:text-green-300">
                  Contrato Assinado por Ambas as Partes!
                </p>
                <p className="text-sm text-muted-foreground">
                  Seu contrato de matrícula foi assinado com sucesso pela escola e pelo responsável.
                </p>
                {verificationLink && (
                  <Button asChild variant="outline" className="w-full">
                    <a href={verificationLink} target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-2 h-4 w-4" />
                      Visualizar Contrato
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentDocumentsSection;