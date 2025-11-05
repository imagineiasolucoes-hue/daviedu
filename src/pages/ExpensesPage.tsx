import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, DollarSign, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import AddExpenseSheet from '@/components/expenses/AddExpenseSheet';
import ExpenseCategorySheet from '@/components/expenses/ExpenseCategorySheet'; // Importando o novo componente
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// --- Tipos de Dados ---
interface Expense {
  id: string;
  date: string;
  description: string | null;
  amount: number;
  payment_method: 'Dinheiro' | 'Cartão' | 'Pix' | 'Boleto' | 'Transferência';
  status: 'pendente' | 'pago';
  is_recurring: boolean;
  created_at: string;
  expense_categories: { name: string } | null;
  destination: string | null;
  attachment_url: string | null;
}

// --- Função de Busca de Dados ---
const fetchExpenses = async (tenantId: string): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      id,
      date,
      description,
      amount,
      payment_method,
      status,
      is_recurring,
      created_at,
      expense_categories (name),
      destination,
      attachment_url
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false }); // Ordenar da mais recente para a mais antiga

  if (error) throw new Error(error.message);
  return data as unknown as Expense[];
};

const ExpensesPage: React.FC = () => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const tenantId = profile?.tenant_id;

  // Estados para edição e exclusão (funcionalidade futura)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const { data: expenses, isLoading: isExpensesLoading, error } = useQuery<Expense[], Error>({
    queryKey: ['expenses', tenantId],
    queryFn: () => fetchExpenses(tenantId!),
    enabled: !!tenantId,
  });

  // Funções placeholder para edição e exclusão
  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsEditSheetOpen(true);
    // Implementar EditExpenseSheet
  };

  const handleDelete = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteDialogOpen(true);
    // Implementar DeleteExpenseDialog
  };

  if (isProfileLoading || isExpensesLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-destructive">Erro ao carregar despesas: {error.message}</div>;
  }

  const getStatusBadge = (status: Expense['status']) => {
    switch (status) {
      case 'pago': return <Badge className="bg-green-500 hover:bg-green-600">Pago</Badge>;
      case 'pendente': return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Pendente</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Despesas</h1>
        <div className="flex gap-2">
          <ExpenseCategorySheet />
          <AddExpenseSheet />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-destructive" />
            Lista de Despesas ({expenses?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Destino/Fornecedor</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses?.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{expense.description || 'N/A'}</TableCell>
                    <TableCell>{expense.expense_categories?.name || 'N/A'}</TableCell>
                    <TableCell>{expense.destination || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(expense.amount)}</TableCell>
                    <TableCell>{expense.payment_method}</TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(expense)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(expense)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {expenses?.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">Nenhuma despesa registrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesPage;