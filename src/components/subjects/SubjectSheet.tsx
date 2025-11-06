"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle } from 'lucide-react';

// --- Tipos e Schemas ---
const subjectSchema = z.object({
  name: z.string().min(3, "O nome da matéria é obrigatório."),
});

type SubjectFormData = z.infer<typeof subjectSchema>;

const SubjectSheet: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

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
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao Adicionar Matéria", { description: error.message });
    },
  });

  const onSubmit = (data: SubjectFormData) => {
    addMutation.mutate(data);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Matéria
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Cadastrar Nova Matéria</SheetTitle>
          <SheetDescription>
            Defina o nome da nova matéria lecionada na escola.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Matéria</Label>
            <Input id="name" {...form.register("name")} placeholder="Ex: Matemática, Português, História" />
            {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          
          <SheetFooter className="pt-4">
            <Button type="submit" disabled={addMutation.isPending} className="w-full">
              {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Matéria
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default SubjectSheet;