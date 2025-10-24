export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category_id: string;
  categories: { name: string } | null; // Updated from transaction_categories
  description: string | null;
  amount: number;
  tenant_id: string;
  user_id: string;
  created_at: string;
}