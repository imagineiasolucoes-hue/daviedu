import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Scale, Loader2 } from "lucide-react";
import { TransactionsTable } from "@/components/financial/TransactionsTable";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { Transaction, PayrollExpense, CategoryType } from "@/types/financial";

const fetchTransactions = async (tenantId: string | undefined): Promise<Transaction[]> => {
  if (!tenantId) return [];
  const { data, error } = await supabase
    .from("transactions")
    .select("*, categories!transactions_category_id_fkey(name, parent_id, parent:parent_id(name, parent_id, parent:parent_id(name)))")
    .eq("tenant_id", tenantId)
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
    const { data, error } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", userId)
        .single();
    if (error) throw new Error("Failed to fetch tenant ID");
    return data?.tenant_id;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const FinancialDashboard = () => {
  const { user } = useAuth();
  const { data: tenantId } = useQuery({
    queryKey: ['tenantId', user?.id],
    queryFn: () => fetchTenantId(user?.id),
    enabled: !!user,
  });

  const { data: transactions = [], isLoading: isLoadingTransactions, error: transactionsError } = useQuery<Transaction[]>({
    queryKey: ["transactions", tenantId],
    queryFn: () => fetchTransactions(tenantId),
    enabled: !!tenantId,
  });

  const { data: payrollExpenses = [], isLoading: isLoadingPayroll, error: payrollError } = useQuery<PayrollExpense[]>({
    queryKey: ["payroll_expenses", tenantId],
    queryFn: () => fetchPayrollExpenses(tenantId),
    enabled: !!tenantId,
  });

  const allFinancialData = useMemo(() => {
    const combined: Transaction[] = [
      ...transactions,
      ...payrollExpenses.map(pe => ({
        ...pe,
        type: 'expense' as CategoryType, // Fix: Cast to CategoryType
        categories: { name: 'Folha de Pagamento', parent_id: null, parent: null }, // Mock category for payroll
        category_id: 'payroll-category-id', // Placeholder
        description: pe.description || 'Despesa de Folha de Pagamento',
      }))
    ];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, payrollExpenses]);


  const summary = useMemo(() => {
    const totalIncome = allFinancialData.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = allFinancialData.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;
    return { totalIncome, totalExpense, balance };
  }, [allFinancialData]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesa Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpense)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.balance)}</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Últimas Transações</CardTitle>
        </CardHeader>
        <CardContent>
          {(isLoadingTransactions || isLoadingPayroll) ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (transactionsError || payrollError) ? (
            <div className="text-red-500 text-center">Falha ao carregar transações.</div>
          ) : (
            <TransactionsTable transactions={allFinancialData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDashboard;