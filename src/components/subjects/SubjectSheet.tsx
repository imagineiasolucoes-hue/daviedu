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
import { Loader2, PlusCircle, BookOpen, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// --- Tipos e Schemas ---
const subjectSchema = z.object({
  name: z.string().min(3, "O nome da matéria é obrigatório."),
});

type SubjectFormData = z.infer<typeof subjectSchema>;

interface Subject {
  id: string;
  name: string;
}

// --- Funções de Dados ---
const fetchSubjects = async (tenantId: string): Promise<Subject[]> => {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw new Error(error.message);
  return data;
};

const SubjectSheet: React.FC = () => {
  console.log("SubjectSheet is rendering"); // Added console log
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const { data: subjects, isLoading: isLoadingSubjects } = useQuery<Subject[], Error>({
    queryKey: ['subjects', tenantId],
    queryFn: () => fetchSubjects(tenantId!),
    enabled: !!tenantId && isOpen,
  });

  const form = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: SubjectFormData) => {
      if (!tenantId) throw new Error("ID da escola ausente.");
      
      const { error } = await supabase
        .from('subjects')
        .insert({ ...data, tenant_id: tenantId });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Matéria adicionada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['subjects', tenantId] });
      form.reset();
    },
    onError: (error) => {
      toast.error("Erro ao Adicionar Matéria", { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (subjectId: string) => {
      if (!tenantId) throw new Error("ID da escola ausente.");
      
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId)
        .eq('tenant_id', tenantId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Matéria excluída com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['subjects', tenantId] });
    },
    onError: (error) => {
      toast.error("Erro ao Excluir Matéria", { description: error.message });
    },
  });

  const onSubmit = (data: SubjectFormData) => {
    addMutation.mutate(data);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {/* Making the button more prominent for testing visibility */}
        <Button variant="default" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md">
          <BookOpen className="mr-2 h-4 w-4" />
          Gerenciar Matérias
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Gerenciar Matérias</SheetTitle>
          <SheetDescription>
            Adicione, visualize e remova as matérias lecionadas na escola.
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 py-4">
          {/* Formulário de Adição */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold">Adicionar Nova Matéria</h3>
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Matéria</Label>
              <Input id="name" {...form.register("name")} placeholder="Ex: Matemática, Português, História" />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <Button type="submit" disabled={addMutation.isPending} className="w-full">
              {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar
            </Button>
          </form>

          <Separator />

          {/* Lista de Matérias */}
          <h3 className="text-lg font-semibold">Matérias Existentes ({subjects?.length || 0})</h3>
          {isLoadingSubjects ? (
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
                  {subjects?.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteMutation.mutate(subject.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {subjects?.length === 0 && (
                <p className="text-center py-4 text-muted-foreground text-sm">Nenhuma matéria cadastrada.</p>
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

export default SubjectSheet;