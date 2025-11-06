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
    const { class_id, tenant_id, course_ids, ...updateData } = await req.json(); // course_ids é um array

    if (!class_id || !tenant_id) {
      throw new Error("ID da turma e da escola são obrigatórios.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Atualizar Turma (sem course_id)
    const classUpdateData = {
        ...updateData,
        room: updateData.room || null,
    };

    const { data, error: classError } = await supabaseAdmin
      .from("classes")
      .update(classUpdateData)
      .eq("id", class_id)
      .eq("tenant_id", tenant_id) // Security check
      .select("id")
      .single();

    if (classError) {
      console.error("Supabase Update Error (classes):", classError);
      throw new Error(`Erro no banco de dados ao atualizar turma: ${classError.message}`);
    }

    // 2. Sincronizar Cursos (Deletar todas as antigas e inserir as novas)
    
    // Deletar todas as associações existentes
    const { error: deleteError } = await supabaseAdmin
        .from("class_courses")
        .delete()
        .eq("class_id", class_id);

    if (deleteError) {
        console.error("Erro ao deletar associações antigas:", deleteError);
        throw new Error(`Erro ao sincronizar cursos: ${deleteError.message}`);
    }

    // Inserir as novas associações
    if (course_ids && course_ids.length > 0) {
        const links = course_ids.map((course_id: string) => ({
            class_id: class_id,
            course_id: course_id,
        }));

        const { error: insertError } = await supabaseAdmin
            .from("class_courses")
            .insert(links);

        if (insertError) {
            console.error("Erro ao inserir novas associações:", insertError);
            throw new Error(`Erro ao sincronizar cursos: ${insertError.message}`);
        }
    }

    return new Response(JSON.stringify({ success: true, class: data }), {
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