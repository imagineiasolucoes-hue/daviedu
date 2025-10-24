import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PencilIcon, TrashIcon } from "lucide-react";
import ExpenseForm from "./ExpenseForm";
import { showError, showSuccess } from "@/utils/toast";
import { format } from "date-fns";

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description?: string;
  user_id: string;
}

const ExpenseList = () => {
  const queryClient = useQueryClient();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: expenses, isLoading, error } = useQuery<Expense[]>({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      showSuccess("Despesa excluída com sucesso!");
    },
    onError: (error) => {
      showError(`Erro ao excluir despesa: ${error.message}`);
    },
  });

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setEditingExpense(null);
  };

  const handleDeleteClick = (id: string) => {
    deleteExpenseMutation.mutate(id);
  };

  if (isLoading) {
    return <div className="text-center py-4">Carregando despesas...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Erro ao carregar despesas: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      {expenses && expenses.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{format(new Date(expense.date), "dd/MM/yyyy")}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>R$ {expense.amount.toFixed(2)}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEditClick(expense)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <TrashIcon className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso excluirá permanentemente sua despesa.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteClick(expense.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center text-muted-foreground">Nenhuma despesa encontrada. Adicione uma nova!</p>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Despesa</DialogTitle>
          </DialogHeader>
          {editingExpense && <ExpenseForm initialExpense={editingExpense} onSuccess={handleEditSuccess} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseList;