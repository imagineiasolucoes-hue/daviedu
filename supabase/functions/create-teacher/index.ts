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
    console.log("create-teacher: Incoming request body:", JSON.stringify(body, null, 2)); // Log do corpo da requisição

    const { tenant_id, classes_to_teach, ...teacherInfo } = body; // Capturando classes_to_teach

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
      
      // Novos campos de contato e endereço
      email: teacherInfo.email || null,
      phone: teacherInfo.phone || null,
      zip_code: teacherInfo.zip_code || null,
      address_street: teacherInfo.address_street || null,
      address_number: teacherInfo.address_number || null,
      address_neighborhood: teacherInfo.address_neighborhood || null,
      address_city: teacherInfo.address_city || null,
      address_state: teacherInfo.address_state || null,
    };

    // 1. Inserir Professor
    const { data: employeeResult, error: insertError } = await supabaseAdmin
      .from("employees")
      .insert(teacherData)
      .select("id")
      .single();

    if (insertError) {
      console.error("create-teacher: Supabase Insert Error (employees):", JSON.stringify(insertError, null, 2)); // Log detalhado do erro de inserção
      throw new Error(`Erro no banco de dados ao criar professor: ${insertError.message}`);
    }
    
    const employeeId = employeeResult.id;

    // 2. Vincular Turmas, se houver
    if (classes_to_teach && classes_to_teach.length > 0) {
        const links = classes_to_teach.map((c: { class_id: string, period: string }) => ({
            employee_id: employeeId,
            class_id: c.class_id,
            period: c.period,
        }));

        const { error: linkError } = await supabaseAdmin
            .from("teacher_classes")
            .insert(links);

        if (linkError) {
            console.error("create-teacher: Supabase Insert Error (teacher_classes):", JSON.stringify(linkError, null, 2)); // Log detalhado do erro de vínculo
            // NOTA: Em um ambiente de produção, para garantir atomicidade, a criação do professor
            // também deveria ser revertida se o vínculo das turmas falhar.
            // Isso geralmente é feito com uma função de banco de dados (stored procedure)
            // que encapsula todas as operações em uma única transação.
            console.error("Erro ao vincular professor às turmas:", linkError);
            // Continuar, mas informar o erro
        }
    }

    return new Response(JSON.stringify({ success: true, teacherId: employeeId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("create-teacher: Edge Function CATCH block error:", errorMessage); // Log do erro geral
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});