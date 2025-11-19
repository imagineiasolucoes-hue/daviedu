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
    const { tenant_id } = await req.json();

    if (!tenant_id) {
      throw new Error("ID da escola (tenant_id) é obrigatório.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Iniciar uma transação para garantir atomicidade (se o Deno Supabase client suportar)
    // Por enquanto, faremos as operações sequencialmente e trataremos erros.

    // 1. Deletar perfis associados a este tenant
    // NOTA: Isso não deleta o usuário em auth.users, apenas o perfil em public.profiles.
    // Deletar auth.users é uma operação mais sensível e geralmente requer um fluxo separado.
    const { error: profilesDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('tenant_id', tenant_id);

    if (profilesDeleteError) {
      console.error("Supabase Delete Profiles Error:", profilesDeleteError);
      throw new Error(`Erro ao deletar perfis do tenant: ${profilesDeleteError.message}`);
    }

    // 2. Deletar guardiões associados a este tenant
    const { error: guardiansDeleteError } = await supabaseAdmin
      .from('guardians')
      .delete()
      .eq('tenant_id', tenant_id);

    if (guardiansDeleteError) {
      console.error("Supabase Delete Guardians Error:", guardiansDeleteError);
      throw new Error(`Erro ao deletar guardiões do tenant: ${guardiansDeleteError.message}`);
    }

    // 3. Deletar o tenant. As tabelas com FK para 'tenants' e 'ON DELETE CASCADE'
    // (students, classes, courses, subjects, employees, revenues, expenses, documents, grades, etc.)
    // serão automaticamente deletadas pelo banco de dados.
    const { error: tenantDeleteError } = await supabaseAdmin
      .from('tenants')
      .delete()
      .eq('id', tenant_id);

    if (tenantDeleteError) {
      console.error("Supabase Delete Tenant Error:", tenantDeleteError);
      throw new Error(`Erro ao deletar o tenant: ${tenantDeleteError.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("Edge Function CATCH block error (delete-tenant):", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});