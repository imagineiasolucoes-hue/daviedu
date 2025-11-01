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
    const { tenant_id, new_status } = await req.json();

    if (!tenant_id || !new_status) {
      throw new Error("ID do tenant e novo status são obrigatórios.");
    }

    // Validate new_status to ensure it's one of the allowed values
    const allowedStatuses = ['active', 'suspended', 'trial'];
    if (!allowedStatuses.includes(new_status)) {
      throw new Error(`Status inválido: ${new_status}. Status permitidos: ${allowedStatuses.join(', ')}.`);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data, error } = await supabaseAdmin
      .from("tenants")
      .update({ status: new_status })
      .eq("id", tenant_id)
      .select("id, name, status")
      .single();

    if (error) {
      console.error("Supabase Update Tenant Status Error:", error);
      throw new Error(`Erro ao atualizar status da escola: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true, tenant: data }), {
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