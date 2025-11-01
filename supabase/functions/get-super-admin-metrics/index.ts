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
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Busca as métricas em paralelo para mais eficiência
    const [saasUsersCountResult, tenantsCountResult] = await Promise.all([
      // Usando a nova função para contar apenas usuários associados a tenants (SaaS)
      supabaseAdmin.rpc('count_saas_users'),
      supabaseAdmin.from("tenants").select("*", { count: "exact", head: true })
    ]);

    const { data: saasUsersCount, error: saasUsersError } = saasUsersCountResult;
    if (saasUsersError) throw saasUsersError;

    const { count: tenantsCount, error: tenantsError } = tenantsCountResult;
    if (tenantsError) throw tenantsError;

    const metrics = {
      usersCount: saasUsersCount, // Agora reflete apenas usuários SaaS
      tenantsCount: tenantsCount ?? 0,
    };

    return new Response(JSON.stringify(metrics), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});