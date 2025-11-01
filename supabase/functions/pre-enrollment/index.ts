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

async function generateNextRegistrationCode(supabaseAdmin: any, tenantId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const prefix = String(year); // O prefixo agora é apenas o ano letivo (ex: 2024)

    const { data, error } = await supabaseAdmin
        .from("students")
        .select("registration_code")
        .eq("tenant_id", tenantId)
        .like("registration_code", `${prefix}%`)
        .order("registration_code", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("Error fetching last registration code:", error);
        throw new Error(`Falha ao buscar o último código de matrícula: ${error.message}`);
    }

    let nextSequence = 1;

    if (data?.registration_code) {
        const lastCode = data.registration_code;
        // Assume que o código é YYYYSSS (Ano + Sequência de 3 dígitos)
        const lastSequenceStr = lastCode.substring(4); 
        const lastSequence = parseInt(lastSequenceStr, 10);

        if (!isNaN(lastSequence)) {
            nextSequence = lastSequence + 1;
        }
    }

    const nextSequenceStr = String(nextSequence).padStart(3, '0');
    return `${prefix}${nextSequenceStr}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { tenant_id, ...studentInfo } = body;

    // --- Validação Robusta ---
    if (!tenant_id) {
      throw new Error("Identificador da escola (tenant_id) ausente.");
    }
    if (!studentInfo.full_name || !studentInfo.birth_date || !studentInfo.phone) {
      throw new Error("Campos obrigatórios ausentes: nome, data de nascimento e telefone.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // --- Gerar Código de Matrícula ---
    const registration_code = await generateNextRegistrationCode(supabaseAdmin, tenant_id);

    // --- Preparar Dados para Inserção ---
    const studentData = {
      ...studentInfo,
      tenant_id: tenant_id,
      registration_code: registration_code,
      status: "pre-enrolled",
    };

    // --- Inserir no Banco de Dados ---
    const { data, error: insertError } = await supabaseAdmin
      .from("students")
      .insert(studentData)
      .select("registration_code")
      .single();

    if (insertError) {
      console.error("Supabase Insert Error:", JSON.stringify(insertError, null, 2));
      throw new Error(`Erro no banco de dados: ${insertError.message} (Código: ${insertError.code})`);
    }

    // --- Sucesso ---
    return new Response(JSON.stringify({
      success: true,
      registration_code: data.registration_code,
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