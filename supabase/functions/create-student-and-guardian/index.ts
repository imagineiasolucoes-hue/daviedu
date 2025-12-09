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

async function generateNextRegistrationCode(supabaseAdmin: any, tenantId: string, schoolYear: number, attempt: number): Promise<string> {
    const prefix = String(schoolYear);
    console.log(`[generateNextRegistrationCode] Attempt ${attempt}: Generating code for tenant ${tenantId}, year ${schoolYear}`);

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
    
    console.log(`[generateNextRegistrationCode] Attempt ${attempt}: Next sequence: ${nextSequence}`);

    // Usa 4 dígitos para a sequência
    const nextSequenceStr = String(nextSequence).padStart(4, '0');
    const newRegistrationCode = `${prefix}${nextSequenceStr}`;
    console.log(`[generateNextRegistrationCode] Attempt ${attempts}: Generated new code: ${newRegistrationCode}`);
    return newRegistrationCode;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { tenant_id, school_year, student: studentInfo, guardian: guardianInfo } = body;

    // --- 0. AUTENTICAÇÃO E VERIFICAÇÃO DE PERMISSÃO ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado: Token de autenticação ausente." }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: userAuth, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !userAuth.user) {
      console.error("Auth Error:", authError?.message);
      return new Response(JSON.stringify({ error: "Não autorizado: Token inválido ou expirado." }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userAuth.user.id;

    // Verificar se o usuário tem permissão (Admin ou Secretary)
    const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', userId)
        .single();

    if (profileError || !profileData || !['admin', 'secretary'].includes(profileData.role)) {
        console.error("Permission Denied: User role not allowed to create students.", profileData?.role);
        return new Response(JSON.stringify({ error: "Permissão negada. Apenas administradores e secretários podem cadastrar alunos." }), {
            status: 403, // Forbidden
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    
    // Garantir que o tenant_id do payload corresponde ao tenant_id do usuário logado (segurança extra)
    if (profileData.tenant_id !== tenant_id) {
        console.error("Security Alert: Tenant ID mismatch.", { userTenant: profileData.tenant_id, payloadTenant: tenant_id });
        return new Response(JSON.stringify({ error: "Erro de segurança: ID da escola não corresponde ao usuário logado." }), {
            status: 403, // Forbidden
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    // --- FIM DA VERIFICAÇÃO DE PERMISSÃO ---


    // --- Validação do Payload ---
    if (!tenant_id || !school_year || !studentInfo || !guardianInfo) {
      throw new Error("Dados incompletos para aluno, escola ou responsável.");
    }
    if (!studentInfo.full_name || !studentInfo.birth_date || !studentInfo.class_id || !studentInfo.course_id) { 
      throw new Error("Campos obrigatórios do aluno ausentes: nome, data de nascimento, turma e série/ano.");
    }
    if (!guardianInfo.guardian_full_name || !guardianInfo.guardian_relationship) {
      throw new Error("Campos obrigatórios do responsável ausentes: nome e parentesco.");
    }

    let studentId: string;
    let registration_code: string = '';
    const maxRetries = 5; 
    let attempts = 0;

    // Loop de re-tentativa para geração e inserção do aluno
    while (attempts < maxRetries) {
      attempts++;
      try {
        // 1. Gerar Código de Matrícula
        registration_code = await generateNextRegistrationCode(supabaseAdmin, tenant_id, school_year, attempts);

        // 2. Preparar e Inserir Aluno
        const studentDataToInsert = {
          ...studentInfo,
          tenant_id: tenant_id,
          registration_code: registration_code,
          status: "active",
          course_id: studentInfo.course_id,
        };

        const { data: studentResult, error: studentInsertError } = await supabaseAdmin
          .from("students")
          .insert(studentDataToInsert)
          .select("id")
          .single();

        if (studentInsertError) {
          if (studentInsertError.code === "23505") {
            console.warn(`[create-student-and-guardian] Tentativa ${attempts}: Código de matrícula duplicado ${registration_code}. Re-tentando...`);
            await new Promise(resolve => setTimeout(resolve, 100 * attempts)); 
            continue;
          } else {
            console.error("[create-student-and-guardian] Supabase Student Insert Error:", JSON.stringify(studentInsertError, null, 2));
            throw new Error(`Erro ao cadastrar aluno: ${studentInsertError.message}`);
          }
        }

        studentId = studentResult.id;
        break;
      } catch (e) {
        if (attempts === maxRetries || !(e instanceof Error && e.message.includes("duplicate key value violates unique constraint"))) {
          throw e;
        }
        console.warn(`[create-student-and-guardian] Tentativa ${attempts}: Erro durante a inserção do aluno. Re-tentando...`, e.message);
      }
    }

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
      console.error("[create-student-and-guardian] Supabase Guardian Insert Error:", JSON.stringify(guardianInsertError, null, 2));
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
      console.error("[create-student-and-guardian] Supabase Link Error:", JSON.stringify(linkError, null, 2));
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