export type UserRole = 'student' | 'admin' | 'secretary' | 'super_admin';

export interface Profile {
  id: string;
  tenant_id: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  updated_at: string | null;
}