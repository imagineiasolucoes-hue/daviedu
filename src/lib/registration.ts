import { supabase } from "@/integrations/supabase/client";
import { fetchTenantId } from "./tenant";
import { format } from "date-fns";

/**
 * Generates the next sequential registration code for the current year.
 * Format: YYYYXXX (e.g., 2024001)
 */
export const generateNextRegistrationCode = async (): Promise<string> => {
  const { tenantId, error: tenantError } = await fetchTenantId();
  if (tenantError) throw new Error(tenantError);

  const currentYear = format(new Date(), "yyyy");
  const prefix = currentYear;

  // Find the highest registration code for the current year
  const { data, error } = await supabase
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
};