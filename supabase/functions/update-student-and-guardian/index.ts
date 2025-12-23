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
    const body = await req.json();
    const { tenant_id, student_id, student: studentInfo, guardian: guardianInfo } = body;

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
        return new Response(JSON.stringify({ error: "Permissão negada. Apenas administradores e secretários podem editar alunos." }), {
            status: 403, // Forbidden
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    
    if (profileData.tenant_id !== tenant_id) {
        console.error("Security Alert: Tenant ID mismatch.", { userTenant: profileData.tenant_id, payloadTenant: tenant_id });
        return new Response(JSON.stringify({ error: "Erro de segurança: ID da escola não corresponde ao usuário logado." }), {
            status: 403, // Forbidden
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    // --- FIM DA VERIFICAÇÃO DE PERMISSÃO ---

    if (!student_id || !tenant_id || !studentInfo || !guardianInfo) {
      throw new Error("Dados incompletos para aluno, escola ou responsável.");
    }

    // 1. Atualizar Aluno
    const studentUpdateData = {
        ...studentInfo,
        course_id: studentInfo.course_id || null,
        class_id: studentInfo.class_id || null,
        email: studentInfo.email || null,
        phone: studentInfo.phone || null,
        cpf: studentInfo.cpf || null,
        rg: studentInfo.rg || null,
        nationality: studentInfo.nationality || null,
        naturality: studentInfo.naturality || null,
        zip_code: studentInfo.zip_code || null,
        address_street: studentInfo.address_street || null,
        address_number: studentInfo.address_number || null,
        address_neighborhood: studentInfo.address_neighborhood || null,
        address_city: studentInfo.address_city || null,
        address_state: studentInfo.address_state || null,
        special_needs: studentInfo.special_needs || null,
        medication_use: studentInfo.medication_use || null,
    };

    const { error: studentUpdateError } = await supabaseAdmin
      .from("students")
      .update(studentUpdateData)
      .eq("id", student_id)
      .eq("tenant_id", tenant_id);

    if (studentUpdateError) {
      console.error("Supabase Student Update Error:", studentUpdateError);
      throw new Error(`Erro ao atualizar aluno: ${studentUpdateError.message}`);
    }

    // 2. Gerenciar Responsável Principal
    let currentGuardianId: string | null = null;

    // Tenta encontrar um responsável principal existente para este aluno
    const { data: existingGuardianLink, error: fetchLinkError } = await supabaseAdmin
        .from('student_guardians')
        .select('guardian_id')
        .eq('student_id', student_id)
        .eq('is_primary', true)
        .maybeSingle();

    if (fetchLinkError) {
        console.error("Error fetching existing guardian link:", fetchLinkError);
        throw new Error(`Erro ao buscar vínculo do responsável: ${fetchLinkError.message}`);
    }

    currentGuardianId = existingGuardianLink?.guardian_id || null;

    const guardianDataToProcess = {
        full_name: guardianInfo.guardian_full_name,
        phone: guardianInfo.guardian_phone || null,
        email: guardianInfo.guardian_email || null,
        cpf: guardianInfo.guardian_cpf || null,
        relationship: guardianInfo.guardian_relationship,
        tenant_id: tenant_id, // Garante que o tenant_id seja passado para a criação de um novo responsável
    };

    if (currentGuardianId) {
        // Se o responsável principal existe, atualiza
        const { error: guardianUpdateError } = await supabaseAdmin
            .from("guardians")
            .update(guardianDataToProcess)
            .eq("id", currentGuardianId)
            .eq("tenant_id", tenant_id); // Security check

        if (guardianUpdateError) {
            console.error("Supabase Guardian Update Error:", guardianUpdateError);
            throw new Error(`Erro ao atualizar responsável: ${guardianUpdateError.message}`);
        }
    } else {
        // Se não existe responsável principal, cria um novo e o vincula
        const { data: newGuardianResult, error: guardianInsertError } = await supabaseAdmin
            .from("guardians")
            .insert(guardianDataToProcess)
            .select("id")
            .single();

        if (guardianInsertError) {
            console.error("Supabase Guardian Insert Error:", guardianInsertError);
            throw new Error(`Erro ao cadastrar novo responsável: ${guardianInsertError.message}`);
        }
        currentGuardianId = newGuardianResult.id;

        // Vincula o novo responsável como principal
        const { error: linkNewGuardianError } = await supabaseAdmin
            .from("student_guardians")
            .insert({
                student_id: student_id,
                guardian_id: currentGuardianId,
                is_primary: true,
            });

        if (linkNewGuardianError) {
            console.error("Supabase Link New Guardian Error:", linkNewGuardianError);
            throw new Error(`Erro ao vincular novo responsável ao aluno: ${linkNewGuardianError.message}`);
        }
    }

    return new Response(JSON.stringify({ success: true, studentId: student_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("Edge Function CATCH block error (update-student-and-guardian):", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});