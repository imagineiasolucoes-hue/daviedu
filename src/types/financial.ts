export type PaymentStatus = 'pago' | 'pendente' | 'atrasado';
export type EmployeeStatus = 'active' | 'inactive';

export interface RevenueCategory {
  id: string;
  tenant_id: string;
  name: string;
}

export interface Revenue {
  id: string;
  tenant_id: string;
  date: string;
  category_id?: string;
  description?: string;
  amount: number;
  payment_method?: string;
  source?: string;
  status: PaymentStatus;
  is_recurring: boolean;
  student_id?: string;
  attachment_url?: string;
  category?: RevenueCategory; // For joins
}

export interface ExpenseCategory {
  id: string;
  tenant_id: string;
  name: string;
}

export interface Expense {
  id: string;
  tenant_id: string;
  date: string;
  category_id?: string;
  description?: string;
  amount: number;
  payment_method?: string;
  destination?: string;
  status: PaymentStatus;
  attachment_url?: string;
  category?: ExpenseCategory; // For joins
}

export interface Role {
  id: string;
  tenant_id: string;
  name: string;
  department?: string;
  description?: string;
  base_salary_reference?: number;
}

export interface Employee {
  id: string;
  tenant_id: string;
  full_name: string;
  role_id?: string;
  department?: string;
  base_salary: number;
  hire_date: string;
  contract_type?: string;
  status: EmployeeStatus;
  role?: Role; // For joins
}

export interface Payroll {
  id: string;
  tenant_id: string;
  employee_id: string;
  reference_month: string;
  gross_salary: number;
  discounts: number;
  benefits: number;
  net_salary: number;
  payment_status: PaymentStatus;
  employee?: Employee; // For joins
}