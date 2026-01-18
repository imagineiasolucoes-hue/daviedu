import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the anon key for public access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { 'Authorization': req.headers.get('Authorization')! } },
      }
    );

    const { token } = await req.json();

    if (!token) {
      console.error("[verify-document] Missing token in request body.");
      return new Response(JSON.stringify({ error: 'Token is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 1. Find the document by verification_link
    const { data: documentData, error: documentError } = await supabaseClient
      .from('documents')
      .select(`
        id,
        document_type,
        related_entity_id,
        tenant_id,
        status,
        signed_at,
        signed_by_guardian_id,
        school_signed_at,
        school_signed_by_profile_id
      `)
      .eq('verification_link', token)
      .single();

    if (documentError || !documentData) {
      console.error("[verify-document] Document not found or error fetching document:", documentError?.message || "No document data");
      return new Response(JSON.stringify({ error: 'Document not found or invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const studentId = documentData.related_entity_id;
    const tenantId = documentData.tenant_id;

    if (!studentId || !tenantId) {
      console.error("[verify-document] Missing student_id or tenant_id in document data.");
      return new Response(JSON.stringify({ error: 'Document data incomplete' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // 2. Fetch student details
    const { data: studentRaw, error: studentError } = await supabaseClient
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
            id,
            full_name,
            relationship,
            phone,
            email,
            cpf
          )
        )
      `)
      .eq('id', studentId)
      .single();

    if (studentError || !studentRaw) {
      console.error("[verify-document] Error fetching student data:", studentError?.message || "No student data");
      return new Response(JSON.stringify({ error: 'Student data not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Flatten guardians data
    const student = {
      ...studentRaw,
      guardians: studentRaw.student_guardians?.map((sg: any) => sg.guardians).filter(Boolean) || [],
    };
    delete (student as any).student_guardians;


    // 3. Fetch tenant details
    const { data: tenantData, error: tenantError } = await supabaseClient
      .from('tenants')
      .select('name, config')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenantData) {
      console.error("[verify-document] Error fetching tenant data:", tenantError?.message || "No tenant data");
      return new Response(JSON.stringify({ error: 'Tenant data not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // 4. Calculate academic summary (using the existing Supabase function)
    // This is optional for contract verification, so we handle errors gracefully
    const { data: academicSummaryData, error: academicSummaryError } = await supabaseClient.rpc(
      'calculate_student_academic_summary',
      { p_student_id: studentId }
    );

    if (academicSummaryError) {
      console.warn("[verify-document] Could not calculate academic summary:", academicSummaryError.message);
      // Provide a default empty structure if calculation fails
    }

    const academicSummary = academicSummaryData || { subjects: [], periods: [] };

    const verificationData = {
      success: true,
      documentId: documentData.id,
      student,
      tenant: tenantData,
      academicSummary,
    };

    console.log(`[verify-document] Document ${documentData.id} verified successfully.`);

    return new Response(JSON.stringify(verificationData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("[verify-document] General error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});