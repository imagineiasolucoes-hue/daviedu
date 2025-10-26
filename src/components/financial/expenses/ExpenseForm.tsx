import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { fetchTenantId } from "@/lib/tenant";
import { showError, showSuccess } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription as FormDescriptionComponent,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Employee, Expense } from "@/types/financial";

const expenseSchema = z.object({
  date: z.date({ required_error: "A data é obrigatória." }),
  description: z.string().min(3, "A descrição é obrigatória."),
  amount: z.coerce.number().positive("O valor deve ser positivo."),
  payment_method: z.string().min(1, "A forma de pagamento é obrigatória."),
  destination: z.string().optional(),
  status: z.enum(["pago", "pendente", "atrasado"]),
  category_id: z.string().optional(),
  is_recurring: z.boolean().default(false),
  employee_id: z.string().optional(), // For payroll expenses
});

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Expense | null;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;
  const [payrollCategoryId, setPayrollCategoryId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
  });

  const { watch } = form;
  const selectedCategoryId = watch("category_id");
  const isPayrollExpense = !isEditMode && selectedCategoryId === payrollCategoryId && payrollCategoryId !== null;

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        date: new Date(initialData.date),
        amount: Number(initialData.amount),
        category_id: initialData.category_id || "",
        is_recurring: initialData.is_recurring || false,
      });
    } else {
      form.reset({
        date: new Date(),
        description: "",
        amount: 0,
        payment_method: "",
        destination: "",
        status: "pago", // Default to 'pago' for new expenses
        category_id: "",
        is_recurring: false,
        employee_id: "",
      });
    }
  }, [initialData, form]);

  const { data: categories } = useQuery({
    queryKey: ["expense_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("id, name");
      if (error) throw new Error(error.message);
      const payrollCat = data?.find(cat => cat.name.toLowerCase().includes("folha"));
      if (payrollCat) {
        setPayrollCategoryId(payrollCat.id);
      }
      return data;
    },
  });

  const { data: employees } = useQuery<Pick<Employee, 'id' | 'full_name'>[]>({
    queryKey: ["employees"],
    queryFn: async () => {
        const { data, error } = await supabase.from("employees").select("id, full_name").eq('status', 'active');
        if (error) throw new Error(error.message);
        return data || [];
    },
    enabled: isPayrollExpense, // Only fetch if needed
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof expenseSchema>) => {
      const { tenantId, error: tenantError } = await fetchTenantId();
      if (tenantError) throw new Error(tenantError);

      // Handle payroll expense creation
      if (!isEditMode && values.category_id === payrollCategoryId) {
        if (!values.employee_id) {
          throw new Error("Por favor, selecione um funcionário para o pagamento.");
        }
        const payrollData = {
          tenant_id: tenantId,
          employee_id: values.employee_id,
          reference_month: format(startOfMonth(values.date), "yyyy-MM-dd"),
          gross_salary: values.amount,
          net_salary: values.amount,
          discounts: 0,
          benefits: 0,
          payment_status: "pago" as const,
        };

        const { data: existing, error: checkError } = await supabase
          .from('payrolls')
          .select('id')
          .eq('employee_id', values.employee_id)
          .eq('reference_month', payrollData.reference_month)
          .maybeSingle();
        
        if (checkError) throw checkError;

        if (existing) {
          const { error } = await supabase.from('payrolls').update({
            gross_salary: values.amount, net_salary: values.amount, discounts: 0, benefits: 0, payment_status: 'pago'
          }).eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("payrolls").insert(payrollData);
          if (error) throw error;
        }
      } else { // Handle regular expense creation/update
        const submissionData = {
          ...values,
          tenant_id: tenantId,
          date: format(values.date, "yyyy-MM-dd"),
          category_id: values.category_id || null,
        };

        if (isEditMode) {
          const { error } = await supabase
            .from("expenses")
            .update(submissionData)
            .eq("id", initialData!.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("expenses").insert(submissionData);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      const isPayroll = !isEditMode && form.getValues("category_id") === payrollCategoryId;
      if (isPayroll) {
        showSuccess("Pagamento de funcionário registrado com sucesso!");
        queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      } else {
        showSuccess(isEditMode ? "Despesa atualizada com sucesso!" : "Despesa adicionada com sucesso!");
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
      }
      queryClient.invalidateQueries({ queryKey: ["financialReports"] });
      onClose();
    },
    onError: (error: any) => {
      showError(`Erro: ${error.message}`);
    },
  });

  const onSubmit = (values: z.infer<typeof expenseSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Despesa" : "Adicionar Nova Despesa"}
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes do lançamento financeiro.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Compra de material de escritório" {...field} />
                    </FormControl>
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
                      <Input type="number" placeholder="0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Escolha uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isEditMode}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um método" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Boleto">Boleto</SelectItem>
                        <SelectItem value="Pix">Pix</SelectItem>
                        <SelectItem value="Cartão de Crédito">
                          Cartão de Crédito
                        </SelectItem>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {isPayrollExpense && (
              <FormField
                control={form.control}
                name="employee_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funcionário</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o funcionário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees?.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
             <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destino/Fornecedor (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Papelaria Central" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="is_recurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Pagamento Recorrente</FormLabel>
                    <FormDescriptionComponent>
                      Marque se esta despesa se repete mensalmente.
                    </FormDescriptionComponent>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isEditMode ? (
                  "Salvar Alterações"
                ) : (
                  "Adicionar Despesa"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseForm;