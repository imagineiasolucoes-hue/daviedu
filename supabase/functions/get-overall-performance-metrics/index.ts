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
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenant_id } = await req.json();
    if (!tenant_id) {
      throw new Error("ID da escola (tenant_id) é obrigatório.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Consulta para obter a média das notas por matéria
    const { data, error } = await supabaseAdmin
      .from('grades')
      .select('subject_name, grade_value')
      .eq('tenant_id', tenant_id);

    if (error) {
      console.error("Error fetching grades for overall performance:", error);
      throw new Error(`Erro ao buscar notas para o aproveitamento geral: ${error.message}`);
    }

    // Agrupar e calcular a média
    const performanceMap = new Map<string, { sum: number, count: number }>();

    data.forEach(grade => {
      if (grade.grade_value !== null) {
        const current = performanceMap.get(grade.subject_name) || { sum: 0, count: 0 };
        performanceMap.set(grade.subject_name, {
          sum: current.sum + grade.grade_value,
          count: current.count + 1,
        });
      }
    });

    const result = Array.from(performanceMap.entries()).map(([subject_name, { sum, count }]) => ({
      subject_name,
      average_grade: count > 0 ? sum / count : 0,
    }));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("Edge Function CATCH block error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});