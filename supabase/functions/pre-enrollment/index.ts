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

const DEMO_TENANT_ID = "00000000-0000-0000-0000-000000000000";

async function generateNextRegistrationCode(supabaseAdmin: any, tenantId: string): Promise<string> {
    const currentYear = format(new Date(), "yyyy");
    const prefix = currentYear;

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
        const lastCode = data.registration_code;
        const lastSequenceStr = lastCode.slice(-3);
        const lastSequence = parseInt(lastSequenceStr, 10);

        if (!isNaN(lastSequence)) {
            nextSequence = lastSequence + 1;
        }
    }

    const nextSequenceStr = String(nextSequence).padStart(3, '0');

    return `${prefix}${nextSequenceStr}`;
}


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    const tenantId = body.tenant_id || DEMO_TENANT_ID; 

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Generate the sequential registration code
    const registration_code = await generateNextRegistrationCode(supabaseAdmin, tenantId);

    // 2. Explicitly construct the submission object using only valid columns
    const finalSubmission = {
        tenant_id: tenantId,
        registration_code: registration_code,
        status: "pre-enrolled",
        
        // Data from form body
        full_name: body.full_name,
        birth_date: body.birth_date, // Already YYYY-MM-DD string
        phone: body.phone,
        email: body.email || null,
        gender: body.gender || null,
        nationality: body.nationality || null,
        naturality: body.naturality || null,
        cpf: body.cpf || null,
        rg: body.rg || null,
        zip_code: body.zip_code || null,
        address_street: body.address_street || null,
        address_number: body.address_number || null,
        address_neighborhood: body.address_neighborhood || null,
        address_city: body.address_city || null,
        address_state: body.address_state || null,
        guardian_name: body.guardian_name || null,
        special_needs: body.special_needs || null,
        medication_use: body.medication_use || null,
        
        // user_id and class_id are null for pre-enrollment
        user_id: null,
        class_id: null,
    };

    // 3. Insert the new student
    const { data: student, error: insertError } = await supabaseAdmin
        .from("students")
        .insert(finalSubmission)
        .select("registration_code")
        .single();

    if (insertError) {
        console.error("Supabase Insert Error:", insertError);
        throw new Error(`Database insertion failed: ${insertError.message}`);
    }

    // 4. Return the generated code
    return new Response(JSON.stringify({
        success: true,
        registration_code: student.registration_code,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido na função Edge.";
    console.error("Pre-enrollment Edge Function Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});