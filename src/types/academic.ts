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
  status: 'active' | 'inactive' | 'suspended' | 'pre-enrolled';
  created_at: string;
  
  // Campos de Responsável
  guardian_name?: string; // Nome do Pai/Mãe/Responsável
  
  // Informações de Saúde/Especiais
  special_needs?: string; // Necessidades especiais ou condições médicas
  medication_use?: string; // Uso de medicamentos contínuo

  // Campos adicionados baseados no formulário detalhado
  gender?: 'Masculino' | 'Feminino' | 'Outro';
  nationality?: string;
  naturality?: string; // Naturalidade (Cidade de Nascimento)
  cpf?: string;
  rg?: string;
  phone?: string;
  email?: string;
  
  // Endereço
  zip_code?: string;
  address_street?: string;
  address_number?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;

  // Vínculo com a Turma
  class_id?: string;
}