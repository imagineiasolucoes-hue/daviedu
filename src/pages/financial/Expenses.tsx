import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MinusCircle, Loader2, Wallet } from "lucide-react";
import { AddTransactionDialog } from "@/components/financial/AddTransactionDialog";
import { TransactionsTable } from "@/components/financial/TransactionsTable";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { Transaction, PayrollExpense, CategoryType } from "@/types/financial";
import { AddPayrollExpenseDialog } from "@/components/financial/AddPayrollExpenseDialog";

const fetchExpenseTransactions = async (tenantId: string | undefined): Promise<Transaction[]> => {
  if (!tenantId) return [];
  const { data, error } = await supabase
    .from("transactions")
    .select("*, categories!transactions_category_id_fkey(name, parent_id, parent:parent_id(name, parent_id, parent:parent_id(name)))")
    .eq("tenant_id", tenantId)
    .eq("type", "expense")
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Transaction[];
};

const fetchPayrollExpenses = async (tenantId: string | undefined): Promise<PayrollExpense[]> => {
  if (!tenantId) return [];
  const { data, error } = await supabase
    .from("payroll_expenses")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return data as PayrollExpense[];
};

const fetchTenantId = async (userId: string | undefined): Promise<string | undefined> => {
    if (!userId) return undefined;
    const { data, error } = await supabase.from("profiles").select("tenant_id").eq("id", userId).single();
    if (error) throw new Error("Failed to fetch tenant ID");
    return data?.tenant_id;
};

const Expenses = () => {
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isPayrollDialogOpen, setIsPayrollDialogOpen] = useState(false);
  const { user } = useAuth();
  const { data: tenantId } = useQuery({
    queryKey: ['tenantId', user?.id],
    queryFn: () => fetchTenantId(user?.id),
    enabled: !!user,
  });

  const { data: transactions = [], isLoading: isLoadingTransactions, error: transactionsError } = useQuery<Transaction[]>({
    queryKey: ["transactions", tenantId, "expense"],
    queryFn: () => fetchExpenseTransactions(tenantId),
    enabled: !!tenantId,
  });

  const { data: payrollExpenses = [], isLoading: isLoadingPayroll, error: payrollError } = useQuery<PayrollExpense[]>({
    queryKey: ["payroll_expenses", tenantId],
    queryFn: () => fetchPayrollExpenses(tenantId),
    enabled: !!tenantId,
  });

  // Combine and sort all expenses for display
  const allExpenses = [...transactions, ...payrollExpenses.map(pe => ({
    ...pe,
    type: 'expense' as CategoryType, // Fix: Cast to CategoryType
    categories: { name: 'Folha de Pagamento', parent_id: null, parent: null }, // Mock category for payroll
    category_id: 'payroll-category-id', // Placeholder
    description: pe.description || 'Despesa de Folha de Pagamento',
  }))].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Despesas</CardTitle>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => setIsExpenseDialogOpen(true)}>
              <MinusCircle className="mr-2 h-4 w-4" />
              Nova Despesa
            </Button>
            <Button variant="outline" onClick={() => setIsPayrollDialogOpen(true)}>
              <Wallet className="mr-2 h-4 w-4" />
              Folha de Pagamento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(isLoadingTransactions || isLoadingPayroll) ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (transactionsError || payrollError) ? (
            <div className="text-red-500 text-center">Falha ao carregar despesas.</div>
          ) : (
            <TransactionsTable transactions={allExpenses} />
          )}
        </CardContent>
      </Card>
      <AddTransactionDialog
        open={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        transactionType="expense"
      />
      <AddPayrollExpenseDialog
        open={isPayrollDialogOpen}
        onOpenChange={setIsPayrollDialogOpen}
      />
    </div>
  );
};

export default Expenses;