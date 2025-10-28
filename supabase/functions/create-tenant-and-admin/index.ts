// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    const { schoolName, email, firstName, lastName, userId } = await req.json();

    if (!schoolName || !email || !firstName || !lastName || !userId) {
      throw new Error("Missing required fields: schoolName, email, firstName, lastName, userId.");
    }

    // @ts-ignore
    const supabaseAdmin = createClient(
      // @ts-ignore
      Deno.env.get("SUPABASE_URL") ?? "",
      // @ts-ignore
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Check if a tenant with this name already exists
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

    // 3. Ensure the user's profile exists and update it with the new tenant_id and role
    const { data: existingProfile, error: fetchProfileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (fetchProfileError) throw fetchProfileError;

    if (existingProfile) {
      // Profile exists, update it
      const { error: profileUpdateError } = await supabaseAdmin
        .from("profiles")
        .update({ tenant_id: tenant.id, role: 'admin' })
        .eq("id", userId);
      if (profileUpdateError) throw profileUpdateError;
    } else {
      // Profile does not exist (e.g., trigger failed or race condition), insert it
      const { error: profileInsertError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: userId,
          first_name: firstName,
          last_name: lastName,
          tenant_id: tenant.id,
          role: 'admin'
        });
      if (profileInsertError) throw profileInsertError;
    }

    // 4. Return success
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