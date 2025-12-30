import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";

export type UserRole = 'super_admin' | 'admin' | 'secretary' | 'teacher' | 'student';
export type TenantStatus = 'trial' | 'active' | 'suspended';

export interface Profile {
  id: string; // auth.users.id
  tenant_id: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  updated_at: string | null;
  phone: string | null;
  email: string | null; 
  employee_id?: string | null; // ID do funcionário, se o perfil for de um professor
  tenant_status?: TenantStatus; // NOVO CAMPO
  trial_expires_at?: string | null; // NOVO CAMPO
  dismissed_sa_messages_ids?: string[]; // NOVO CAMPO: IDs das mensagens de super admin dispensadas
}

const fetchProfile = async (userId: string): Promise<Profile | null> => {
  console.log(`[useProfile] Fetching profile for userId: ${userId}`); // DEBUG
  // 1. Busca o perfil existente, incluindo o employee_id e dados do tenant
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*, tenants(status, trial_expires_at), dismissed_sa_messages_ids') // Busca status, data de expiração E mensagens dispensadas
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    console.error("[useProfile] Supabase fetchProfile error:", profileError); // DEBUG
    throw new Error(profileError.message);
  }
  
  if (!profileData) {
    console.warn(`[useProfile] Profile missing for user ${userId}. Returning null.`); // DEBUG
    return null;
  }

  // 2. Garante que o campo role está presente
  if (!profileData.role) {
      profileData.role = 'student' as UserRole;
  }

  let profile: Profile = profileData as Profile;
  
  // Extrai o status e a data de expiração do tenant da relação
  const rawProfile = profileData as any;
  if (rawProfile.tenants) {
      profile.tenant_status = rawProfile.tenants.status as TenantStatus;
      profile.trial_expires_at = rawProfile.tenants.trial_expires_at; // Captura a data de expiração
  }
  delete (profile as any).tenants; // Remove a propriedade aninhada

  // 3. Se o perfil é de um professor/admin, garante que o employee_id esteja preenchido
  // NOTE: Employee linking (writing profiles.employee_id) was intentionally removed from this fetch function
  // to avoid side effects and refetch loops. Employee linking should be performed by a separate one-time
  // process (see useEnsureEmployeeLink hook) so fetchProfile remains a pure read operation.
   
   console.log(`[useProfile] Final profile for ${userId}:`, profile); // DEBUG
   return profile;
};

export const useProfile = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const userId = user?.id;

  const { data: profile, isLoading: isProfileLoading, error, refetch } = useQuery<Profile | null, Error>({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId, // Only run if user is logged in
  });

  const isLoading = isAuthLoading || isProfileLoading;
  const isSuperAdmin = profile?.role === 'super_admin';
  const isAdmin = profile?.role === 'admin';
  const isSecretary = profile?.role === 'secretary'; // Adicionado
  const isTeacher = profile?.role === 'teacher'; 
  const isStudent = profile?.role === 'student'; // NOVO: Flag para estudante
  const isSchoolUser = profile?.tenant_id !== null;
  const isTenantSuspended = profile?.tenant_status === 'suspended'; 

  return {
    profile,
    isLoading,
    error,
    refetch,
    isSuperAdmin,
    isAdmin,
    isSecretary, // Exposto
    isTeacher, 
    isStudent, // Exposto
    isSchoolUser,
    isTenantSuspended, 
  };
};