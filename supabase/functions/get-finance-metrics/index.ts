declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenant_id, year, month } = await req.json();
    if (!tenant_id || !year) {
      throw new Error("ID da escola (tenant_id) e ano são obrigatórios.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let startDate: string;
    let endDate: string;
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    if (month && month !== 'all') {
      // Período específico do mês
      startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      endDate = new Date(year, month, 0).toISOString().split('T')[0];
    } else {
      // Período do ano inteiro
      startDate = new Date(year, 0, 1).toISOString().split('T')[0];
      endDate = new Date(year, 11, 31).toISOString().split('T')[0];
    }

    // --- Métricas para o período selecionado ---
    const [
      paidRevenueResult,
      pendingRevenueResult,
      paidExpenseResult,
      categorizedExpensesDataResult
    ] = await Promise.all([
      supabaseAdmin.from('revenues').select('amount').eq('tenant_id', tenant_id).eq('status', 'pago').gte('date', startDate).lte('date', endDate),
      supabaseAdmin.from('revenues').select('amount').eq('tenant_id', tenant_id).eq('status', 'pendente').gte('date', startDate).lte('date', endDate),
      supabaseAdmin.from('expenses').select('amount').eq('tenant_id', tenant_id).eq('status', 'pago').gte('date', startDate).lte('date', endDate),
      supabaseAdmin.from('expenses').select('amount, expense_categories (name)').eq('tenant_id', tenant_id).eq('status', 'pago').gte('date', startDate).lte('date', endDate)
    ]);

    if (paidRevenueResult.error) throw new Error(`Erro ao buscar receita paga: ${paidRevenueResult.error.message}`);
    if (pendingRevenueResult.error) throw new Error(`Erro ao buscar receita pendente: ${pendingRevenueResult.error.message}`);
    if (paidExpenseResult.error) throw new Error(`Erro ao buscar despesa paga: ${paidExpenseResult.error.message}`);
    if (categorizedExpensesDataResult.error) throw new Error(`Erro ao buscar despesas categorizadas: ${categorizedExpensesDataResult.error.message}`);

    const paidRevenue = paidRevenueResult.data?.reduce((sum, r) => sum + r.amount, 0) ?? 0;
    const pendingRevenue = pendingRevenueResult.data?.reduce((sum, r) => sum + r.amount, 0) ?? 0;
    const paidExpense = paidExpenseResult.data?.reduce((sum, r) => sum + r.amount, 0) ?? 0;
    const balance = paidRevenue - paidExpense;

    const categorizedExpensesMap = new Map<string, number>();
    categorizedExpensesDataResult.data?.forEach(expense => {
      const categoryName = expense.expense_categories?.name || 'Outros';
      categorizedExpensesMap.set(categoryName, (categorizedExpensesMap.get(categoryName) || 0) + expense.amount);
    });
    const categorizedExpenses = Array.from(categorizedExpensesMap.entries()).map(([name, value]) => ({ name, value }));

    // --- Dados para o Gráfico de Barras (Mensal) ---
    const monthlyFinancialDataPromises = [];
    const numMonths = (month && month !== 'all') ? 1 : 12; // Se mês específico, apenas 1 mês; senão, 12 meses

    for (let i = 0; i < numMonths; i++) {
      const currentMonthIndex = (month && month !== 'all') ? month - 1 : i;
      const date = new Date(year, currentMonthIndex, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

      monthlyFinancialDataPromises.push(
        (async () => {
          const [
            monthlyRevenueResult,
            monthlyExpenseResult
          ] = await Promise.all([
            supabaseAdmin.from('revenues').select('amount').eq('tenant_id', tenant_id).eq('status', 'pago').gte('date', monthStart).lte('date', monthEnd),
            supabaseAdmin.from('expenses').select('amount').eq('tenant_id', tenant_id).eq('status', 'pago').gte('date', monthStart).lte('date', monthEnd)
          ]);

          if (monthlyRevenueResult.error) throw new Error(`Erro ao buscar receita mensal: ${monthlyRevenueResult.error.message}`);
          if (monthlyExpenseResult.error) throw new Error(`Erro ao buscar despesa mensal: ${monthlyExpenseResult.error.message}`);

          const totalMonthlyRevenue = monthlyRevenueResult.data?.reduce((sum, r) => sum + r.amount, 0) ?? 0;
          const totalMonthlyExpense = monthlyExpenseResult.data?.reduce((sum, r) => sum + r.amount, 0) ?? 0;

          return {
            name: monthNames[date.getMonth()],
            Receita: totalMonthlyRevenue,
            Despesa: totalMonthlyExpense,
          };
        })()
      );
    }
    const monthlyFinancialData = await Promise.all(monthlyFinancialDataPromises);

    return new Response(JSON.stringify({
      paidRevenueMonth: paidRevenue,
      pendingRevenueMonth: pendingRevenue,
      paidExpenseMonth: paidExpense,
      balanceMonth: balance,
      monthlyFinancialData: monthlyFinancialData,
      categorizedExpenses: categorizedExpenses,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("Edge Function CATCH block error (get-finance-metrics):", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});