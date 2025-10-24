import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Scale, Loader2 } from "lucide-react";
import { TransactionsTable } from "@/components/financial/TransactionsTable";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { Transaction } from "@/types/financial";

const fetchTransactions = async (tenantId: string | undefined): Promise<Transaction[]> => {
  if (!tenantId) return [];
  const { data, error } = await supabase
    .from("transactions")
    .select("*, categories(name)")
    .eq("tenant_id", tenantId)
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Transaction[];
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

  const { data: transactions = [], isLoading, error } = useQuery<Transaction[]>({
    queryKey: ["transactions", tenantId],
    queryFn: () => fetchTransactions(tenantId),
    enabled: !!tenantId,
  });

  const summary = useMemo(() => {
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;
    return { totalIncome, totalExpense, balance };
  }, [transactions]);

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
          {isLoading ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : error ? (
            <div className="text-red-500 text-center">Falha ao carregar transações.</div>
          ) : (
            <TransactionsTable transactions={transactions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDashboard;