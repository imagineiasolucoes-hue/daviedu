import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Employee } from "@/types/financial";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import TeachersTable from "./TeachersTable";
import EmployeeForm from "@/components/financial/payroll/EmployeeForm";
import DeleteEmployeeDialog from "@/components/financial/payroll/DeleteEmployeeDialog";
import { PlusCircle } from "lucide-react";

const TeachersManagement = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Employee | null>(null);
  const queryClient = useQueryClient();

  const handleAdd = () => {
    setSelectedTeacher(null);
    setIsFormOpen(true);
  };

  const handleEdit = (teacher: Employee) => {
    setSelectedTeacher(teacher);
    setIsFormOpen(true);
  };

  const handleDelete = (teacher: Employee) => {
    setSelectedTeacher(teacher);
    setIsDeleteDialogOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedTeacher(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedTeacher(null);
  };

  // Reutilizando a mutação de exclusão de funcionário
  const deleteMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", employeeId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Professor excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      closeDeleteDialog();
    },
    onError: (error: any) => {
      showError(`Erro ao excluir professor: ${error.message}`);
    },
  });

  const confirmDelete = () => {
    if (selectedTeacher) {
      deleteMutation.mutate(selectedTeacher.id);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Professores</CardTitle>
          <CardDescription>Gerencie o corpo docente da sua instituição. (Dados integrados com a Folha de Pagamento)</CardDescription>
        </div>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Professor
        </Button>
      </CardHeader>
      <CardContent>
        <TeachersTable onEdit={handleEdit} onDelete={handleDelete} />
      </CardContent>
      
      {/* Reutilizando modais de Funcionário */}
      <EmployeeForm
        isOpen={isFormOpen}
        onClose={closeForm}
        initialData={selectedTeacher}
      />
      {selectedTeacher && (
        <DeleteEmployeeDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={confirmDelete}
          isPending={deleteMutation.isPending}
        />
      )}
    </Card>
  );
};

export default TeachersManagement;