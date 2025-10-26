export interface Course {
  id: string;
  tenant_id: string;
  name: string;
  workload_hours?: number;
  created_at: string;
}

export interface Class {
  id: string;
  tenant_id: string;
  course_id: string;
  name: string;
  school_year: number;
  period?: string;
  room?: string;
  created_at: string;
  course?: Pick<Course, 'name'>; // For joins
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