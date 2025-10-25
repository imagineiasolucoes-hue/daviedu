import { supabase } from "@/integrations/supabase/client";

export const fetchTenantId = async (): Promise<{ tenantId: string | null; error: string | null }> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { tenantId: null, error: "Usuário não autenticado." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return { tenantId: null, error: `Falha ao buscar perfil do usuário: ${profileError.message}` };
  }

  if (!profile?.tenant_id) {
    return { tenantId: null, error: "ID da escola (tenant) não encontrado para este usuário." };
  }

  return { tenantId: profile.tenant_id, error: null };
};