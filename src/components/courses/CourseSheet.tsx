import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle } from 'lucide-react';

// --- Schema de Validação ---
const courseSchema = z.object({
  name: z.string().min(3, "O nome da série/ano é obrigatório."),
  description: z.string().optional().nullable(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CourseSheetProps {
  courseId?: string | null; // Opcional para adição, obrigatório para edição
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fetchCourseDetails = async (courseId: string) => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

const CourseSheet: React.FC<CourseSheetProps> = ({ courseId, open, onOpenChange }) => {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const isEditing = !!courseId;

  const { data: courseDetails, isLoading: isLoadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourseDetails(courseId!),
    enabled: isEditing && open, // Apenas busca se estiver editando e a sheet estiver aberta
  });

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: "",
      description: null,
    },
  });

  useEffect(() => {
    if (isEditing && courseDetails) {
      form.reset({
        name: courseDetails.name,
        description: courseDetails.description || null,
      });
    } else if (!isEditing) {
      form.reset({
        name: "",
        description: null,
      });
    }
  }, [courseDetails, form, isEditing, open]);

  const addMutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      if (!tenantId) throw new Error("ID da escola não encontrado.");
      const courseData = { ...data, tenant_id: tenantId, description: data.description || null };
      const { error } = await supabase.from('courses').insert(courseData);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Série/Ano cadastrado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['courses', tenantId] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erro ao Cadastrar Série/Ano", { description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      if (!courseId || !tenantId) throw new Error("ID da série/ano ou da escola ausente.");
      const courseData = { ...data, description: data.description || null };
      const { error } = await supabase.from('courses').update(courseData).eq('id', courseId).eq('tenant_id', tenantId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Série/Ano atualizado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['courses', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] }); // Refetch details
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erro ao Atualizar Série/Ano", { description: error.message });
    },
  });

  const onSubmit = (data: CourseFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      addMutation.mutate(data);
    }
  };

  const isLoading = isEditing ? isLoadingCourse : false;
  const isSubmitting = addMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {!isEditing && ( // Renderiza o trigger apenas para o modo de adição
        <SheetTrigger asChild>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Série/Ano
          </Button>
        </SheetTrigger>
      )}
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar Série/Ano" : "Cadastrar Nova Série/Ano"}</SheetTitle>
          <SheetDescription>
            {isEditing ? "Atualize as informações da série/ano." : "Defina o nome e a descrição da série ou ano (ex: 1º Ano Fundamental, Ensino Médio)."}
          </SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Série/Ano</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea id="description" {...form.register("description")} />
            </div>

            <SheetFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Salvar Alterações" : "Salvar Série/Ano"}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CourseSheet;