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
    const body = await req.json();
    const { tenant_id, full_name, birth_date, phone, email } = body;
    
    console.log("Pre-enrollment received body:", JSON.stringify(body, null, 2));

    // --- Validação Robusta ---
    if (!tenant_id) {
      throw new Error("Identificador da escola (tenant_id) ausente.");
    }
    if (!full_name || !birth_date || !phone) {
      throw new Error("Campos obrigatórios ausentes: nome, data de nascimento e telefone.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // --- Chamada Atômica para o Banco de Dados ---
    const { data: registration_code, error: rpcError } = await supabaseAdmin.rpc(
        'create_pre_enrolled_student', 
        { 
            p_tenant_id: tenant_id,
            p_full_name: full_name,
            p_birth_date: birth_date,
            p_phone: phone,
            p_email: email || null,
        }
    );

    if (rpcError) {
        console.error("Supabase RPC Error:", JSON.stringify(rpcError, null, 2));
        throw new Error(`Erro ao cadastrar pré-matrícula: ${rpcError.message}`);
    }

    // --- Sucesso ---
    return new Response(JSON.stringify({
      success: true,
      registration_code: registration_code,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // --- Capturar Todos os Erros ---
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("Edge Function CATCH block error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});