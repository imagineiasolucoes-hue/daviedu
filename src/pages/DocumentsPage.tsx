import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2, PlusCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import DocumentTable from '@/components/documents/DocumentTable';
import AddDocumentSheet from '@/components/documents/AddDocumentSheet';
import DocumentGenerationPanel from '@/components/documents/DocumentGenerationPanel';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { SchoolDocument } from '@/types/documents';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Tipos de documentos dinâmicos que podemos gerar
type DocumentTypeFilter = 'all' | 'contract' | 'receipt' | 'report_card' | 'transcript' | 'payslip' | 'other';

interface Student {
  id: string;
  full_name: string;
  registration_code: string;
}

// Função para buscar documentos (mantida a lógica de RLS e busca de perfis)
const fetchDocuments = async (
  tenantId: string, 
  documentTypeFilter: DocumentTypeFilter, 
  studentIdFilter: string
): Promise<SchoolDocument[]> => {
  let query = supabase
    .from('documents')
    .select(`
      id,
      document_type,
      file_url,
      generated_at,
      generated_by,
      related_entity_id,
      metadata,
      description
    `);

  if (documentTypeFilter !== 'all') {
    query = query.eq('document_type', documentTypeFilter);
  }
  if (studentIdFilter) {
    query = query.eq('related_entity_id', studentIdFilter);
  }

  const { data, error } = await query.order('generated_at', { ascending: false });

  if (error) throw new Error(error.message);
  
  const rawData: any[] = data || [];

  const generatedByIds = rawData.map(doc => doc.generated_by).filter(Boolean);
  let profilesMap: Map<string, { first_name: string | null; last_name: string | null; }> = new Map();

  if (generatedByIds.length > 0) {
    const uniqueIds = [...new Set(generatedByIds)];
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', uniqueIds);

    if (profilesError) {
      console.error("Erro ao buscar perfis dos geradores:", profilesError);
    } else {
      profilesData?.forEach(p => {
        profilesMap.set(p.id, { first_name: p.first_name, last_name: p.last_name });
      });
    }
  }

  return rawData.map((doc: any) => {
    const generatedByProfile = doc.generated_by ? profilesMap.get(doc.generated_by) || null : null;

    return {
      id: doc.id,
      document_type: doc.document_type,
      file_url: doc.file_url,
      generated_at: doc.generated_at,
      generated_by_profile: generatedByProfile,
      metadata: doc.metadata,
      related_entity_id: doc.related_entity_id,
      description: doc.description,
    };
  });
};

// NOVO: Função para buscar alunos para o filtro
const fetchStudentsForFilter = async (tenantId: string): Promise<Student[]> => {
  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, registration_code')
    .eq('tenant_id', tenantId)
    .order('full_name');
  if (error) throw new Error(error.message);
  return data;
};

