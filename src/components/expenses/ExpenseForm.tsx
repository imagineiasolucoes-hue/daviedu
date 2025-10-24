import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const expenseSchema = z.object({
  date: z.date({ required_error: "A data é obrigatória." }),
  category: z.string().min(1, "A categoria é obrigatória."),
  amount: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().positive("O valor deve ser positivo.")
  ),
  description: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  initialExpense?: {
    id: string;
    date: string;
    category: string;
    amount: number;
    description?: string;
  };
  onSuccess?: () => void;
}

const ExpenseForm = ({ initialExpense, onSuccess }: ExpenseFormProps) => {
  const queryClient = useQueryClient();
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: initialExpense
      ? {
          ...initialExpense,
          date: new Date(initialExpense.date),
        }
      : {
          date: new Date(),
          category: "",
          amount: 0,
          description: "",
        },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (newExpense: Omit<ExpenseFormValues, 'id'>) => {
      const { data, error } = await supabase.from("expenses").insert({
        ...newExpense,
        date: format(newExpense.date, "yyyy-MM-dd"),
        user_id: (await supabase.auth.getUser()).data.user?.id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      showSuccess("Despesa adicionada com sucesso!");
      onSuccess?.();
    },
    onError: (error) => {
      showError(`Erro ao adicionar despesa: ${error.message}`);
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async (updatedExpense: ExpenseFormValues & { id: string }) => {
      const { data, error } = await supabase
        .from("expenses")
        .update({
          ...updatedExpense,
          date: format(updatedExpense.date, "yyyy-MM-dd"),
        })
        .eq("id", updatedExpense.id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      showSuccess("Despesa atualizada com sucesso!");
      onSuccess?.();
    },
    onError: (error) => {
      showError(`Erro ao atualizar despesa: ${error.message}`);
    },
  });

  const onSubmit = (values: ExpenseFormValues) => {
    if (initialExpense) {
      updateExpenseMutation.mutate({ ...values, id: initialExpense.id });
    } else {
      createExpenseMutation.mutate(values);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>Selecione uma data</span>}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Alimentação">Alimentação</SelectItem>
                  <SelectItem value="Transporte">Transporte</SelectItem>
                  <SelectItem value="Moradia">Moradia</SelectItem>
                  <SelectItem value="Entretenimento">Entretenimento</SelectItem>
                  <SelectItem value="Saúde">Saúde</SelectItem>
                  <SelectItem value="Educação">Educação</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} onChange={event => field.onChange(event.target.value)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (Opcional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}>
          {initialExpense ? "Atualizar Despesa" : "Adicionar Despesa"}
        </Button>
      </form>
    </Form>
  );
};

export default ExpenseForm;