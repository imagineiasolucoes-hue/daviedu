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

async function generateNextRegistrationCode(supabaseAdmin: any, tenantId: string, attempt: number): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const prefix = String(year); // O prefixo agora é apenas o ano letivo (ex: 2024)
    console.log(`[generateNextRegistrationCode] Attempt ${attempt}: Generating code for tenant ${tenantId}, year ${year}`);

    const { data, error } = await supabaseAdmin
        .from("students")
        .select("registration_code")
        .eq("tenant_id", tenantId)
        .like("registration_code", `${prefix}%`)
        .order("registration_code", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error(`[generateNextRegistrationCode] Error fetching last registration code (Attempt ${attempt}):`, error);
        throw new Error(`Falha ao buscar o último código de matrícula: ${error.message}`);
    }

    let nextSequence = 1;

    if (data?.registration_code) {
        const lastCode = data.registration_code;
        // Assume que o código é YYYYSSSS (Ano + Sequência de 4 dígitos)
        const sequenceStr = lastCode.substring(prefix.length); 
        const lastSequence = parseInt(sequenceStr, 10);

        if (!isNaN(lastSequence)) {
            nextSequence = lastSequence + 1;
        }
    }
    
    // Garante que a sequência comece em 1000 se for muito baixa (para evitar colisões com códigos antigos de 3 dígitos)
    if (nextSequence < 1000) {
        nextSequence = 1000;
    }

    const nextSequenceStr = String(nextSequence).padStart(4, '0'); // Padronizado para 4 dígitos
    const newRegistrationCode = `${prefix}${nextSequenceStr}`;
    console.log(`[generateNextRegistrationCode] Attempt ${attempt}: Generated new code: ${newRegistrationCode}`);
    return newRegistrationCode;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("[pre-enrollment] Incoming request body:", JSON.stringify(body, null, 2)); // Log do corpo da requisição

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

    let registration_code: string = '';
    const maxRetries = 5; 
    let attempts = 0;

    // Loop de re-tentativa para geração e inserção do aluno
    while (attempts < maxRetries) {
      attempts++;
      try {
        // 1. Gerar Código de Matrícula
        registration_code = await generateNextRegistrationCode(supabaseAdmin, tenant_id, attempts);

        // 2. Preparar Dados para Inserção
        const studentData = {
          ...studentInfo,
          tenant_id: tenant_id,
          registration_code: registration_code,
          status: "pre-enrolled",
          // Garante que birth_date seja null se for uma string vazia, para evitar erro de tipo DATE
          birth_date: studentInfo.birth_date === "" ? null : studentInfo.birth_date,
          // Garante que email seja null se for uma string vazia
          email: studentInfo.email === "" ? null : studentInfo.email,
        };
        console.log("[pre-enrollment] Student data to insert:", JSON.stringify(studentData, null, 2)); // Log dos dados a serem inseridos

        // 3. Inserir no Banco de Dados
        const { data, error: insertError } = await supabaseAdmin
          .from("students")
          .insert(studentData)
          .select("registration_code")
          .single();

        if (insertError) {
          if (insertError.code === "23505") { // Código de erro para violação de chave única
            console.warn(`[pre-enrollment] Tentativa ${attempts}: Código de matrícula duplicado ${registration_code}. Re-tentando...`);
            await new Promise(resolve => setTimeout(resolve, 100 * attempts)); // Pequeno delay antes de re-tentar
            continue; // Tenta novamente
          } else {
            console.error("[pre-enrollment] Supabase Insert Error:", JSON.stringify(insertError, null, 2));
            throw new Error(`Erro no banco de dados: ${insertError.message} (Código: ${insertError.code})`);
          }
        }

        // Se chegou aqui, a inserção foi bem-sucedida, sai do loop
        return new Response(JSON.stringify({
          success: true,
          registration_code: data.registration_code,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      } catch (e) {
        // Se o erro não for de violação de chave única ou se as tentativas acabaram, re-lança
        if (attempts === maxRetries || !(e instanceof Error && e.message.includes("duplicate key value violates unique constraint"))) {
          throw e;
        }
        console.warn(`[pre-enrollment] Tentativa ${attempts}: Erro durante a inserção do aluno. Re-tentando...`, e.message);
      }
    }

    // Se o loop terminar sem sucesso após todas as tentativas
    throw new Error("Falha ao gerar um código de matrícula único após várias tentativas.");

  } catch (error) {
    // --- Capturar Todos os Erros ---
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("[pre-enrollment] Edge Function CATCH block error:", error); // Log do objeto de erro completo
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});