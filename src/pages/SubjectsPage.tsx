import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookMarked, Loader2, Trash2 } from 'lucide-react';
import SubjectSheet from '@/components/subjects/SubjectSheet';
import AssessmentTypeSheet from '@/components/subjects/AssessmentTypeSheet'; // NOVO IMPORT
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';

interface Subject {
  id: string;
  name: string;
}

const fetchSubjects = async (tenantId: string): Promise<Subject[]> => {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw new Error(error.message);
  return data;
};

const SubjectsPage: React.FC = () => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const tenantId = profile?.tenant_id;
  const queryClient = useQueryClient();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const { data: subjects, isLoading: isLoadingSubjects, error } = useQuery<Subject[], Error>({
    queryKey: ['subjects', tenantId],
    queryFn: () => fetchSubjects(tenantId!),
    enabled: !!tenantId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (subjectId: string) => {
      if (!tenantId) throw new Error("ID da escola ausente.");
      
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId)
        .eq('tenant_id', tenantId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Matéria excluída com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['subjects', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['gradeEntry'] }); // Invalida a página de lançamento de notas
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao Excluir Matéria", { description: error.message });
    },
  });

  const handleDelete = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedSubject) {
      deleteMutation.mutate(selectedSubject.id);
    }
  };

  if (isProfileLoading || isLoadingSubjects) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-destructive">Erro ao carregar matérias: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Matérias</h1>
        <div className="flex gap-2">
          <AssessmentTypeSheet /> {/* NOVO BOTÃO */}
          <SubjectSheet />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-primary" />
            Lista de Matérias ({subjects?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects?.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(subject)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {subjects?.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">Nenhuma matéria cadastrada.</p>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a matéria <strong>{selectedSubject?.name}</strong>? Esta ação não pode ser desfeita e pode afetar o cadastro de professores e o lançamento de notas.
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

export default SubjectsPage;