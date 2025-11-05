import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2, PlusCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import DocumentTable from '@/components/documents/DocumentTable';
import AddDocumentSheet from '@/components/documents/AddDocumentSheet';
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
import { SchoolDocument, SupabaseFetchedDocument } from '@/types/documents'; // Importando as interfaces centralizadas

// Função para buscar documentos
const fetchDocuments = async (tenantId: string): Promise<SchoolDocument[]> => {
  const { data, error } = await supabase
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
    `)
    .eq('tenant_id', tenantId)
    .order('generated_at', { ascending: false });

  if (error) throw new Error(error.message);
  
  const rawData: any[] = data || [];

  // Se houver IDs de usuários geradores, buscamos os nomes dos perfis em lote
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
      // Continuar mesmo com erro, mas os nomes serão N/A
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

const DocumentsPage: React.FC = () => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<SchoolDocument | null>(null);

  const { data: documents, isLoading: isDocumentsLoading, error } = useQuery<SchoolDocument[], Error>({
    queryKey: ['documents', tenantId],
    queryFn: () => fetchDocuments(tenantId!),
    enabled: !!tenantId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      if (!tenantId) throw new Error("ID da escola não encontrado.");

      // Primeiro, deletar o arquivo do Supabase Storage
      const { data: docData, error: fetchError } = await supabase
        .from('documents')
        .select('file_url')
        .eq('id', docId)
        .single();

      if (fetchError) throw new Error(`Erro ao buscar URL do arquivo: ${fetchError.message}`);
      if (!docData?.file_url) throw new Error("URL do arquivo não encontrada para exclusão.");

      // Extrair o caminho do arquivo do URL público
      // Ex: https://fhrxqkzswawlellkiaak.supabase.co/storage/v1/object/public/school-documents/TENANT_ID/document_type/file_name.pdf
      const pathSegments = docData.file_url.split('/');
      const bucketName = pathSegments[6]; // 'school-documents'
      const filePath = pathSegments.slice(7).join('/'); // 'TENANT_ID/document_type/file_name.pdf'

      if (bucketName !== 'school-documents') {
        throw new Error("Bucket de armazenamento inválido para exclusão.");
      }

      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (storageError) {
        console.warn("Erro ao deletar arquivo do storage (pode já ter sido removido):", storageError.message);
        // Não lançar erro fatal aqui, pois o registro do DB é o mais importante
      }

      // Depois, deletar o registro do banco de dados
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)
        .eq('tenant_id', tenantId); // RLS já deve garantir isso, mas é uma boa prática

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
    window.open(doc.file_url, '_blank');
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

  if (isProfileLoading || isDocumentsLoading) {
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
        <AddDocumentSheet />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Lista de Documentos ({documents?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
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