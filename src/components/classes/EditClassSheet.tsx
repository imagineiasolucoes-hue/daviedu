import React, { useState, useEffect, useMemo } from 'react';
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

// --- Tipos e Schemas ---
const classSchema = z.object({
  name: z.string().min(3, "O nome da turma é obrigatório."),
  school_year: z.coerce.number().min(2000, "Ano letivo inválido.").max(2100, "Ano letivo inválido."),
  period: z.enum(['Manhã', 'Tarde', 'Noite', 'Integral'], {
    required_error: "O período é obrigatório.",
  }),
  room: z.string().optional().nullable(),
  course_id: z.string().uuid("Selecione um curso/série.").optional().nullable(),
});

type ClassFormData = z.infer<typeof classSchema>;

interface Course {
  id: string;
  name: string;
}

interface ClassDetails extends ClassFormData {
  id: string;
  tenant_id: string;
}

interface EditClassSheetProps {
  classId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// --- Funções de Dados ---
const fetchClassDetails = async (classId: string): Promise<ClassDetails> => {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single();
  if (error) throw new Error(error.message);
  return data as ClassDetails;
};

const fetchCourses = async (tenantId: string): Promise<Course[]> => {
  const { data, error } = await supabase
    .from('courses')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw new Error(error.message);
  return data;
};

const EditClassSheet: React.FC<EditClassSheetProps> = ({ classId, open, onOpenChange }) => {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const { data: classDetails, isLoading: isLoadingClass } = useQuery<ClassDetails, Error>({
    queryKey: ['class', classId],
    queryFn: () => fetchClassDetails(classId!),
    enabled: !!classId && open,
  });

  const { data: courses, isLoading: isLoadingCourses } = useQuery<Course[], Error>({
    queryKey: ['courses', tenantId],
    queryFn: () => fetchCourses(tenantId!),
    enabled: !!tenantId && open,
  });

  const form = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
  });

  useEffect(() => {
    if (classDetails) {
      form.reset({
        name: classDetails.name,
        school_year: classDetails.school_year,
        period: classDetails.period,
        room: classDetails.room || null,
        course_id: classDetails.course_id || null,
      });
    }
  }, [classDetails, form, open]);

  const mutation = useMutation({
    mutationFn: async (data: ClassFormData) => {
      if (!classId || !tenantId) throw new Error("ID da turma ou da escola ausente.");

      const payload = {
        ...data,
        class_id: classId,
        tenant_id: tenantId,
        room: data.room || null,
        course_id: data.course_id || null,
      };

      const { error } = await supabase.functions.invoke('update-class', {
        body: JSON.stringify(payload),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Turma atualizada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['classes', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['class', classId] }); // Refetch details
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erro ao Atualizar Turma", { description: error.message });
    },
  });

  const onSubmit = (data: ClassFormData) => {
    mutation.mutate(data);
  };

  const isLoading = isLoadingClass || isLoadingCourses;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Turma</SheetTitle>
          <SheetDescription>
            Atualize as informações da turma abaixo.
          </SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Turma</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="course_id">Curso / Série</Label>
              <Select onValueChange={(value) => form.setValue('course_id', value === "none" ? null : value)} value={form.watch('course_id') || 'none'}>
                <SelectTrigger disabled={isLoadingCourses}>
                  <SelectValue placeholder={isLoadingCourses ? "Carregando Cursos..." : "Selecione o curso/série"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum Curso/Série</SelectItem>
                  {courses?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.course_id && <p className="text-sm text-destructive">{form.formState.errors.course_id.message}</p>}
              {(!courses || courses.length === 0) && !isLoadingCourses && (
                  <p className="text-xs text-muted-foreground mt-1">
                      Nenhum curso encontrado. Cadastre um curso primeiro.
                  </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="school_year">Ano Letivo</Label>
                <Input id="school_year" type="number" {...form.register("school_year", { valueAsNumber: true })} />
                {form.formState.errors.school_year && <p className="text-sm text-destructive">{form.formState.errors.school_year.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">Período</Label>
                <Select onValueChange={(value) => form.setValue('period', value as any)} value={form.watch('period')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manhã">Manhã</SelectItem>
                    <SelectItem value="Tarde">Tarde</SelectItem>
                    <SelectItem value="Noite">Noite</SelectItem>
                    <SelectItem value="Integral">Integral</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.period && <p className="text-sm text-destructive">{form.formState.errors.period.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="room">Sala (Opcional)</Label>
              <Input id="room" {...form.register("room")} />
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

export default EditClassSheet;