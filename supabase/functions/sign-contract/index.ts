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
    const { document_id, tenant_id, student_id } = await req.json();

    if (!document_id || !tenant_id || !student_id) {
      throw new Error("ID do documento, ID da escola e ID do aluno são obrigatórios.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Manual authentication: Verify JWT and get user ID
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: userAuth, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !userAuth.user) {
      console.error("Auth Error:", authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userAuth.user.id;

    // Verify that the user signing is the student related to the document
    const { data: studentProfile, error: studentProfileError } = await supabaseAdmin
      .from('students')
      .select('id, user_id')
      .eq('id', student_id)
      .eq('tenant_id', tenant_id)
      .single();

    if (studentProfileError || !studentProfile || studentProfile.user_id !== userId) {
      console.error("Student Profile Error or Mismatch:", studentProfileError?.message, "Student ID:", student_id, "User ID:", userId);
      throw new Error("Apenas o aluno relacionado pode assinar este contrato.");
    }

    // Update the document status
    const { data, error } = await supabaseAdmin
      .from('documents')
      .update({ 
        status: 'signed',
        signed_at: new Date().toISOString(),
        signed_by_profile_id: userId,
      })
      .eq('id', document_id)
      .eq('tenant_id', tenant_id) // Security check
      .eq('related_entity_id', student_id) // Ensure it's the correct student's document
      .select('id, status')
      .single();

    if (error) {
      console.error("Supabase Update Error (documents):", error);
      throw new Error(`Erro ao assinar o contrato: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true, updatedDocument: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("Edge Function CATCH block error (sign-contract):", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});