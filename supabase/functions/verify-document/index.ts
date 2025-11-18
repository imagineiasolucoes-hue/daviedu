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
    const { token } = await req.json();

    if (!token) {
      throw new Error("Token de verificação é obrigatório.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Buscar o document_id usando o token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('document_verification_tokens')
      .select('document_id, is_active')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData || !tokenData.is_active) {
      throw new Error("Token inválido ou inativo.");
    }

    const documentId = tokenData.document_id;

    // 2. Buscar os detalhes do documento (que contém o student_id)
    const { data: documentDetails, error: documentError } = await supabaseAdmin
      .from('documents')
      .select('related_entity_id, tenant_id, document_type')
      .eq('id', documentId)
      .single();

    if (documentError || !documentDetails || documentDetails.document_type !== 'transcript') {
      throw new Error("Documento não encontrado ou não é um histórico escolar.");
    }

    const studentId = documentDetails.related_entity_id;
    const tenantId = documentDetails.tenant_id;

    if (!studentId || !tenantId) {
      throw new Error("ID do aluno ou da escola não encontrado no documento.");
    }

    // 3. Buscar dados do aluno
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from('students')
      .select(`
        id, 
        full_name, 
        registration_code, 
        birth_date, 
        tenant_id, 
        class_id,
        course_id,
        created_at,
        gender,
        nationality,
        naturality,
        cpf,
        rg,
        phone,
        email,
        classes (
          id,
          name, 
          school_year
        ),
        courses (name),
        student_guardians (
          guardians (
            full_name,
            relationship,
            phone,
            email
          )
        )
      `)
      .eq('id', studentId)
      .single();

    if (studentError) {
      console.error("Supabase Student Fetch Error:", studentError);
      throw new Error(`Erro ao buscar dados do aluno: ${studentError.message}`);
    }
    
    // Processar guardiões
    const student = studentData as any;
    student.guardians = student.student_guardians?.map((sg: any) => sg.guardians).filter(Boolean) || [];
    delete student.student_guardians;


    // 4. Buscar dados do tenant
    const { data: tenantData, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('name, config')
      .eq('id', tenantId)
      .single();

    if (tenantError) {
      console.error("Supabase Tenant Fetch Error:", tenantError);
      throw new Error(`Erro ao buscar dados da escola: ${tenantError.message}`);
    }

    // 5. Buscar notas do aluno
    const { data: gradesData, error: gradesError } = await supabaseAdmin
      .from('grades')
      .select(`subject_name, grade_value, assessment_type, period, date_recorded`)
      .eq('student_id', studentId)
      .order('period')
      .order('subject_name');

    if (gradesError) {
      console.error("Supabase Grades Fetch Error:", gradesError);
      throw new Error(`Erro ao buscar notas do aluno: ${gradesError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      student: student,
      tenant: tenantData,
      grades: gradesData,
      documentId: documentId, // Retorna o ID do documento original
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("Edge Function CATCH block error (verify-document):", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});