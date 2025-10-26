export interface Class {
  id: string;
  tenant_id: string;
  course_id?: string; // Keeping optional for backward compatibility with existing data, but no longer used in UI
  name: string;
  school_year: number;
  period?: string;
  room?: string;
  created_at: string;
}

export interface Student {
  id: string;
  tenant_id: string;
  user_id?: string;
  full_name: string;
  birth_date?: string;
  registration_code: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}