import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Settings } from "lucide-react";
import ExpensesTable from "@/components/financial/expenses/ExpensesTable";
import ExpenseForm from "@/components/financial/expenses/ExpenseForm";
import DeleteExpenseDialog from "@/components/financial/expenses/DeleteExpenseDialog";
import ManageCategoriesDialog from "@/components/financial/expenses/ManageCategoriesDialog";
import { Expense } from "@/types/financial";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const Expenses = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCategoriesDialogOpen, setIsCategoriesDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const queryClient = useQueryClient();

  const handleAdd = () => {
    setSelectedExpense(null);
    setIsFormOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsFormOpen(true);
  };

  const handleDelete = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteDialogOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedExpense(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedExpense(null);
  };

  const deleteMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Despesa excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      closeDeleteDialog();
    },
    onError: (error: any) => {
      showError(`Erro ao excluir despesa: ${error.message}`);
    },
  });

  const confirmDelete = () => {
    if (selectedExpense) {
      deleteMutation.mutate(selectedExpense.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestão de Despesas</h2>
          <p className="text-muted-foreground">
            Acompanhe e gerencie todas as suas fontes de despesa.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsCategoriesDialogOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Gerenciar Categorias
          </Button>
          <Button onClick={handleAdd}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Despesa
          </Button>
        </div>
      </div>

      <ExpensesTable onEdit={handleEdit} onDelete={handleDelete} />

      <ExpenseForm
        isOpen={isFormOpen}
        onClose={closeForm}
        initialData={selectedExpense}
      />

      {selectedExpense && (
        <DeleteExpenseDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={confirmDelete}
          isPending={deleteMutation.isPending}
        />
      )}

      <ManageCategoriesDialog
        isOpen={isCategoriesDialogOpen}
        onClose={() => setIsCategoriesDialogOpen(false)}
      />
    </div>
  );
};

export default Expenses;