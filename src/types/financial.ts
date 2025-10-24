export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  tenant_id: string;
  parent_id: string | null;
  name: string;
  type: CategoryType;
  created_at: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: CategoryType;
  category_id: string;
  categories: {
    name: string;
    parent_id: string | null;
    parent: { name: string; parent_id: string | null; parent: { name: string } | null } | null;
  } | null; // Nested categories for hierarchy
  description: string | null;
  amount: number;
  tenant_id: string;
  user_id: string;
  created_at: string;
}

export interface PayrollExpense {
  id: string;
  tenant_id: string;
  user_id: string;
  date: string;
  amount: number;
  description: string | null;
  created_at: string;
}