import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Student } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import StudentsTable from "@/components/secretaria/students/StudentsTable";
import StudentForm from "@/components/secretaria/students/StudentForm";
import DeleteStudentDialog from "@/components/secretaria/students/DeleteStudentDialog";

const Students = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const queryClient = useQueryClient();

  const handleAdd = () => {
    setSelectedStudent(null);
    setIsFormOpen(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsFormOpen(true);
  };

  const handleDelete = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedStudent(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedStudent(null);
  };

  const deleteMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase.from("students").delete().eq("id", studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Aluno excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] }); // Update student count on dashboard
      closeDeleteDialog();
    },
    onError: (error: any) => {
      showError(`Erro ao excluir aluno: ${error.message}`);
    },
  });

  const confirmDelete = () => {
    if (selectedStudent) {
      deleteMutation.mutate(selectedStudent.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Gerenciar Alunos</h3>
          <p className="text-sm text-muted-foreground">
            Cadastre, edite e gerencie o status dos alunos da sua instituição.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Aluno
        </Button>
      </div>
      <StudentsTable onEdit={handleEdit} onDelete={handleDelete} />
      <StudentForm
        isOpen={isFormOpen}
        onClose={closeForm}
        initialData={selectedStudent}
      />
      {selectedStudent && (
        <DeleteStudentDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={confirmDelete}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default Students;