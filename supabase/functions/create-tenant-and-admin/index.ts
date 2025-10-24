// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { schoolName, email, firstName, lastName } = await req.json();

    if (!schoolName || !email || !firstName || !lastName) {
      throw new Error("Missing required fields: schoolName, email, firstName, lastName.");
    }

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Check if a tenant with this name already exists (optional check for uniqueness)
    const { data: existingTenant, error: checkError } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("name", schoolName)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingTenant) {
        throw new Error("A escola com este nome já está cadastrada.");
    }

    // 2. Create the tenant (school)
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({ name: schoolName })
      .select()
      .single();

    if (tenantError) throw tenantError;

    // 3. Return the tenant ID and the admin details for WhatsApp redirection
    return new Response(JSON.stringify({ 
        success: true, 
        tenantId: tenant.id,
        schoolName,
        firstName,
        email
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});