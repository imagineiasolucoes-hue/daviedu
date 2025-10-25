import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { Expense } from "@/types/financial";
import { cn } from "@/lib/utils";

const fetchExpenses = async () => {
  const { data, error } = await supabase
    .from("expenses")
    .select(
      `
      *,
      expense_categories (name)
    `
    )
    .order("date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  // The 'category' property in the Expense type is expecting an object, but Supabase returns an array.
  // We need to flatten this to match the type.
  return data?.map(expense => ({
    ...expense,
    expense_categories: Array.isArray(expense.expense_categories) ? expense.expense_categories[0] : expense.expense_categories,
  })) || [];
};

interface ExpensesTableProps {
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

const ExpensesTable: React.FC<ExpensesTableProps> = ({ onEdit, onDelete }) => {
  const {
    data: expenses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["expenses"],
    queryFn: fetchExpenses,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-8">
        Erro ao carregar as despesas: {error.message}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses && expenses.length > 0 ? (
            expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {expense.description}
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(expense.amount)}
                </TableCell>
                <TableCell>
                  {new Date(expense.date).toLocaleDateString("pt-BR", { timeZone: 'UTC' })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      expense.status === "pago"
                        ? "default"
                        : expense.status === "pendente"
                        ? "secondary"
                        : "destructive"
                    }
                    className={cn({ "bg-green-500 text-white": expense.status === "pago" })}
                  >
                    {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {(expense.category as any)?.name || "N/A"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEdit(expense)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(expense)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Nenhuma despesa encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ExpensesTable;