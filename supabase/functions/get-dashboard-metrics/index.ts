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
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { tenant_id } = await req.json();
    if (!tenant_id) {
      throw new Error("ID da escola (tenant_id) é obrigatório.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Cálculos de data para o mês atual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Paralelizar consultas para eficiência
    const [
      activeStudents,
      preEnrolledStudents,
      activeClasses,
      activeTeachers,
      activeEmployees,
      paidRevenue,
      pendingRevenue,
      paidExpense
    ] = await Promise.all([
      supabaseAdmin.from('students').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant_id).eq('status', 'active'),
      supabaseAdmin.from('students').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant_id).eq('status', 'pre-enrolled'),
      supabaseAdmin.from('classes').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant_id),
      supabaseAdmin.from('employees').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant_id).eq('is_teacher', true).eq('status', 'active'),
      supabaseAdmin.from('employees').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant_id).eq('status', 'active'),
      supabaseAdmin.from('revenues').select('amount').eq('tenant_id', tenant_id).eq('status', 'pago').gte('date', firstDayOfMonth).lte('date', lastDayOfMonth),
      supabaseAdmin.from('revenues').select('amount').eq('tenant_id', tenant_id).eq('status', 'pendente').gte('date', firstDayOfMonth).lte('date', lastDayOfMonth),
      supabaseAdmin.from('expenses').select('amount').eq('tenant_id', tenant_id).eq('status', 'pago').gte('date', firstDayOfMonth).lte('date', lastDayOfMonth)
    ]);

    // Verificar erros em cada consulta
    const errors = [activeStudents.error, preEnrolledStudents.error, activeClasses.error, activeTeachers.error, activeEmployees.error, paidRevenue.error, pendingRevenue.error, paidExpense.error].filter(Boolean);
    if (errors.length > 0) {
        console.error("Erros nas métricas do painel:", errors);
        throw new Error("Erro ao buscar métricas do painel.");
    }

    // Calcular somas
    const totalPaidRevenue = paidRevenue.data?.reduce((sum, r) => sum + r.amount, 0) ?? 0;
    const totalPendingRevenue = pendingRevenue.data?.reduce((sum, r) => sum + r.amount, 0) ?? 0;
    const totalPaidExpense = paidExpense.data?.reduce((sum, r) => sum + r.amount, 0) ?? 0;

    const metrics = {
      activeStudents: activeStudents.count ?? 0,
      preEnrolledStudents: preEnrolledStudents.count ?? 0,
      activeClasses: activeClasses.count ?? 0,
      activeTeachers: activeTeachers.count ?? 0,
      activeEmployees: activeEmployees.count ?? 0,
      paidRevenueMonth: totalPaidRevenue,
      pendingRevenueMonth: totalPendingRevenue,
      paidExpenseMonth: totalPaidExpense,
    };

    return new Response(JSON.stringify(metrics), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});