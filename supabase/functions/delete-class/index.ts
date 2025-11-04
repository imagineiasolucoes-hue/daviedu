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
    const { class_id, tenant_id } = await req.json();

    if (!class_id || !tenant_id) {
      throw new Error("ID da turma e da escola são obrigatórios.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Antes de deletar a turma, precisamos remover as associações em teacher_classes
    const { error: deleteTeacherClassesError } = await supabaseAdmin
      .from("teacher_classes")
      .delete()
      .eq("class_id", class_id);

    if (deleteTeacherClassesError) {
      console.error("Supabase Delete Teacher Classes Error:", deleteTeacherClassesError);
      throw new Error(`Erro ao deletar associações de professores com a turma: ${deleteTeacherClassesError.message}`);
    }

    // Também precisamos desvincular alunos desta turma (setar class_id para null)
    const { error: updateStudentsError } = await supabaseAdmin
      .from("students")
      .update({ class_id: null })
      .eq("class_id", class_id)
      .eq("tenant_id", tenant_id); // Security check

    if (updateStudentsError) {
      console.error("Supabase Update Students Error:", updateStudentsError);
      throw new Error(`Erro ao desvincular alunos da turma: ${updateStudentsError.message}`);
    }

    const { error } = await supabaseAdmin
      .from("classes")
      .delete()
      .eq("id", class_id)
      .eq("tenant_id", tenant_id); // Security check

    if (error) {
      console.error("Supabase Delete Class Error:", error);
      throw new Error(`Erro no banco de dados: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
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