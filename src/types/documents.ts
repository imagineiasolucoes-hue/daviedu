export interface SchoolDocument {
  id: string;
  document_type: 'contract' | 'receipt' | 'report_card' | 'transcript' | 'payslip' | 'other';
  file_url: string;
  generated_at: string;
  generated_by_profile: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  metadata: any;
  related_entity_id: string | null;
  description: string | null;
}

export interface SupabaseFetchedDocument {
  id: string;
  document_type: 'contract' | 'receipt' | 'report_card' | 'transcript' | 'payslip' | 'other';
  file_url: string;
  generated_at: string;
  generated_by: { first_name: string | null; last_name: string | null; } | null;
  metadata: any;
  related_entity_id: string | null;
  description: string | null;
}