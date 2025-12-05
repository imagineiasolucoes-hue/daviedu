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
    const { tenant_id, days_to_add } = await req.json();

    if (!tenant_id || typeof days_to_add !== 'number' || days_to_add <= 0) {
      throw new Error("ID da escola e número de dias válidos são obrigatórios.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Buscar a data de expiração atual e o status
    const { data: tenantData, error: fetchError } = await supabaseAdmin
      .from('tenants')
      .select('status, trial_expires_at')
      .eq('id', tenant_id)
      .single();

    if (fetchError) {
      throw new Error(`Erro ao buscar dados da escola: ${fetchError.message}`);
    }
    
    if (tenantData.status === 'active') {
        throw new Error("Não é possível estender o trial de uma escola com status 'active'.");
    }

    // 2. Calcular a nova data de expiração
    const currentDate = tenantData.trial_expires_at ? new Date(tenantData.trial_expires_at) : new Date();
    
    // Se a data atual já expirou, começamos a contagem a partir de agora.
    // Se a data atual ainda está no futuro, adicionamos os dias a partir dela.
    const baseDate = currentDate > new Date() ? currentDate : new Date();
    
    baseDate.setDate(baseDate.getDate() + days_to_add);
    const newExpirationDate = baseDate.toISOString();

    // 3. Atualizar a data de expiração
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('tenants')
      .update({ 
        trial_expires_at: newExpirationDate,
        status: 'trial' // Garante que o status volte para trial se estava expirado
      })
      .eq('id', tenant_id)
      .select('id, trial_expires_at')
      .single();

    if (updateError) {
      throw new Error(`Erro ao atualizar a data de expiração: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ success: true, newExpirationDate: updateData.trial_expires_at }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("Edge Function CATCH block error (extend-tenant-trial):", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});