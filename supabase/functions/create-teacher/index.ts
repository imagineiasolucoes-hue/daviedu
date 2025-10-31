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
    const body = await req.json();
    const { tenant_id, ...teacherInfo } = body;

    if (!tenant_id) {
      throw new Error("Identificador da escola (tenant_id) ausente.");
    }
    if (!teacherInfo.full_name || !teacherInfo.hire_date || !teacherInfo.base_salary) {
      throw new Error("Campos obrigatórios ausentes: nome, data de contratação e salário.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const teacherData = {
      ...teacherInfo,
      tenant_id: tenant_id,
      is_teacher: true,
      status: "active",
    };

    const { data, error: insertError } = await supabaseAdmin
      .from("employees")
      .insert(teacherData)
      .select("id")
      .single();

    if (insertError) {
      throw new Error(`Erro no banco de dados: ${insertError.message}`);
    }

    return new Response(JSON.stringify({ success: true, teacher: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});