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
    const { title, content, image_url, external_link, target_tenant_id, target_role, is_global } = await req.json();

    // Autenticação e verificação de Super Admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), {
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
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userAuth.user.id;

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError || !profileData || profileData.role !== 'super_admin') {
      console.error("Permission Error: User role not allowed to create notifications.", profileData?.role);
      return new Response(JSON.stringify({ error: 'Forbidden: Only Super Admins can create notifications' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validação de campos
    if (!title || !content) {
      throw new Error("Título e conteúdo são obrigatórios.");
    }

    // Lógica para is_global e target_tenant_id/target_role
    let finalIsGlobal = is_global ?? true;
    let finalTargetTenantId = target_tenant_id || null;
    let finalTargetRole = target_role || null;

    if (finalIsGlobal) {
        finalTargetTenantId = null;
        finalTargetRole = null;
    } else if (!finalTargetTenantId) {
        throw new Error("Para notificações não globais, um ID de escola (target_tenant_id) é obrigatório.");
    }

    const { data, error } = await supabaseAdmin
      .from('saas_notifications')
      .insert({
        title,
        content,
        image_url: image_url || null,
        external_link: external_link || null,
        target_tenant_id: finalTargetTenantId,
        target_role: finalTargetRole,
        is_global: finalIsGlobal,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase Insert Error (saas_notifications):", error);
      throw new Error(`Erro ao criar notificação: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true, notification: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("Edge Function CATCH block error (create-saas-notification):", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});