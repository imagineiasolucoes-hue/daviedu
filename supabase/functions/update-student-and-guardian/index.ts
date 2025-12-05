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
      return new Response(JSON.stringify({ error: "Não autorizado: Token inválido ou expirado." }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userAuth.user.id;

    const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', userId)
        .single();

    if (profileError || !profileData || !['admin', 'secretary'].includes(profileData.role)) {
        throw new Error("Permissão negada. Apenas administradores e secretários podem editar alunos.");
    }
    
    if (profileData.tenant_id !== tenant_id) {
        throw new Error("Erro de segurança: ID da escola não corresponde ao usuário logado.");
    }
    // --- FIM DA VERIFICAÇÃO DE PERMISSÃO ---

    if (!student_id || !tenant_id || !studentInfo || !guardianInfo) {
      throw new Error("Dados incompletos para aluno, escola ou responsável.");
    }

    // 1. Buscar o ID do responsável principal atual
    const { data: linkData, error: linkFetchError } = await supabaseAdmin
        .from('student_guardians')
        .select('guardian_id')
        .eq('student_id', student_id)
        .eq('is_primary', true)
        .maybeSingle();

    if (linkFetchError) throw new Error(`Erro ao buscar responsável principal: ${linkFetchError.message}`);
    
    const guardianId = linkData?.guardian_id;
    if (!guardianId) {
        // Se não houver responsável principal, a edição falha (ou criamos um novo, mas por segurança, falhamos)
        throw new Error("Responsável principal não encontrado para este aluno. Não é possível editar.");
    }

    // 2. Atualizar Aluno
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

    // 3. Atualizar Responsável Principal
    const guardianUpdateData = {
      full_name: guardianInfo.guardian_full_name,
      phone: guardianInfo.guardian_phone || null,
      email: guardianInfo.guardian_email || null,
      cpf: guardianInfo.guardian_cpf || null,
      relationship: guardianInfo.guardian_relationship,
    };

    const { error: guardianUpdateError } = await supabaseAdmin
      .from("guardians")
      .update(guardianUpdateData)
      .eq("id", guardianId)
      .eq("tenant_id", tenant_id); // Security check

    if (guardianUpdateError) {
      console.error("Supabase Guardian Update Error:", guardianUpdateError);
      throw new Error(`Erro ao atualizar responsável: ${guardianUpdateError.message}`);
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