import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Class } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import ClassesTable from "../../../components/secretaria/classes/ClassesTable";
import ClassForm from "../../../components/secretaria/classes/ClassForm";
import DeleteClassDialog from "../../../components/secretaria/classes/DeleteClassDialog";

const Classes = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const queryClient = useQueryClient();

  const handleAdd = () => {
    setSelectedClass(null);
    setIsFormOpen(true);
  };

  const handleEdit = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsFormOpen(true);
  };

  const handleDelete = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsDeleteDialogOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedClass(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedClass(null);
  };

  const deleteMutation = useMutation({
    mutationFn: async (classId: string) => {
      const { error } = await supabase.from("classes").delete().eq("id", classId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Turma excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      closeDeleteDialog();
    },
    onError: (error: any) => {
      showError(`Erro ao excluir turma: ${error.message}`);
    },
  });

  const confirmDelete = () => {
    if (selectedClass) {
      deleteMutation.mutate(selectedClass.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Gerenciar Turmas</h3>
          <p className="text-sm text-muted-foreground">
            Organize os alunos em turmas por curso e ano letivo.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Turma
        </Button>
      </div>
      <ClassesTable onEdit={handleEdit} onDelete={handleDelete} />
      <ClassForm
        isOpen={isFormOpen}
        onClose={closeForm}
        initialData={selectedClass}
      />
      {selectedClass && (
        <DeleteClassDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={confirmDelete}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default Classes;