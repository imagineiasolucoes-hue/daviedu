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
    const { schoolName, email, password, firstName, lastName } = await req.json();

    if (!schoolName || !email || !password || !firstName || !lastName) {
      throw new Error("Missing required fields.");
    }

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Create the tenant (school)
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({ name: schoolName })
      .select()
      .single();

    if (tenantError) throw tenantError;

    // 2. Create the admin user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for simplicity, can be changed to false
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (userError) throw userError;
    if (!user) throw new Error("User creation failed.");

    // The handle_new_user trigger will create the profile.
    // 3. Update the new profile with tenant_id and admin role
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        tenant_id: tenant.id,
        role: "admin",
      })
      .eq("id", user.id);

    if (profileError) throw profileError;

    return new Response(JSON.stringify({ success: true, userId: user.id, tenantId: tenant.id }), {
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