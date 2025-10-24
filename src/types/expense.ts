import { z } from "zod";

export const expenseSchema = z.object({
  id: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  description: z.string().max(255).optional(),
  category: z.string().min(1, "Category is required"),
  date: z.date({
    required_error: "A date is required.",
  }),
});

export type Expense = z.infer<typeof expenseSchema> & {
  user_id: string;
  created_at: string;
};

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export const expenseCategories = [
  "Food",
  "Transport",
  "Housing",
  "Entertainment",
  "Utilities",
  "Other",
];