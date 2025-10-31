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

const studentSchema = z.object({
  full_name: z.string().min(5, "Nome completo é obrigatório."),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida."),
  phone: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  class_id: z.string().uuid("Selecione uma turma.").optional().nullable(),
  status: z.enum(['active', 'pre-enrolled', 'inactive']),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface EditStudentSheetProps {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fetchStudentDetails = async (studentId: string) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

const EditStudentSheet: React.FC<EditStudentSheetProps> = ({ studentId, open, onOpenChange }) => {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => fetchStudentDetails(studentId!),
    enabled: !!studentId && open,
  });

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });

  useEffect(() => {
    if (student) {
      form.reset({
        full_name: student.full_name,
        birth_date: student.birth_date,
        phone: student.phone || '',
        email: student.email || '',
        class_id: student.class_id,
        status: student.status,
      });
    }
  }, [student, form, open]);

  const mutation = useMutation({
    mutationFn: async (data: StudentFormData) => {
      const { error } = await supabase.functions.invoke('update-student', {
        body: JSON.stringify({ ...data, student_id: studentId, tenant_id: tenantId }),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Aluno atualizado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['students', tenantId] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erro ao Atualizar", { description: error.message });
    },
  });

  const onSubmit = (data: StudentFormData) => {
    mutation.mutate(data);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Editar Aluno</SheetTitle>
          <SheetDescription>
            Atualize as informações do aluno abaixo.
          </SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input id="full_name" {...form.register("full_name")} />
              {form.formState.errors.full_name && <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input id="birth_date" type="date" {...form.register("birth_date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" type="tel" {...form.register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => form.setValue('status', value as any)} defaultValue={form.getValues('status')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="pre-enrolled">Pré-Matriculado</SelectItem>
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

export default EditStudentSheet;