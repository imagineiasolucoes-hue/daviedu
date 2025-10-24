import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2 } from "lucide-react";
import { AddTransactionDialog } from "@/components/financial/AddTransactionDialog";
import { TransactionsTable } from "@/components/financial/TransactionsTable";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { Transaction } from "@/types/financial";

const fetchIncomeTransactions = async (tenantId: string | undefined): Promise<Transaction[]> => {
  if (!tenantId) return [];
  const { data, error } = await supabase
    .from("transactions")
    .select("*, transaction_categories(name)")
    .eq("tenant_id", tenantId)
    .eq("type", "income")
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

const Income = () => {
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const { user } = useAuth();
  const { data: tenantId } = useQuery({
    queryKey: ['tenantId', user?.id],
    queryFn: () => fetchTenantId(user?.id),
    enabled: !!user,
  });

  const { data: transactions = [], isLoading, error } = useQuery<Transaction[]>({
    queryKey: ["transactions", tenantId, "income"],
    queryFn: () => fetchIncomeTransactions(tenantId),
    enabled: !!tenantId,
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Receitas</CardTitle>
          <Button onClick={() => setIsIncomeDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Receita
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : error ? (
            <div className="text-red-500 text-center">Falha ao carregar receitas.</div>
          ) : (
            <TransactionsTable transactions={transactions} />
          )}
        </CardContent>
      </Card>
      <AddTransactionDialog
        open={isIncomeDialogOpen}
        onOpenChange={setIsIncomeDialogOpen}
        type="income"
      />
    </div>
  );
};

export default Income;