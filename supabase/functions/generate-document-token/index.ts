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
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9.0.1'; // For generating tokens

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256hex(message: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

    // Generate a token (UUID)
    const token = uuidv4();

    // Compute sha256 hex of token and store only the hash
    const token_hash = await sha256hex(token);

    // Get the base URL from environment variables or request headers
    const origin = req.headers.get('origin') || Deno.env.get('VERCEL_URL') || 'http://localhost:5173'; // Fallback for local development
    const verificationLink = `${origin}/verify-document/${token}`;

    // Insert the token_hash in the table and update the document with the verification link
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('document_verification_tokens')
      .insert({ document_id, token_hash })
      .select('id, is_active')
      .single();

    if (tokenError) {
      console.error("[generate-document-token] Supabase Insert Error (document_verification_tokens):", tokenError);
      throw new Error(`Erro ao gerar token de verificação: ${tokenError.message}`);
    }

    const { error: updateError } = await supabaseAdmin
      .from('documents')
      .update({ verification_link: verificationLink })
      .eq('id', document_id);

    if (updateError) {
      console.error("[generate-document-token] Supabase Update Error (documents):", updateError);
      throw new Error(`Erro ao salvar link de verificação no documento: ${updateError.message}`);
    }

    // Return plaintext token to caller once (so they can embed it in a link).
    // The server only stores the hashed value.
    return new Response(JSON.stringify({ success: true, token, verificationLink }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("[generate-document-token] Edge Function CATCH block error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});