export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string | null;
  amount: number;
  tenant_id: string;
  user_id: string;
  created_at: string;
}