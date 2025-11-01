export type FAQCategoryKey = 'general' | 'students' | 'teachers' | 'classes' | 'finance' | 'settings' | 'documents' | 'pre-enrollment';

export interface FAQCategory {
  key: FAQCategoryKey;
  title: string;
  icon: React.ElementType; // LucideIcon
}

export interface FAQItem {
  id: string;
  category: FAQCategoryKey;
  question: string;
  answer: string;
  icon?: React.ElementType; // LucideIcon
}