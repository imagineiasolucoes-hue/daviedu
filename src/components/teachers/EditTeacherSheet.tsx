import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const teacherSchema = z.object({
  full_name: z.string().min(5, "Nome completo é obrigatório."),
  main_subject: z.string().optional(),
  base_salary: z.coerce.number().min(0, "Salário deve ser um valor positivo."),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de contratação inválida."),
  status: z.enum(['active', 'inactive']),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

interface EditTeacherSheetProps {
  teacherId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fetchTeacherDetails = async (teacherId: string) => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', teacherId)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

const EditTeacherSheet: React.FC<EditTeacherSheetProps> = ({ teacherId, open, onOpenChange }) => {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher', teacherId],
    queryFn: () => fetchTeacherDetails(teacherId!),
    enabled: !!teacherId && open,
  });

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
  });

  useEffect(() => {
    if (teacher) {
      form.reset({
        full_name: teacher.full_name,
        main_subject: teacher.main_subject || '',
        base_salary: teacher.base_salary,
        hire_date: teacher.hire_date,
        status: teacher.status,
      });
    }
  }, [teacher, form, open]);

  const mutation = useMutation({
    mutationFn: async (data: TeacherFormData) => {
      const { error } = await supabase.functions.invoke('update-teacher', {
        body: JSON.stringify({ ...data, employee_id: teacherId, tenant_id: tenantId }),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Professor atualizado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['teachers', tenantId] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erro ao Atualizar", { description: error.message });
    },
  });

  const onSubmit = (data: TeacherFormData) => {
    mutation.mutate(data);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Editar Professor</SheetTitle>
          <SheetDescription>
            Atualize as informações do professor abaixo.
          </SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input id="full_name" {...form.register("full_name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="main_subject">Matéria Principal</Label>
              <Input id="main_subject" {...form.register("main_subject")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hire_date">Data de Contratação</Label>
                <Input id="hire_date" type="date" {...form.register("hire_date")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base_salary">Salário Base</Label>
                <Input id="base_salary" type="number" step="0.01" {...form.register("base_salary")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => form.setValue('status', value as any)} defaultValue={form.getValues('status')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SheetFooter className="pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default EditTeacherSheet;