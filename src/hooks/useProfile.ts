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
  let { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error("Supabase fetchProfile error:", error);
    throw new Error(error.message);
  }
  
  // 2. Se o perfil não for encontrado, tenta criar um registro básico
  if (!data) {
    console.warn(`Profile missing for user ${userId}. Attempting immediate creation.`);
    
    // Insere apenas o ID. O campo 'role' usará o default 'student'.
    // Outros campos (first_name, email) serão nulos, mas o perfil existirá.
    const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: userId }) 
        .select('*')
        .single();

    if (insertError) {
        console.error("Failed to create fallback profile:", insertError);
        // Se falhar, retorna null e o AppLayout mostrará 'N/A'
        return null; 
    }
    
    // Usa o dado recém-inserido
    data = insertData;
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
  const isSchoolUser = profile?.tenant_id !== null;

  return {
    profile,
    isLoading,
    error,
    refetch,
    isSuperAdmin,
    isAdmin,
    isSchoolUser,
  };
};