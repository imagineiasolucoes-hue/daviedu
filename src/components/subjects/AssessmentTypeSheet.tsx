"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ListChecks, Trash2, PlusCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// --- Tipos e Schemas ---
const assessmentTypeSchema = z.object({
  name: z.string().min(3, "O nome do tipo de avaliação é obrigatório."),
});

type AssessmentTypeFormData = z.infer<typeof assessmentTypeSchema>;

interface AssessmentType {
  id: string;
  name: string;
}

// --- Funções de Dados ---
const fetchAssessmentTypes = async (tenantId: string): Promise<AssessmentType[]> => {
  const { data, error } = await supabase
    .from('assessment_types')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw new Error(error.message);
  return data;
};

const AssessmentTypeSheet: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const { data: assessmentTypes, isLoading: isLoadingTypes } = useQuery<AssessmentType[], Error>({
    queryKey: ['assessmentTypes', tenantId],
    queryFn: () => fetchAssessmentTypes(tenantId!),
    enabled: !!tenantId && isOpen,
  });

  const form = useForm<AssessmentTypeFormData>({
    resolver: zodResolver(assessmentTypeSchema),
    defaultValues: {
      name: "",
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: AssessmentTypeFormData) => {
      if (!tenantId) throw new Error("ID da escola ausente.");
      
      const { error } = await supabase
        .from('assessment_types')
        .insert({ ...data, tenant_id: tenantId });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Tipo de avaliação adicionado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['assessmentTypes', tenantId] });
      form.reset();
    },
    onError: (error) => {
      toast.error("Erro ao Adicionar Tipo", { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (typeId: string) => {
      if (!tenantId) throw new Error("ID da escola ausente.");
      
      const { error } = await supabase
        .from('assessment_types')
        .delete()
        .eq('id', typeId)
        .eq('tenant_id', tenantId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Tipo de avaliação excluído com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['assessmentTypes', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['gradeEntry'] }); // Invalida a página de lançamento de notas
    },
    onError: (error) => {
      toast.error("Erro ao Excluir Tipo", { description: error.message });
    },
  });

  const onSubmit = (data: AssessmentTypeFormData) => {
    addMutation.mutate(data);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="text-primary border-primary hover:bg-primary/10">
          <ListChecks className="mr-2 h-4 w-4" />
          Tipos de Avaliação
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Gerenciar Tipos de Avaliação</SheetTitle>
          <SheetDescription>
            Adicione, visualize e remova os tipos de avaliação usados para lançar notas (Ex: Prova, Trabalho, Participação).
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 py-4">
          {/* Formulário de Adição */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold">Adicionar Novo Tipo</h3>
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Tipo</Label>
              <Input id="name" {...form.register("name")} placeholder="Ex: Prova Bimestral, Trabalho em Grupo" />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <Button type="submit" disabled={addMutation.isPending} className="w-full">
              {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar
            </Button>
          </form>

          <Separator />

          {/* Lista de Tipos */}
          <h3 className="text-lg font-semibold">Tipos Existentes ({assessmentTypes?.length || 0})</h3>
          {isLoadingTypes ? (
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
                  {assessmentTypes?.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteMutation.mutate(type.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {assessmentTypes?.length === 0 && (
                <p className="text-center py-4 text-muted-foreground text-sm">Nenhum tipo de avaliação cadastrado.</p>
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

export default AssessmentTypeSheet;