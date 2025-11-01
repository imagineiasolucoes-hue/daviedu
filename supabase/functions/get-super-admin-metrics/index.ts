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

    // Contar o total de tenants (escolas)
    const { count: tenantsCount, error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true });

    if (tenantsError) {
      console.error("Error fetching tenants count:", tenantsError);
      throw new Error(`Erro ao buscar o número de escolas: ${tenantsError.message}`);
    }

    // Contar o total de perfis (usuários)
    const { count: profilesCount, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (profilesError) {
      console.error("Error fetching profiles count:", profilesError);
      throw new Error(`Erro ao buscar o número de usuários: ${profilesError.message}`);
    }

    // Contar o total de alunos ativos em todas as escolas
    const { count: activeStudentsCount, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (studentsError) {
      console.error("Error fetching active students count:", studentsError);
      throw new Error(`Erro ao buscar o número de alunos ativos: ${studentsError.message}`);
    }

    // Contar o total de funcionários ativos em todas as escolas
    const { count: activeEmployeesCount, error: employeesError } = await supabaseAdmin
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (employeesError) {
      console.error("Error fetching active employees count:", employeesError);
      throw new Error(`Erro ao buscar o número de funcionários ativos: ${employeesError.message}`);
    }

    return new Response(JSON.stringify({
      totalTenants: tenantsCount ?? 0,
      totalUsers: profilesCount ?? 0,
      totalActiveStudents: activeStudentsCount ?? 0,
      totalActiveEmployees: activeEmployeesCount ?? 0,
    }), {
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