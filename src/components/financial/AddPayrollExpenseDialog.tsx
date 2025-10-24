import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { showError, showSuccess } from "@/utils/toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";

interface AddPayrollExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const payrollExpenseSchema = z.object({
  date: z.date({ required_error: "A data é obrigatória." }),
  amount: z.coerce.number().positive("O valor deve ser positivo."),
  description: z.string().optional(),
});

const fetchTenantId = async (userId: string | undefined) => {
    if (!userId) return undefined;
    const { data, error } = await supabase.from("profiles").select("tenant_id").eq("id", userId).single();
    if (error) throw new Error("Failed to fetch tenant ID");
    return data?.tenant_id;
};

export const AddPayrollExpenseDialog: React.FC<AddPayrollExpenseDialogProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tenantId } = useQuery({
    queryKey: ['tenantId', user?.id],
    queryFn: () => fetchTenantId(user?.id),
    enabled: !!user,
  });

  const form = useForm<z.infer<typeof payrollExpenseSchema>>({
    resolver: zodResolver(payrollExpenseSchema),
    defaultValues: {
      date: new Date(),
      amount: 0,
      description: "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof payrollExpenseSchema>) => {
    if (!user || !tenantId) {
      showError("Você precisa estar logado para realizar esta ação.");
      return;
    }

    try {
      const { error: insertError } = await supabase.from("payroll_expenses").insert({
        ...values,
        tenant_id: tenantId,
        user_id: user.id,
      });

      if (insertError) throw insertError;

      showSuccess(`Despesa de folha de pagamento registrada com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["payroll_expenses"] });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      showError(error.message || "Ocorreu um erro ao registrar a despesa de folha de pagamento.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Despesa de Folha de Pagamento</DialogTitle>
          <DialogDescription>Adicione uma nova despesa relacionada à folha de pagamento.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="R$ 0,00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                            format(field.value, "PPP", { locale: ptBR })
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
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Salários, benefícios, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Despesa
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};