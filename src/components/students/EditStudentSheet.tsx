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
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida. Use o formato AAAA-MM-DD."),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')).nullable(),
  class_id: z.string().uuid("Selecione uma turma.").optional().nullable(),
  status: z.enum(['active', 'pre-enrolled', 'inactive']),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface EditStudentSheetProps {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Class {
  id: string;
  name: string;
  school_year: number;
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

const fetchClasses = async (tenantId: string): Promise<Class[]> => {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, school_year')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw new Error(error.message);
  return data as Class[];
};

const EditStudentSheet: React.FC<EditStudentSheetProps> = ({ studentId, open, onOpenChange }) => {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const { data: student, isLoading: isLoadingStudent } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => fetchStudentDetails(studentId!),
    enabled: !!studentId && open,
  });

  const { data: classes, isLoading: isLoadingClasses } = useQuery<Class[], Error>({
    queryKey: ['classes', tenantId],
    queryFn: () => fetchClasses(tenantId!),
    enabled: !!tenantId && open,
  });

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });

  useEffect(() => {
    if (student) {
      form.reset({
        full_name: student.full_name,
        birth_date: student.birth_date,
        phone: student.phone || null,
        email: student.email || null,
        class_id: student.class_id || null,
        status: student.status,
      });
    }
  }, [student, form, open]);

  const mutation = useMutation({
    mutationFn: async (data: StudentFormData) => {
      const { error } = await supabase.functions.invoke('update-student', {
        body: JSON.stringify({ 
          ...data, 
          student_id: studentId, 
          tenant_id: tenantId,
          class_id: data.class_id || null,
          email: data.email || null,
          phone: data.phone || null,
        }),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Aluno atualizado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['students', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['student', studentId] }); // Refetch details
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erro ao Atualizar", { description: error.message });
    },
  });

  const onSubmit = (data: StudentFormData) => {
    mutation.mutate(data);
  };

  const isLoading = isLoadingStudent || isLoadingClasses;

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
          <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
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
              {form.formState.errors.birth_date && <p className="text-sm text-destructive">{form.formState.errors.birth_date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" type="tel" {...form.register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
            </div>
            
            {/* Campo de Turma (Class ID) */}
            <div className="space-y-2">
              <Label htmlFor="class_id">Turma</Label>
              <Select 
                onValueChange={(value) => form.setValue('class_id', value === 'none' ? null : value)} 
                value={form.watch('class_id') || 'none'}
                disabled={isLoadingClasses}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingClasses ? "Carregando Turmas..." : "Selecione uma turma"} />
                </SelectTrigger>
                <SelectContent>
                  {/* Opção para desvincular a turma */}
                  <SelectItem value="none">Nenhuma Turma (Desvincular)</SelectItem>
                  {classes?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.school_year})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Button type="submit" disabled={mutation.isPending || isLoading}>
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