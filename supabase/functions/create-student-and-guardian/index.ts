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

    // 1. Gerar Código de Matrícula
    const registration_code = await generateNextRegistrationCode(supabaseAdmin, tenant_id, school_year);

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
      console.error("Supabase Student Insert Error:", JSON.stringify(studentInsertError, null, 2));
      throw new Error(`Erro ao cadastrar aluno: ${studentInsertError.message}`);
    }

    const studentId = studentResult.id;

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
      // NOTA: Em um ambiente de produção, para garantir atomicidade, a criação do aluno
      // também deveria ser revertida se o responsável ou o vínculo falharem.
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
      // NOTA: Similarmente, se o vínculo falhar, a criação do aluno e do responsável
      // deveria ser revertida para manter a integridade dos dados.
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