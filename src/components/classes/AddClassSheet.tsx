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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle } from 'lucide-react';

// --- Schema de Validação ---
const classSchema = z.object({
  name: z.string().min(3, "O nome da turma é obrigatório."),
  school_year: z.coerce.number().min(2000, "Ano letivo inválido.").max(2100, "Ano letivo inválido."),
  period: z.enum(['Manhã', 'Tarde', 'Noite', 'Integral'], {
    required_error: "O período é obrigatório.",
  }),
  room: z.string().optional().nullable(),
  course_id: z.string().uuid("Selecione uma série/ano.").optional().nullable(),
});

type ClassFormData = z.infer<typeof classSchema>;

interface Course {
  id: string;
  name: string;
}

// --- Funções de Busca de Dados ---
const fetchCourses = async (tenantId: string): Promise<Course[]> => {
  const { data, error } = await supabase
    .from('courses')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw new Error(error.message);
  return data;
};

const AddClassSheet: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const { data: courses, isLoading: isLoadingCourses } = useQuery<Course[], Error>({
    queryKey: ['courses', tenantId],
    queryFn: () => fetchCourses(tenantId!),
    enabled: !!tenantId && isOpen,
  });

  const form = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: "",
      school_year: new Date().getFullYear(), // Ano atual como padrão
      period: undefined, // Sem valor padrão para forçar seleção
      room: null,
      course_id: null,
    },
  });

  const onSubmit = async (data: ClassFormData) => {
    if (!tenantId) {
      toast.error("Erro", { description: "ID da escola não encontrado." });
      return;
    }

    try {
      const classData = {
        ...data,
        tenant_id: tenantId,
        room: data.room || null,
        course_id: data.course_id || null,
      };

      const { error } = await supabase
        .from('classes')
        .insert(classData);

      if (error) throw new Error(error.message);

      toast.success("Turma cadastrada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['classes', tenantId] });
      form.reset({
        name: "",
        school_year: new Date().getFullYear(),
        period: undefined,
        room: null,
        course_id: null,
      });
      setIsOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      toast.error("Erro ao Cadastrar Turma", {
        description: errorMessage,
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Turma
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Cadastrar Nova Turma</SheetTitle>
          <SheetDescription>
            Preencha os detalhes para criar uma nova turma.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Turma</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="course_id">Série / Ano</Label>
            <Select onValueChange={(value) => form.setValue('course_id', value === "none" ? null : value)} value={form.watch('course_id') || 'none'}>
              <SelectTrigger disabled={isLoadingCourses}>
                <SelectValue placeholder={isLoadingCourses ? "Carregando Séries/Anos..." : "Selecione a série/ano"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma Série/Ano</SelectItem>
                {courses?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.course_id && <p className="text-sm text-destructive">{form.formState.errors.course_id.message}</p>}
            {(!courses || courses.length === 0) && !isLoadingCourses && (
                <p className="text-xs text-muted-foreground mt-1">
                    Nenhuma série/ano encontrado. Cadastre uma série/ano primeiro.
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
              <Select onValueChange={(value) => form.setValue('period', value as any)} value={form.watch('period') || ''}>
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
            <Button type="submit" disabled={form.formState.isSubmitting || isLoadingCourses}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Turma
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddClassSheet;