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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch all tenants
    const { data: tenants, error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, status, trial_expires_at, created_at')
      .order('created_at', { ascending: false });

    if (tenantsError) {
      console.error("Error fetching tenants:", tenantsError);
      throw new Error(`Erro ao buscar escolas: ${tenantsError.message}`);
    }

    const tenantsWithMetrics = await Promise.all(tenants.map(async (tenant) => {
      const [
        studentsCount,
        classesCount,
        teachersCount,
        employeesCount
      ] = await Promise.all([
        supabaseAdmin.from('students').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
        supabaseAdmin.from('classes').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
        supabaseAdmin.from('employees').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('is_teacher', true),
        supabaseAdmin.from('employees').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
      ]);

      // Determine plan value based on status
      let planValue = 0;
      if (tenant.status === 'active' || tenant.status === 'trial') {
        planValue = 220; // R$ 220/mês para planos ativos ou em teste
      }

      return {
        ...tenant,
        student_count: studentsCount.count ?? 0,
        class_count: classesCount.count ?? 0,
        teacher_count: teachersCount.count ?? 0,
        employee_count: employeesCount.count ?? 0,
        plan_value: planValue, // Adicionando o valor do plano
      };
    }));

    return new Response(JSON.stringify(tenantsWithMetrics), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("Edge Function CATCH block error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});