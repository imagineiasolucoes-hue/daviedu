import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface DeleteTeacherDialogProps {
  teacherId: string | null;
  teacherName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteTeacherDialog: React.FC<DeleteTeacherDialogProps> = ({ teacherId, teacherName, open, onOpenChange }) => {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!teacherId || !tenantId) throw new Error("ID do professor ou da escola ausente.");
      const { error } = await supabase.functions.invoke('delete-teacher', {
        body: JSON.stringify({ employee_id: teacherId, tenant_id: tenantId }),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Professor excluído com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['teachers', tenantId] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erro ao Excluir", { description: error.message });
    },
  });

  const handleDelete = () => {
    mutation.mutate();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o professor <strong>{teacherName}</strong>? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteTeacherDialog;