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
import { Loader2, PlusCircle, ListChecks, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// --- Tipos e Schemas ---
const categorySchema = z.object({
  name: z.string().min(3, "O nome da categoria é obrigatório."),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface RevenueCategory {
  id: string;
  name: string;
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

const RevenueCategorySheet: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const { data: categories, isLoading: isLoadingCategories } = useQuery<RevenueCategory[], Error>({
    queryKey: ['revenueCategories', tenantId],
    queryFn: () => fetchRevenueCategories(tenantId!),
    enabled: !!tenantId && isOpen,
  });

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      if (!tenantId) throw new Error("ID da escola ausente.");
      
      const { error } = await supabase
        .from('revenue_categories')
        .insert({ ...data, tenant_id: tenantId });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Categoria adicionada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['revenueCategories', tenantId] });
      form.reset();
    },
    onError: (error) => {
      toast.error("Erro ao Adicionar Categoria", { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      if (!tenantId) throw new Error("ID da escola ausente.");
      
      const { error } = await supabase
        .from('revenue_categories')
        .delete()
        .eq('id', categoryId)
        .eq('tenant_id', tenantId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Categoria excluída com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['revenueCategories', tenantId] });
    },
    onError: (error) => {
      toast.error("Erro ao Excluir Categoria", { description: error.message });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    addMutation.mutate(data);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="text-primary border-primary hover:bg-primary/10">
          <ListChecks className="mr-2 h-4 w-4" />
          Categorias
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Gerenciar Categorias de Receita</SheetTitle>
          <SheetDescription>
            Adicione, visualize e remova categorias para organizar suas receitas.
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 py-4">
          {/* Formulário de Adição */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold">Adicionar Nova Categoria</h3>
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Categoria</Label>
              <Input id="name" {...form.register("name")} placeholder="Ex: Mensalidade, Fardamento, Eventos" />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <Button type="submit" disabled={addMutation.isPending} className="w-full">
              {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar
            </Button>
          </form>

          <Separator />

          {/* Lista de Categorias */}
          <h3 className="text-lg font-semibold">Categorias Existentes ({categories?.length || 0})</h3>
          {isLoadingCategories ? (
            <div className="flex justify-center items-center h-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories?.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteMutation.mutate(category.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {categories?.length === 0 && (
                <p className="text-center py-4 text-muted-foreground text-sm">Nenhuma categoria cadastrada.</p>
              )}
            </div>
          )}
        </div>
        
        <SheetFooter className="pt-4">
          {/* O footer pode ser usado para fechar ou outras ações */}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default RevenueCategorySheet;