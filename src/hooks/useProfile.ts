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
}

const fetchProfile = async (userId: string): Promise<Profile | null> => {
  console.log(`[useProfile] Fetching profile for userId: ${userId}`); // DEBUG
  // 1. Busca o perfil existente, incluindo o employee_id e dados do tenant
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*, tenants(status, trial_expires_at)') // Busca status E data de expiração
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
  if ((profile.role === 'teacher' || profile.role === 'admin' || profile.role === 'secretary') && profile.tenant_id) {
    // Se o employee_id já estiver no perfil, usamos ele.
    if (!profile.employee_id) {
        console.log(`[useProfile] Attempting to link employee_id for user ${userId} with role ${profile.role}`); // DEBUG
        
        // Busca o registro de funcionário (employee) vinculado a este user_id e tenant_id
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', userId)
          .eq('tenant_id', profile.tenant_id) 
          .maybeSingle();

        if (employeeError) {
          console.error("[useProfile] Error finding employee for profile linking:", employeeError); // DEBUG
        } else if (employeeData) {
          console.log(`[useProfile] Found employee_id ${employeeData.id} for user ${userId}. Updating profile.`); // DEBUG
          
          // Atualiza o perfil no banco de dados (para persistir o employee_id)
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ employee_id: employeeData.id })
            .eq('id', userId);

          if (updateError) {
            console.error("[useProfile] Error updating profile with employee_id:", updateError); // DEBUG
          } else {
            // Atualiza o objeto profile em memória para a sessão atual
            profile = { ...profile, employee_id: employeeData.id };
          }
        } else {
          console.warn(`[useProfile] No employee record found for user ${userId} with role ${profile.role}.`); // DEBUG
        }
    }
  }
  
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