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
import { format } from "https://deno.land/std@0.190.0/datetime/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// NOTE: This function assumes the tenantId is passed in the request body.
// In a real scenario, you might validate this ID against a public list of tenants.
const DEMO_TENANT_ID = "00000000-0000-0000-0000-000000000000";

async function generateNextRegistrationCode(supabaseAdmin: any, tenantId: string): Promise<string> {
    const currentYear = format(new Date(), "yyyy");
    const prefix = currentYear;

    // Find the highest registration code for the current year within the tenant
    const { data, error } = await supabaseAdmin
        .from("students")
        .select("registration_code")
        .eq("tenant_id", tenantId)
        .like("registration_code", `${prefix}%`)
        .order("registration_code", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        throw new Error(`Failed to fetch last registration code: ${error.message}`);
    }

    let nextSequence = 1;

    if (data?.registration_code) {
        // Extract the sequence number (last 3 digits)
        const lastCode = data.registration_code;
        const lastSequenceStr = lastCode.slice(-3);
        const lastSequence = parseInt(lastSequenceStr, 10);

        if (!isNaN(lastSequence)) {
            nextSequence = lastSequence + 1;
        }
    }

    // Format the sequence number (e.g., 1 -> 001, 12 -> 012)
    const nextSequenceStr = String(nextSequence).padStart(3, '0');

    return `${prefix}${nextSequenceStr}`;
}


serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // We must ensure the tenantId is present, even if it's the placeholder
    const tenantId = body.tenant_id || DEMO_TENANT_ID; 

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Generate the sequential registration code
    const registration_code = await generateNextRegistrationCode(supabaseAdmin, tenantId);

    // 2. Prepare submission data
    const submissionData = {
        ...body,
        tenant_id: tenantId,
        registration_code: registration_code,
        status: "pre-enrolled",
        // Ensure date is correctly formatted (it should already be YYYY-MM-DD from client)
        birth_date: body.birth_date, 
    };

    // 3. Insert the new student
    const { data: student, error: insertError } = await supabaseAdmin
        .from("students")
        .insert(submissionData)
        .select("registration_code")
        .single();

    if (insertError) throw insertError;

    // 4. Return the generated code
    return new Response(JSON.stringify({
        success: true,
        registration_code: student.registration_code,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Pre-enrollment Edge Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});