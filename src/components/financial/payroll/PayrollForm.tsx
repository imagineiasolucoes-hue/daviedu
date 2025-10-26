import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Payroll } from "@/types/financial";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

const payrollSchema = z.object({
  discounts: z.coerce.number().min(0, "O valor não pode ser negativo."),
  benefits: z.coerce.number().min(0, "O valor não pode ser negativo."),
  payment_status: z.enum(["pago", "pendente", "atrasado"]),
});

interface PayrollFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Payroll | null;
}

const PayrollForm: React.FC<PayrollFormProps> = ({ isOpen, onClose, initialData }) => {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof payrollSchema>>({
    resolver: zodResolver(payrollSchema),
  });

  const { watch, setValue } = form;
  const discounts = watch("discounts", 0);
  const benefits = watch("benefits", 0);
  const grossSalary = initialData?.gross_salary || 0;
  const netSalary = grossSalary + benefits - discounts;

  useEffect(() => {
    if (initialData) {
      form.reset({
        discounts: Number(initialData.discounts),
        benefits: Number(initialData.benefits),
        payment_status: initialData.payment_status,
      });
    }
  }, [initialData, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof payrollSchema>) => {
      const submissionData = {
        ...values,
        net_salary: netSalary,
      };
      const { error } = await supabase
        .from("payrolls")
        .update(submissionData)
        .eq("id", initialData!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Lançamento atualizado!");
      if (initialData) {
        const monthKey = format(new Date(initialData.reference_month), "yyyy-MM");
        queryClient.invalidateQueries({ queryKey: ["payrolls", monthKey] });
      }
      onClose();
    },
    onError: (error: any) => showError(error.message),
  });

  const onSubmit = (values: z.infer<typeof payrollSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Lançamento da Folha</DialogTitle>
          <DialogDescription>
            Ajuste os descontos, benefícios e o status do pagamento.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="p-4 border rounded-md bg-muted/50">
              <p className="font-medium">Salário Bruto: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(grossSalary)}</p>
              <p className="font-bold text-lg mt-2">Salário Líquido: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(netSalary)}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discounts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descontos (Ex: Faltas, INSS)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benefícios (Ex: Bônus, VT)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="payment_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status do Pagamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="atrasado">Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PayrollForm;