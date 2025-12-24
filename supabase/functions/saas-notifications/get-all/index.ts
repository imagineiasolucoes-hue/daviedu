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
      console.error("Permission Error: User role not allowed to view all notifications.", profileData?.role);
      return new Response(JSON.stringify({ error: 'Forbidden: Only Super Admins can view all notifications' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: notifications, error } = await supabaseAdmin
      .from('saas_notifications')
      .select(`
        id,
        title,
        content,
        image_url,
        external_link,
        published_at,
        target_tenant_id,
        target_role,
        is_global,
        created_by,
        created_at,
        tenants (name)
      `)
      .order('published_at', { ascending: false });

    if (error) {
      console.error("Supabase Fetch Error (saas_notifications):", error);
      throw new Error(`Erro ao buscar notificações: ${error.message}`);
    }
    
    // Mapear para incluir o nome do tenant
    const formattedNotifications = notifications.map(n => ({
        ...n,
        tenant_name: n.tenants?.name || null,
    }));

    return new Response(JSON.stringify({ success: true, notifications: formattedNotifications }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("Edge Function CATCH block error (get-all-saas-notifications):", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});