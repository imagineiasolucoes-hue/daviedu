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
    const { count: totalTenants, error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true });

    if (tenantsError) {
      console.error("Error fetching total tenants count:", tenantsError);
      throw new Error(`Erro ao buscar o número total de escolas: ${tenantsError.message}`);
    }

    // Contar tenants ativos
    const { count: activeTenants, error: activeTenantsError } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (activeTenantsError) {
      console.error("Error fetching active tenants count:", activeTenantsError);
      throw new Error(`Erro ao buscar o número de escolas ativas: ${activeTenantsError.message}`);
    }

    // Contar tenants em trial
    const { count: trialTenants, error: trialTenantsError } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'trial');

    if (trialTenantsError) {
      console.error("Error fetching trial tenants count:", trialTenantsError);
      throw new Error(`Erro ao buscar o número de escolas em trial: ${trialTenantsError.message}`);
    }

    // Contar tenants suspensos
    const { count: suspendedTenants, error: suspendedTenantsError } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'suspended');

    if (suspendedTenantsError) {
      console.error("Error fetching suspended tenants count:", suspendedTenantsError);
      throw new Error(`Erro ao buscar o número de escolas suspensas: ${suspendedTenantsError.message}`);
    }

    // Contar o total de perfis (usuários)
    const { count: totalUsers, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (profilesError) {
      console.error("Error fetching total profiles count:", profilesError);
      throw new Error(`Erro ao buscar o número total de usuários: ${profilesError.message}`);
    }

    // Contar usuários por role
    const { count: totalAdmins, error: adminsError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (adminsError) {
      console.error("Error fetching admins count:", adminsError);
      throw new Error(`Erro ao buscar o número de administradores: ${adminsError.message}`);
    }

    const { count: totalSecretaries, error: secretariesError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'secretary');

    if (secretariesError) {
      console.error("Error fetching secretaries count:", secretariesError);
      throw new Error(`Erro ao buscar o número de secretários: ${secretariesError.message}`);
    }

    const { count: totalTeachers, error: teachersError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'teacher');

    if (teachersError) {
      console.error("Error fetching teachers count:", teachersError);
      throw new Error(`Erro ao buscar o número de professores: ${teachersError.message}`);
    }

    const { count: totalStudents, error: studentsError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    if (studentsError) {
      console.error("Error fetching students count:", studentsError);
      throw new Error(`Erro ao buscar o número de estudantes: ${studentsError.message}`);
    }

    return new Response(JSON.stringify({
      totalTenants: totalTenants ?? 0,
      activeTenants: activeTenants ?? 0,
      trialTenants: trialTenants ?? 0,
      suspendedTenants: suspendedTenants ?? 0,
      totalUsers: totalUsers ?? 0,
      totalAdmins: totalAdmins ?? 0,
      totalSecretaries: totalSecretaries ?? 0,
      totalTeachers: totalTeachers ?? 0,
      totalStudents: totalStudents ?? 0,
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