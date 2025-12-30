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

async function sha256hex(message: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

    // Compute hash of provided token and query by token_hash
    const token_hash = await sha256hex(token);

    // 1. Buscar o document_id usando the token_hash
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('document_verification_tokens')
      .select('document_id, is_active')
      .eq('token_hash', token_hash)
      .single();

    if (tokenError || !tokenData || !tokenData.is_active) {
      throw new Error("Token inválido ou inativo.");
    }

    const documentId = tokenData.document_id;

    // 2. Buscar os detalhes do documento (que contém o student_id e o tipo de documento)
    const { data: documentDetails, error: documentError } = await supabaseAdmin
      .from('documents')
      .select('related_entity_id, tenant_id, document_type')
      .eq('id', documentId)
      .single();

    if (documentError || !documentDetails || 
        (documentDetails.document_type !== 'transcript' && documentDetails.document_type !== 'report_card')) {
      throw new Error("Documento não encontrado ou não é um histórico escolar ou boletim.");
    }

    const studentId = documentDetails.related_entity_id;
    const tenantId = documentDetails.tenant_id;
    const documentType = documentDetails.document_type; // Captura o tipo de documento

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

    // 5. Buscar resumo acadêmico usando a função SQL
    const { data: academicSummaryData, error: academicSummaryError } = await supabaseAdmin.rpc(
        'calculate_student_academic_summary', 
        { p_student_id: studentId }
    );

    if (academicSummaryError) {
      console.error("Supabase Academic Summary RPC Error:", academicSummaryError);
      throw new Error(`Erro ao calcular resumo acadêmico: ${academicSummaryError.message}`);
    }
    
    // O resultado é um objeto JSONB que contém 'subjects' e 'periods'
    const academicSummary = academicSummaryData;

    return new Response(JSON.stringify({
      success: true,
      student: student,
      tenant: tenantData,
      academicSummary: academicSummary, // Retorna o resumo processado
      documentId: documentId,
      documentType: documentType,
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