import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Employee } from "@/types/financial";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import EmployeesTable from "@/components/financial/payroll/EmployeesTable";
import EmployeeForm from "@/components/financial/payroll/EmployeeForm";
import DeleteEmployeeDialog from "@/components/financial/payroll/DeleteEmployeeDialog";

const Employees = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const queryClient = useQueryClient();

  const handleAdd = () => {
    setSelectedEmployee(null);
    setIsFormOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleDelete = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedEmployee(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedEmployee(null);
  };

  const deleteMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", employeeId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Funcionário excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      closeDeleteDialog();
    },
    onError: (error: any) => {
      showError(`Erro ao excluir funcionário: ${error.message}`);
    },
  });

  const confirmDelete = () => {
    if (selectedEmployee) {
      deleteMutation.mutate(selectedEmployee.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Gerenciar Funcionários</h3>
          <p className="text-sm text-muted-foreground">
            Adicione, edite e visualize os funcionários da sua instituição.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Funcionário
        </Button>
      </div>
      <EmployeesTable onEdit={handleEdit} onDelete={handleDelete} />
      <EmployeeForm
        isOpen={isFormOpen}
        onClose={closeForm}
        initialData={selectedEmployee}
      />
      {selectedEmployee && (
        <DeleteEmployeeDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={confirmDelete}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default Employees;