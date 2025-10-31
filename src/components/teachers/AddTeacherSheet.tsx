import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle } from 'lucide-react';

const teacherSchema = z.object({
  full_name: z.string().min(5, "Nome completo é obrigatório."),
  main_subject: z.string().optional(),
  base_salary: z.coerce.number().min(0, "Salário deve ser um valor positivo."),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de contratação inválida."),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

const AddTeacherSheet: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      full_name: "",
      main_subject: "",
      hire_date: "",
    },
  });

  const onSubmit = async (data: TeacherFormData) => {
    if (!tenantId) {
      toast.error("Erro", { description: "ID da escola não encontrado." });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('create-teacher', {
        body: JSON.stringify({ ...data, tenant_id: tenantId }),
      });

      if (error) throw new Error(error.message);

      toast.success("Professor cadastrado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['teachers', tenantId] });
      form.reset();
      setIsOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      toast.error("Erro ao Cadastrar", { description: errorMessage });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Professor
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Cadastrar Novo Professor</SheetTitle>
          <SheetDescription>
            Preencha as informações para adicionar um novo professor.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input id="full_name" {...form.register("full_name")} />
            {form.formState.errors.full_name && <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="main_subject">Matéria Principal</Label>
            <Input id="main_subject" {...form.register("main_subject")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hire_date">Data de Contratação</Label>
              <Input id="hire_date" type="date" {...form.register("hire_date")} />
              {form.formState.errors.hire_date && <p className="text-sm text-destructive">{form.formState.errors.hire_date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="base_salary">Salário Base</Label>
              <Input id="base_salary" type="number" step="0.01" {...form.register("base_salary")} />
              {form.formState.errors.base_salary && <p className="text-sm text-destructive">{form.formState.errors.base_salary.message}</p>}
            </div>
          </div>
          <SheetFooter className="pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Professor
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddTeacherSheet;