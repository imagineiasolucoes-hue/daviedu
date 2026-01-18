import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9.0.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { 'Authorization': req.headers.get('Authorization')! } },
      }
    );

    const { document_id } = await req.json();

    if (!document_id) {
      console.error("[generate-document-token] Missing document_id in request body.");
      return new Response(JSON.stringify({ error: 'Document ID is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const token = uuidv4(); // Generate a unique token

    // Update the document with the generated verification link
    const { error: updateError } = await supabaseClient
      .from('documents')
      .update({ verification_link: token })
      .eq('id', document_id);

    if (updateError) {
      console.error("[generate-document-token] Error updating document with verification link:", updateError);
      throw updateError;
    }

    console.log(`[generate-document-token] Verification token generated and saved for document ${document_id}`);

    return new Response(JSON.stringify({ token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("[generate-document-token] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});