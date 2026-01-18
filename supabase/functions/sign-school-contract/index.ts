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
      console.error("[sign-school-contract] Auth Error:", authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userAuth.user.id;

    // Verify the role of the logged-in user (only admin or secretary can sign for the school)
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile || !['admin', 'secretary'].includes(userProfile.role)) {
      console.error("[sign-school-contract] Permission Error: User role not allowed to sign contracts for the school.", userProfile?.role);
      throw new Error("Apenas administradores ou secretários podem assinar contratos em nome da escola.");
    }

    // Update the document status to reflect school's signature
    const { data, error } = await supabaseAdmin
      .from('documents')
      .update({ 
        school_signed_at: new Date().toISOString(),
        school_signed_by_profile_id: userId, // The admin/secretary who performed the action
      })
      .eq('id', document_id)
      .eq('tenant_id', tenant_id) // Security check
      .eq('related_entity_id', student_id) // Ensure it's the correct student's document
      .select('id, school_signed_at')
      .single();

    if (error) {
      console.error("[sign-school-contract] Supabase Update Error (documents):", error);
      throw new Error(`Erro ao assinar o contrato pela escola: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true, updatedDocument: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("[sign-school-contract] Edge Function CATCH block error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});