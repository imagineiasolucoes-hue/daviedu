import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";

export type UserRole = 'super_admin' | 'admin' | 'secretary' | 'teacher' | 'student';

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
}

const fetchProfile = async (userId: string): Promise<Profile | null> => {
  // 1. Busca o perfil existente, incluindo o employee_id
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    console.error("Supabase fetchProfile error:", profileError);
    throw new Error(profileError.message);
  }
  
  if (!profileData) {
    console.warn(`Profile missing for user ${userId}. Returning null.`);
    return null;
  }

  // 2. Garante que o campo role está presente
  if (!profileData.role) {
      profileData.role = 'student' as UserRole;
  }

  const profile: Profile = profileData as Profile;

  // A busca secundária por employee_id foi removida, pois as Edge Functions
  // create-teacher e update-teacher agora sincronizam o employee_id no perfil.
  
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
  const isTeacher = profile?.role === 'teacher'; 
  const isSchoolUser = profile?.tenant_id !== null;

  return {
    profile,
    isLoading,
    error,
    refetch,
    isSuperAdmin,
    isAdmin,
    isTeacher, 
    isSchoolUser,
  };
};