declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
// @ts-ignore
import { format } from "https://deno.land/std@0.190.0/datetime/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Este é um placeholder para matrículas públicas.
// Em um aplicativo multi-tenant real, isso seria determinado a partir de um parâmetro de URL
// ou um identificador público que mapeia para um tenant real.
const PUBLIC_ENROLLMENT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

async function generateNextRegistrationCode(supabaseAdmin: any, tenantId: string): Promise<string> {
    const currentYear = new Date().getFullYear().toString();
    const prefix = currentYear;

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
        const lastSequenceStr = lastCode.slice(-3);
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

    // --- Validação Robusta ---
    if (!body.full_name || !body.birth_date || !body.phone) {
      throw new Error("Campos obrigatórios ausentes: nome, data de nascimento e telefone.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // --- Gerar Código de Matrícula ---
    const registration_code = await generateNextRegistrationCode(supabaseAdmin, PUBLIC_ENROLLMENT_TENANT_ID);

    // --- Preparar Dados para Inserção ---
    const studentData = {
      tenant_id: PUBLIC_ENROLLMENT_TENANT_ID,
      registration_code: registration_code,
      status: "pre-enrolled",
      full_name: body.full_name,
      birth_date: body.birth_date,
      phone: body.phone,
      email: body.email || null,
      gender: body.gender || null,
      nationality: body.nationality || null,
      naturality: body.naturality || null,
      cpf: body.cpf || null,
      rg: body.rg || null,
      zip_code: body.zip_code || null,
      address_street: body.address_street || null,
      address_number: body.address_number || null,
      address_neighborhood: body.address_neighborhood || null,
      address_city: body.address_city || null,
      address_state: body.address_state || null,
      guardian_name: body.guardian_name || null,
      special_needs: body.special_needs || null,
      medication_use: body.medication_use || null,
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