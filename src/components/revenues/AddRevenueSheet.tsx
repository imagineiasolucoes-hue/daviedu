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
const revenueSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  category_id: z.string().uuid("Selecione uma categoria."),
  description: z.string().optional(),
  amount: z.coerce.number().min(0.01, "O valor deve ser maior que zero."),
  payment_method: z.enum(['Dinheiro', 'Cartão', 'Pix', 'Boleto', 'Transferência'], {
    required_error: "O método de pagamento é obrigatório.",
  }),
  source: z.string().optional(),
  status: z.enum(['pendente', 'pago'], {
    required_error: "O status é obrigatório.",
  }),
  is_recurring: z.boolean().default(false),
  student_id: z.string().uuid("Selecione um aluno.").optional().nullable(),
});

type RevenueFormData = z.infer<typeof revenueSchema>;

interface RevenueCategory {
  id: string;
  name: string;
}

interface Student {
  id: string;
  full_name: string;
  registration_code: string;
}

// --- Funções de Dados ---
const fetchRevenueCategories = async (tenantId: string): Promise<RevenueCategory[]> => {
  const { data, error } = await supabase
    .from('revenue_categories')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw new Error(error.message);
  return data;
};

const fetchStudents = async (tenantId: string): Promise<Student[]> => {
  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, registration_code')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .order('full_name');
  if (error) throw new Error(error.message);
  return data as Student[];
};

const AddRevenueSheet: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const { data: categories, isLoading: isLoadingCategories } = useQuery<RevenueCategory[], Error>({
    queryKey: ['revenueCategories', tenantId],
    queryFn: () => fetchRevenueCategories(tenantId!),
    enabled: !!tenantId && isOpen,
  });

  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[], Error>({
    queryKey: ['activeStudents', tenantId],
    queryFn: () => fetchStudents(tenantId!),
    enabled: !!tenantId && isOpen,
  });

  const form = useForm<RevenueFormData>({
    resolver: zodResolver(revenueSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      description: "",
      amount: 0,
      is_recurring: false,
      student_id: null,
      status: 'pendente',
    },
  });

  const onSubmit = async (data: RevenueFormData) => {
    if (!tenantId) {
      toast.error("Erro", { description: "ID da escola não encontrado." });
      return;
    }

    try {
      const revenueData = {
        ...data,
        tenant_id: tenantId,
        student_id: data.student_id || null,
        description: data.description || null,
        source: data.source || null,
      };

      const { error } = await supabase
        .from('revenues')
        .insert(revenueData);

      if (error) throw new Error(error.message);

      toast.success("Receita registrada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['revenues', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics', tenantId] }); // Atualiza o dashboard
      form.reset({
        date: new Date().toISOString().split('T')[0],
        description: "",
        amount: 0,
        is_recurring: false,
        student_id: null,
        status: 'pendente',
        category_id: undefined,
        payment_method: undefined,
        source: "",
      });
      setIsOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      toast.error("Erro ao Registrar Receita", {
        description: errorMessage,
      });
    }
  };

  const isLoading = isLoadingCategories || isLoadingStudents;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Receita
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Registrar Nova Receita</SheetTitle>
          <SheetDescription>
            Insira os detalhes da receita recebida ou a receber.
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
                    Nenhuma categoria encontrada. Cadastre uma categoria de receita primeiro.
                </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea id="description" {...form.register("description")} placeholder="Ex: Mensalidade de Setembro" />
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
            <Label htmlFor="source">Fonte (Opcional)</Label>
            <Input id="source" {...form.register("source")} placeholder="Ex: Caixa da Secretaria" />
          </div>

          <Separator />

          {/* Recorrência e Aluno */}
          <div className="grid grid-cols-2 gap-4 items-start">
            <div className="space-y-2">
              <Label htmlFor="student_id">Vincular Aluno (Opcional)</Label>
              <Select 
                onValueChange={(value) => form.setValue('student_id', value === "none" ? null : value)} 
                value={form.watch('student_id') || 'none'}
              >
                <SelectTrigger disabled={isLoadingStudents}>
                  <SelectValue placeholder={isLoadingStudents ? "Carregando Alunos..." : "Selecione um aluno"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum Aluno</SelectItem>
                  {students?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.registration_code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="is_recurring"
                checked={form.watch('is_recurring')}
                onCheckedChange={(checked) => form.setValue('is_recurring', checked)}
              />
              <Label htmlFor="is_recurring">Receita Recorrente</Label>
            </div>
          </div>

          <SheetFooter className="pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Receita
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddRevenueSheet;