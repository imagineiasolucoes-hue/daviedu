declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
// @ts-ignore
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9.0.1'; // Para gerar UUIDs como tokens

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_id } = await req.json();

    if (!document_id) {
      throw new Error("ID do documento é obrigatório.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Gerar um token único (UUID)
    const token = uuidv4();

    // Inserir o token na tabela de verificação
    const { data, error } = await supabaseAdmin
      .from('document_verification_tokens')
      .insert({ document_id, token })
      .select('token')
      .single();

    if (error) {
      console.error("Supabase Insert Error (document_verification_tokens):", error);
      throw new Error(`Erro ao gerar token de verificação: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true, token: data.token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("Edge Function CATCH block error (generate-document-token):", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});