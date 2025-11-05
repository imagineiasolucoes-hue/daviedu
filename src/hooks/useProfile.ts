import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";

export type UserRole = 'super_admin' | 'admin' | 'secretary' | 'teacher' | 'student';

export interface Profile {
  id: string;
  tenant_id: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  updated_at: string | null;
  phone: string | null;
}

const fetchProfile = async (userId: string): Promise<Profile | null> => {
  // 1. Tenta buscar o perfil existente
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error("Supabase fetchProfile error:", error);
    throw new Error(error.message);
  }
  
  // 2. Se o perfil não for encontrado, retorna null.
  // Para Super Admins, o perfil deve ser criado manualmente no DB.
  // Para usuários normais, o perfil é criado via trigger (signup) ou Edge Function (register).
  if (!data) {
    console.warn(`Profile missing for user ${userId}. Returning null.`);
    return null;
  }

  // 3. Garante que o campo role está presente (embora o schema garanta um default)
  if (!data.role) {
      data.role = 'student' as UserRole;
  }

  return data as Profile;
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
  const isTeacher = profile?.role === 'teacher'; // Adicionado
  const isSchoolUser = profile?.tenant_id !== null;

  return {
    profile,
    isLoading,
    error,
    refetch,
    isSuperAdmin,
    isAdmin,
    isTeacher, // Adicionado
    isSchoolUser,
  };
};