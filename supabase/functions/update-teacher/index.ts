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
    const { employee_id, tenant_id, classes_to_teach, ...updateData } = await req.json();

    if (!employee_id || !tenant_id) {
      throw new Error("ID do funcionário e da escola são obrigatórios.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // 1. Preparar dados do funcionário (removendo classes_to_teach para não tentar inserir na tabela employees)
    const employeeUpdateData = {
        ...updateData,
        email: updateData.email || null,
        phone: updateData.phone || null,
        zip_code: updateData.zip_code || null,
        address_street: updateData.address_street || null,
        address_number: updateData.address_number || null,
        address_neighborhood: updateData.address_neighborhood || null,
        address_city: updateData.address_city || null,
        address_state: updateData.address_state || null,
    };

    // 2. Atualizar Professor
    const { data, error: employeeError } = await supabaseAdmin
      .from("employees")
      .update(employeeUpdateData)
      .eq("id", employee_id)
      .eq("tenant_id", tenant_id) // Security check
      .select("id")
      .single();

    if (employeeError) {
      throw new Error(`Erro no banco de dados ao atualizar professor: ${employeeError.message}`);
    }

    // 3. Sincronizar Turmas (Deletar todas as antigas e inserir as novas)
    
    // Deletar todas as associações existentes
    const { error: deleteError } = await supabaseAdmin
        .from("teacher_classes")
        .delete()
        .eq("employee_id", employee_id);

    if (deleteError) {
        console.error("Erro ao deletar associações antigas:", deleteError);
        throw new Error(`Erro ao sincronizar turmas: ${deleteError.message}`);
    }

    // Inserir as novas associações
    if (classes_to_teach && classes_to_teach.length > 0) {
        const links = classes_to_teach.map((c: { class_id: string, period: string }) => ({
            employee_id: employee_id,
            class_id: c.class_id,
            period: c.period,
        }));

        const { error: insertError } = await supabaseAdmin
            .from("teacher_classes")
            .insert(links);

        if (insertError) {
            console.error("Erro ao inserir novas associações:", insertError);
            throw new Error(`Erro ao sincronizar turmas: ${insertError.message}`);
        }
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