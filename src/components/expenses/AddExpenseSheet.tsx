import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, PlusCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// --- Tipos e Schemas ---
const expenseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida. Use o formato AAAA-MM-DD."),
  category_id: z.string().uuid("Selecione uma categoria."),
  description: z.string().optional().nullable(),
  amount: z.coerce.number().min(0.01, "O valor deve ser maior que zero."),
  payment_method: z.enum(['Dinheiro', 'Cartão', 'Pix', 'Boleto', 'Transferência'], {
    required_error: "O método de pagamento é obrigatório.",
  }),
  destination: z.string().optional().nullable(),
  status: z.enum(['pendente', 'pago'], {
    required_error: "O status é obrigatório.",
  }),
  is_recurring: z.boolean().default(false),
  attachment_url: z.string().url("URL de anexo inválida.").optional().or(z.literal('')).nullable(),
  payroll_id: z.string().uuid("Selecione uma folha de pagamento.").optional().nullable(), // Para vincular a despesas de folha
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseCategory {
  id: string;
  name: string;
}

// --- Funções de Dados ---
const fetchExpenseCategories = async (tenantId: string): Promise<ExpenseCategory[]> => {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw new Error(error.message);
  return data;
};

// Nota: A busca por payrolls (folhas de pagamento) será omitida por enquanto para simplificar,
// mas o campo payroll_id está no schema.

const AddExpenseSheet: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const { data: categories, isLoading: isLoadingCategories } = useQuery<ExpenseCategory[], Error>({
    queryKey: ['expenseCategories', tenantId],
    queryFn: () => fetchExpenseCategories(tenantId!),
    enabled: !!tenantId && isOpen,
  });

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      description: null,
      amount: 0,
      is_recurring: false,
      status: 'pendente',
      attachment_url: null,
      payroll_id: null,
      destination: null,
    },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    if (!tenantId) {
      toast.error("Erro", { description: "ID da escola não encontrado." });
      return;
    }

    try {
      const expenseData = {
        ...data,
        tenant_id: tenantId,
        description: data.description || null,
        destination: data.destination || null,
        attachment_url: data.attachment_url || null,
        payroll_id: data.payroll_id || null,
      };

      const { error } = await supabase
        .from('expenses')
        .insert(expenseData);

      if (error) throw new Error(error.message);

      toast.success("Despesa registrada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['expenses', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics', tenantId] }); // Atualiza o dashboard
      queryClient.invalidateQueries({ queryKey: ['financeMetrics', tenantId] }); // Atualiza o financeiro
      form.reset({
        date: new Date().toISOString().split('T')[0],
        description: null,
        amount: 0,
        is_recurring: false,
        status: 'pendente',
        category_id: undefined,
        payment_method: undefined,
        destination: null,
        attachment_url: null,
        payroll_id: null,
      });
      setIsOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      toast.error("Erro ao Registrar Despesa", {
        description: errorMessage,
      });
    }
  };

  const isLoading = isLoadingCategories;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="destructive">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Despesa
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Registrar Nova Despesa</SheetTitle>
          <SheetDescription>
            Insira os detalhes da despesa realizada ou a realizar.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          
          {/* Detalhes Principais */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" {...form.register("date")} />
              {form.formState.errors.date && <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input id="amount" type="number" step="0.01" {...form.register("amount", { valueAsNumber: true })} />
              {form.formState.errors.amount && <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_id">Categoria</Label>
            <Select onValueChange={(value) => form.setValue('category_id', value)} value={form.watch('category_id') || ''}>
              <SelectTrigger disabled={isLoadingCategories}>
                <SelectValue placeholder={isLoadingCategories ? "Carregando Categorias..." : "Selecione a categoria"} />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category_id && <p className="text-sm text-destructive">{form.formState.errors.category_id.message}</p>}
            {(!categories || categories.length === 0) && !isLoadingCategories && (
                <p className="text-xs text-muted-foreground mt-1">
                    Nenhuma categoria encontrada. Cadastre uma categoria de despesa primeiro.
                </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea id="description" {...form.register("description")} placeholder="Ex: Compra de material de escritório" />
          </div>

          <Separator />

          {/* Pagamento e Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Método de Pagamento</Label>
              <Select onValueChange={(value) => form.setValue('payment_method', value as any)} value={form.watch('payment_method') || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Cartão">Cartão</SelectItem>
                  <SelectItem value="Pix">Pix</SelectItem>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.payment_method && <p className="text-sm text-destructive">{form.formState.errors.payment_method.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => form.setValue('status', value as any)} value={form.watch('status')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.status && <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Destino / Fornecedor (Opcional)</Label>
            <Input id="destination" {...form.register("destination")} placeholder="Ex: Papelaria Central" />
          </div>

          <Separator />

          {/* Recorrência e Anexo */}
          <div className="grid grid-cols-2 gap-4 items-start">
            <div className="space-y-2">
              <Label htmlFor="attachment_url">URL do Anexo (Opcional)</Label>
              <Input id="attachment_url" {...form.register("attachment_url")} placeholder="Link para nota fiscal ou comprovante" />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="is_recurring"
                checked={form.watch('is_recurring')}
                onCheckedChange={(checked) => form.setValue('is_recurring', checked)}
              />
              <Label htmlFor="is_recurring">Despesa Recorrente</Label>
            </div>
          </div>
          
          {/* O campo payroll_id será gerenciado em outra feature, mas está no schema */}

          <SheetFooter className="pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Despesa
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddExpenseSheet;