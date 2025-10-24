export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category_id: string;
  categories: { name: string; parent_id: string | null; categories: { name: string } | null } | null; // Updated to reflect hierarchical categories
  description: string | null;
  amount: number;
  tenant_id: string;
  user_id: string;
  created_at: string;
}