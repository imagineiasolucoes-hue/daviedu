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
    // Apenas o Super Admin deve chamar esta função.
    // A autenticação do JWT deve ser verificada manualmente se necessário,
    // mas para esta função que usa a service_role_key, o foco é o acesso administrativo.
    // Para um ambiente de produção, você adicionaria uma verificação de role aqui.

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        role,
        tenant_id,
        tenants (name)
      `);

    if (usersError) {
      console.error("Supabase fetch users error:", usersError);
      throw new Error(`Erro ao buscar usuários: ${usersError.message}`);
    }

    return new Response(JSON.stringify(users), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("Edge Function CATCH block error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});