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
    const { tenant_id, course_ids, ...classInfo } = body; // course_ids é um array

    if (!tenant_id) {
      throw new Error("Identificador da escola (tenant_id) ausente.");
    }
    if (!classInfo.name || !classInfo.school_year || !classInfo.period) {
      throw new Error("Campos obrigatórios ausentes: nome, ano letivo e período.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const classData = {
      ...classInfo,
      tenant_id: tenant_id,
      room: classInfo.room || null,
      // course_id foi removido da tabela classes
    };

    // 1. Inserir Turma
    const { data: classResult, error: insertError } = await supabaseAdmin
      .from("classes")
      .insert(classData)
      .select("id")
      .single();

    if (insertError) {
      throw new Error(`Erro no banco de dados ao criar turma: ${insertError.message}`);
    }
    
    const classId = classResult.id;

    // 2. Vincular Cursos, se houver
    if (course_ids && course_ids.length > 0) {
        const links = course_ids.map((course_id: string) => ({
            class_id: classId,
            course_id: course_id,
        }));

        const { error: linkError } = await supabaseAdmin
            .from("class_courses")
            .insert(links);

        if (linkError) {
            console.error("Erro ao vincular cursos à turma:", linkError);
            // NOTA: Em um ambiente de produção, a criação da turma deveria ser revertida aqui.
            throw new Error(`Erro ao vincular cursos à turma: ${linkError.message}`);
        }
    }

    return new Response(JSON.stringify({ success: true, classId: classId }), {
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