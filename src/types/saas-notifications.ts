export type UserRole = 'super_admin' | 'admin' | 'secretary' | 'teacher' | 'student';

export interface SaasNotification {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  external_link: string | null;
  published_at: string; // ISO string
  target_tenant_id: string | null;
  target_role: UserRole | null;
  is_global: boolean;
  created_by: string | null; // User ID of the Super Admin
  created_at: string; // ISO string
  
  // Propriedades adicionais para exibição (não no DB diretamente)
  tenant_name?: string | null; // Nome do tenant, se target_tenant_id for preenchido
  created_by_name?: string | null; // Nome do Super Admin que criou
  is_read?: boolean; // Estado de leitura do cliente
}

export interface CreateNotificationPayload {
  title: string;
  content: string;
  image_url?: string | null;
  external_link?: string | null;
  target_tenant_id?: string | null;
  target_role?: UserRole | null;
  is_global?: boolean;
}

export interface UpdateNotificationPayload extends CreateNotificationPayload {
  id: string;
}