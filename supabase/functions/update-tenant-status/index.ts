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
    console.log("update-tenant-status: Incoming payload:", { tenant_id, new_status }); // Log adicionado

    if (!tenant_id || !new_status) {
      throw new Error("ID da escola e novo status são obrigatórios.");
    }

    const validStatuses = ['active', 'suspended', 'trial'];
    if (!validStatuses.includes(new_status)) {
      throw new Error("Status inválido.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data, error } = await supabaseAdmin
      .from('tenants')
      .update({ 
        status: new_status,
        // Se o status for ativado, removemos a data de expiração do trial
        trial_expires_at: new_status === 'active' ? null : undefined 
      })
      .eq('id', tenant_id)
      .select('id, status')
      .single();

    if (error) {
      console.error("update-tenant-status: Supabase update error:", error); // Log mais específico
      throw new Error(`Erro ao atualizar o status da escola: ${error.message}`);
    }
    console.log("update-tenant-status: Supabase update successful, data:", data); // Log adicionado

    return new Response(JSON.stringify({ success: true, updatedTenant: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("update-tenant-status: Edge Function CATCH block error:", errorMessage); // Log mais específico
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});