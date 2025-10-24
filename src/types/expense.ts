import { z } from "zod";

export const expenseSchema = z.object({
  id: z.string().optional(),
  amount: z.number().min(0.01, "O valor deve ser maior que zero"),
  description: z.string().max(255).optional(),
  category: z.string().min(1, "A categoria é obrigatória"),
  date: z.date({
    required_error: "A data é obrigatória.",
  }),
});

export type Expense = z.infer<typeof expenseSchema> & {
  user_id: string;
  created_at: string;
};

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export const expenseCategories = [
  "Insumos",
  "Contas Fixas (Água, Luz, Internet)",
  "Folha de Pagamento",
  "Manutenção",
  "Marketing",
  "Impostos",
  "Outros",
];