import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('document_verification_tokens')
      .select('document_id, expires_at, is_active')
      .eq('token_hash', token)
      .single();

    if (tokenError || !tokenData || !tokenData.is_active || new Date(tokenData.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const eventId = tokenData.document_id;

    // Fetch the public event using the eventId
    const { data: event, error: eventError } = await supabaseClient
      .from('academic_events')
      .select('*')
      .eq('id', eventId)
      .eq('is_public', true) // Ensure only public events are fetched
      .single();

    if (eventError || !event) {
      return new Response(JSON.stringify({ error: 'Event not found or not public' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ event }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});