const DocumentsPage: React.FC = () => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<SchoolDocument | null>(null);
  const [documentTypeFilter, setDocumentTypeFilter] = useState<DocumentTypeFilter>('all');
  const [studentIdFilter, setStudentIdFilter] = useState<string>('');

  const { data: documents, isLoading: isDocumentsLoading, error } = useQuery<SchoolDocument[], Error>({
    queryKey: ['documents', tenantId, documentTypeFilter, studentIdFilter],
    queryFn: () => fetchDocuments(tenantId!, documentTypeFilter, studentIdFilter),
    enabled: !!tenantId,
  });

  // NOVO: Query para buscar alunos para o filtro
  const { data: studentsForFilter, isLoading: isLoadingStudentsForFilter } = useQuery<Student[], Error>({
    queryKey: ['studentsForDocumentFilter', tenantId],
    queryFn: () => fetchStudentsForFilter(tenantId!),
    enabled: !!tenantId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      if (!tenantId) throw new Error("ID da escola não encontrado.");

      const { data: docData, error: fetchError } = await supabase
        .from('documents')
        .select('file_url')
        .eq('id', docId)
        .single();

      if (fetchError) throw new Error(`Erro ao buscar URL do arquivo: ${fetchError.message}`);
      // Documentos gerados dinamicamente podem ter 'generated_on_demand' como file_url
      // Não tentamos deletar do storage se for um documento gerado on-demand
      if (docData?.file_url && docData.file_url !== 'generated_on_demand') {
        const fileUrl = docData.file_url;
        const bucketName = 'school-documents'; // O nome do bucket é fixo

        const pathIdentifier = `/${bucketName}/`;
        const pathIndex = fileUrl.indexOf(pathIdentifier);
        let filePath: string;

        if (pathIndex !== -1) {
          filePath = fileUrl.substring(pathIndex + pathIdentifier.length);
        } else if (fileUrl.startsWith(bucketName + '/')) {
          filePath = fileUrl.substring(bucketName.length + 1);
        } else {
          console.warn(`[DocumentsPage] Não foi possível extrair o caminho do arquivo de forma padrão para: ${fileUrl}. Usando a URL completa como filePath.`);
          filePath = fileUrl;
        }

        if (filePath) {
          const { error: storageError } = await supabase.storage
            .from(bucketName)
            .remove([filePath]);

          if (storageError) {
            console.warn("Erro ao deletar arquivo do storage (pode já ter sido removido):", storageError.message);
          }
        }
      }

      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)
        .eq('tenant_id', tenantId);

      if (dbError) throw new Error(`Erro ao deletar registro do documento: ${dbError.message}`);
    },
    onSuccess: () => {
      toast.success("Documento excluído com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['documents', tenantId] });
      setIsDeleteDialogOpen(false);
    },
    onError: (err) => {
      toast.error("Erro ao Excluir Documento", { description: err.message });
    },
  });

  const handleViewDocument = (doc: SchoolDocument) => {
    // Se o file_url for 'generated_on_demand', redireciona para a rota de visualização dinâmica
    if (doc.file_url === 'generated_on_demand' && doc.related_entity_id) {
      window.open(`/documents/generate/${doc.document_type}/${doc.related_entity_id}`, '_blank');
    } else {
      window.open(doc.file_url, '_blank');
    }
  };

  const handleDeleteDocument = (doc: SchoolDocument) => {
    setSelectedDocument(doc);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedDocument) {
      deleteMutation.mutate(selectedDocument.id);
    }
  };

  if (isProfileLoading || isDocumentsLoading || isLoadingStudentsForFilter) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive">Erro ao carregar documentos: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Documentos</h1>
      </div>

      {/* Painel de Geração Dinâmica */}
      <DocumentGenerationPanel />

      {/* NOVO: Filtros para a tabela de documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            Documentos Gerados
          </CardTitle>
          <CardDescription>Visualize e gerencie todos os documentos gerados no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro por Tipo de Documento */}
            <div className="space-y-2">
              <Label htmlFor="filter_document_type">Filtrar por Tipo</Label>
              <Select 
                onValueChange={(value: DocumentTypeFilter) => setDocumentTypeFilter(value)} 
                value={documentTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="contract">Contrato</SelectItem>
                  <SelectItem value="receipt">Recibo</SelectItem>
                  <SelectItem value="report_card">Boletim</SelectItem>
                  <SelectItem value="transcript">Histórico Escolar</SelectItem>
                  <SelectItem value="payslip">Holerite</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Aluno */}
            <div className="space-y-2">
              <Label htmlFor="filter_student_id">Filtrar por Aluno</Label>
              <Select 
                onValueChange={setStudentIdFilter} 
                value={studentIdFilter}
                disabled={isLoadingStudentsForFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingStudentsForFilter ? "Carregando Alunos..." : "Todos os Alunos"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os Alunos</SelectItem>
                  {studentsForFilter?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name} ({s.registration_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DocumentTable 
            documents={documents || []} 
            onView={handleViewDocument} 
            onDelete={handleDeleteDocument} 
          />
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o documento "
              {selectedDocument?.metadata?.description ||
                selectedDocument?.description ||
                selectedDocument?.document_type}"? Esta ação não pode ser desfeita e removerá o arquivo permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DocumentsPage;