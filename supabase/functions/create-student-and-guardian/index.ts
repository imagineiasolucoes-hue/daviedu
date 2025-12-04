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

async function generateNextRegistrationCode(supabaseAdmin: any, tenantId: string, schoolYear: number): Promise<string> {
    const prefix = String(schoolYear); // O prefixo agora é apenas o ano letivo (ex: 2024)

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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Edge Function Input Body:", JSON.stringify(body, null, 2)); // LOG DE DEBUG

    const { tenant_id, school_year, student: studentInfo, guardian: guardianInfo } = body;

    // --- Validação ---
    if (!tenant_id || !school_year || !studentInfo || !guardianInfo) {
      throw new Error("Dados incompletos para aluno, escola ou responsável.");
    }
    // Verificação de campos obrigatórios do aluno
    if (!studentInfo.full_name || !studentInfo.birth_date || !studentInfo.class_id || !studentInfo.course_id) { 
      throw new Error("Campos obrigatórios do aluno ausentes: nome, data de nascimento, turma e série/ano.");
    }
    if (!guardianInfo.guardian_full_name || !guardianInfo.guardian_relationship) {
      throw new Error("Campos obrigatórios do responsável ausentes: nome e parentesco.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let studentId: string;
    let registration_code: string = ''; // Inicializa para garantir que esteja definida
    const maxRetries = 3; // Número máximo de tentativas
    let attempts = 0;

    // Loop de re-tentativa para geração e inserção do aluno
    while (attempts < maxRetries) {
      attempts++;
      try {
        // 1. Gerar Código de Matrícula
        registration_code = await generateNextRegistrationCode(supabaseAdmin, tenant_id, school_year);

        // 2. Preparar e Inserir Aluno
        const studentDataToInsert = {
          ...studentInfo,
          tenant_id: tenant_id,
          registration_code: registration_code,
          status: "active",
          course_id: studentInfo.course_id, // Inserindo o course_id
        };

        const { data: studentResult, error: studentInsertError } = await supabaseAdmin
          .from("students")
          .insert(studentDataToInsert)
          .select("id")
          .single();

        if (studentInsertError) {
          // Se o erro for de chave duplicada, tenta novamente
          if (studentInsertError.code === "23505") {
            console.warn(`Tentativa ${attempts}: Código de matrícula duplicado ${registration_code}. Re-tentando...`);
            // Pequeno delay para evitar nova colisão imediata (opcional, mas útil)
            await new Promise(resolve => setTimeout(resolve, 100 * attempts)); 
            continue; // Volta para o início do loop
          } else {
            // Para outros erros, lança imediatamente
            console.error("Supabase Student Insert Error:", JSON.stringify(studentInsertError, null, 2));
            throw new Error(`Erro ao cadastrar aluno: ${studentInsertError.message}`);
          }
        }

        studentId = studentResult.id;
        break; // Sucesso, sai do loop
      } catch (e) {
        // Se o erro não for de chave duplicada, ou se as re-tentativas acabaram, lança o erro
        if (attempts === maxRetries || !(e instanceof Error && e.message.includes("duplicate key value violates unique constraint"))) {
          throw e;
        }
        console.warn(`Tentativa ${attempts}: Erro durante a inserção do aluno. Re-tentando...`, e.message);
      }
    }

    // Se o loop terminou sem sucesso (studentId não foi definido), significa que todas as re-tentativas falharam
    if (!studentId) {
        throw new Error("Falha ao gerar um código de matrícula único após várias tentativas.");
    }

    // 3. Preparar e Inserir Responsável
    const guardianDataToInsert = {
      tenant_id: tenant_id,
      full_name: guardianInfo.guardian_full_name,
      phone: guardianInfo.guardian_phone,
      email: guardianInfo.guardian_email,
      cpf: guardianInfo.guardian_cpf,
      relationship: guardianInfo.guardian_relationship,
    };

    const { data: guardianResult, error: guardianInsertError } = await supabaseAdmin
      .from("guardians")
      .insert(guardianDataToInsert)
      .select("id")
      .single();

    if (guardianInsertError) {
      console.error("Supabase Guardian Insert Error:", JSON.stringify(guardianInsertError, null, 2));
      throw new Error(`Erro ao cadastrar responsável: ${guardianInsertError.message}`);
    }

    const guardianId = guardianResult.id;

    // 4. Vincular Aluno e Responsável (Definir como principal)
    const { error: linkError } = await supabaseAdmin
      .from("student_guardians")
      .insert({
        student_id: studentId,
        guardian_id: guardianId,
        is_primary: true,
      });

    if (linkError) {
      console.error("Supabase Link Error:", JSON.stringify(linkError, null, 2));
      throw new Error(`Erro ao vincular responsável ao aluno: ${linkError.message}`);
    }

    // 5. Sucesso
    return new Response(JSON.stringify({
      success: true,
      studentId: studentId,
      registration_code: registration_code,
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