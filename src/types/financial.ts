export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category_id: string;
  transaction_categories: { name: string } | null;
  description: string | null;
  amount: number;
  tenant_id: string;
  user_id: string;
  created_at: string;
}