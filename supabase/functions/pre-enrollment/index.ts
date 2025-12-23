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
    const prefix = String(year);

    // Busca o último código de matrícula para o ano atual, ordenado de forma decrescente
    const { data, error } = await supabaseAdmin
        .from("students")
        .select("registration_code")
        .eq("tenant_id", tenantId)
        .like("registration_code", `${prefix}%`)
        .order("registration_code", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error(`[generateNextRegistrationCode] Error fetching last registration code:`, error);
        throw new Error(`Falha ao buscar o último código de matrícula: ${error.message}`);
    }

    let nextSequence = 1;

    if (data?.registration_code) {
        const lastCode = data.registration_code;
        // Extrai a parte da sequência (assumindo YYYYSSSS, onde SSSS é a sequência)
        const sequenceStr = lastCode.substring(prefix.length); 
        const lastSequence = parseInt(sequenceStr, 10);

        if (!isNaN(lastSequence)) {
            nextSequence = lastSequence + 1;
        }
    }
    
    // Garante que a sequência comece em 1000 se for muito baixa (para manter 4 dígitos)
    if (nextSequence < 1000) {
        nextSequence = 1000;
    }
    
    // Usa 4 dígitos para a sequência
    const nextSequenceStr = String(nextSequence).padStart(4, '0');
    const newRegistrationCode = `${prefix}${nextSequenceStr}`;
    return newRegistrationCode;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { tenant_id, ...studentInfo } = body;
    
    console.log("Pre-enrollment received body:", JSON.stringify(body, null, 2));

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
    let studentId: string;
    const maxRetries = 15; // Aumentado para 15
    let attempts = 0;

    // --- Loop de Re-tentativa para Inserção ---
    while (attempts < maxRetries) {
      attempts++;
      try {
        // 1. Gerar Código de Matrícula
        registration_code = await generateNextRegistrationCode(supabaseAdmin, tenant_id);

        // 2. Preparar Dados para Inserção
        const studentData = {
          ...studentInfo,
          tenant_id: tenant_id,
          registration_code: registration_code,
          status: "pre-enrolled",
          email: studentInfo.email || null,
          // Garante que class_id e course_id sejam NULL se não estiverem no payload (o que é esperado na pré-matrícula)
          class_id: studentInfo.class_id || null, 
          course_id: studentInfo.course_id || null,
        };
        
        console.log(`Pre-enrollment inserting data (Attempt ${attempts}):`, JSON.stringify(studentData, null, 2));

        // 3. Inserir no Banco de Dados
        const { data, error: insertError } = await supabaseAdmin
          .from("students")
          .insert(studentData)
          .select("id, registration_code")
          .single();

        if (insertError) {
          // Se o erro for de violação de chave única, tentamos novamente
          if (insertError.code === "23505") {
            console.warn(`[pre-enrollment] Tentativa ${attempts}: Código de matrícula duplicado ${registration_code}. Re-tentando...`);
            // Adiciona um atraso aleatório (jitter) para mitigar race conditions
            const delay = Math.floor(Math.random() * 1000) + 100; // 100ms a 1100ms
            await new Promise(resolve => setTimeout(resolve, delay)); 
            continue;
          } else {
            // Outros erros de inserção
            console.error("Supabase Insert Error:", JSON.stringify(insertError, null, 2));
            throw new Error(`Erro no banco de dados: ${insertError.message} (Código: ${insertError.code})`);
          }
        }

        studentId = data.id;
        registration_code = data.registration_code;
        break; // Sucesso, sai do loop
      } catch (e) {
        if (attempts === maxRetries) {
          throw e; // Lança o erro se as tentativas acabarem
        }
        // Se for um erro que não é 23505, ele será lançado acima.
        // Se for 23505, o loop continua.
        console.error(`[pre-enrollment] Tentativa ${attempts}: Erro inesperado no loop.`, e.message);
        if (!(e instanceof Error && e.message.includes("duplicate key value violates unique constraint"))) {
            await new Promise(resolve => setTimeout(resolve, 100)); 
        }
      }
    }

    if (!studentId) {
        throw new Error("Falha ao gerar um código de matrícula único após várias tentativas.");
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