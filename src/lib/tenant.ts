import { supabase } from "@/integrations/supabase/client";

export const fetchTenantId = async (): Promise<{ tenantId: string | null; error: string | null }> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { tenantId: null, error: "Usuário não autenticado." };
  }

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id);

  if (profileError) {
    return { tenantId: null, error: `Falha ao buscar perfil do usuário: ${profileError.message}` };
  }

  if (!profiles || profiles.length === 0) {
    return { tenantId: null, error: "Perfil do usuário não encontrado." };
  }

  // Safely take the first profile, even if there are duplicates.
  const profile = profiles[0];

  if (!profile?.tenant_id) {
    return { tenantId: null, error: "ID da escola (tenant) não encontrado para este usuário." };
  }

  return { tenantId: profile.tenant_id, error: null };
};