import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MinusCircle, Loader2 } from "lucide-react";
import { AddTransactionDialog } from "@/components/financial/AddTransactionDialog";
import { TransactionsTable } from "@/components/financial/TransactionsTable";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { Transaction } from "@/types/financial";

const fetchExpenseTransactions = async (tenantId: string | undefined): Promise<Transaction[]> => {
  if (!tenantId) return [];
  const { data, error } = await supabase
    .from("transactions")
    .select("*, categories(name, parent_id, categories(name))") // Fetch parent category name too
    .eq("tenant_id", tenantId)
    .eq("type", "expense")
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Transaction[];
};

const fetchTenantId = async (userId: string | undefined): Promise<string | undefined> => {
    if (!userId) return undefined;
    const { data, error } = await supabase.from("profiles").select("tenant_id").eq("id", userId).single();
    if (error) throw new Error("Failed to fetch tenant ID");
    return data?.tenant_id;
};

const Expenses = () => {
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const { user } = useAuth();
  const { data: tenantId } = useQuery({
    queryKey: ['tenantId', user?.id],
    queryFn: () => fetchTenantId(user?.id),
    enabled: !!user,
  });

  const { data: transactions = [], isLoading, error } = useQuery<Transaction[]>({
    queryKey: ["transactions", tenantId, "expense"],
    queryFn: () => fetchExpenseTransactions(tenantId),
    enabled: !!tenantId,
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Despesas</CardTitle>
          <Button variant="destructive" onClick={() => setIsExpenseDialogOpen(true)}>
            <MinusCircle className="mr-2 h-4 w-4" />
            Nova Despesa
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : error ? (
            <div className="text-red-500 text-center">Falha ao carregar despesas.</div>
          ) : (
            <TransactionsTable transactions={transactions} />
          )}
        </CardContent>
      </Card>
      <AddTransactionDialog
        open={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        type="expense"
      />
    </div>
  );
};

export default Expenses;