import React, { useState, useMemo } from 'react';
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
import { Loader2, PlusCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// --- Schema de Validação ---
const classSchema = z.object({
  name: z.string().min(3, "O nome da turma é obrigatório."),
  school_year: z.coerce.number().min(2000, "Ano letivo inválido.").max(2100, "Ano letivo inválido."),
  period: z.enum(['Manhã', 'Tarde', 'Noite', 'Integral'], {
    required_error: "O período é obrigatório.",
  }),
  room: z.string().optional().nullable(),
  // course_ids agora é um array de UUIDs
  course_ids: z.array(z.string().uuid()).min(1, "Selecione pelo menos uma Série/Ano."),
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
  const [selectedCourseToAdd, setSelectedCourseToAdd] = useState<string>('');

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
      course_ids: [], // Inicializa como array vazio
    },
  });

  const selectedCourseIds = form.watch('course_ids');

  const availableCourses = useMemo(() => {
    if (!courses) return [];
    return courses.filter(c => !selectedCourseIds.includes(c.id));
  }, [courses, selectedCourseIds]);

  const selectedCoursesDetails = useMemo(() => {
    if (!courses) return [];
    return courses.filter(c => selectedCourseIds.includes(c.id));
  }, [courses, selectedCourseIds]);

  const handleAddCourse = () => {
    if (selectedCourseToAdd && !selectedCourseIds.includes(selectedCourseToAdd)) {
      form.setValue('course_ids', [...selectedCourseIds, selectedCourseToAdd], { shouldValidate: true });
      setSelectedCourseToAdd('');
    }
  };

  const handleRemoveCourse = (courseId: string) => {
    form.setValue('course_ids', selectedCourseIds.filter(id => id !== courseId), { shouldValidate: true });
  };

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
        course_ids: data.course_ids, // Enviando o array de IDs
      };

      const { error } = await supabase.functions.invoke('create-class', {
        body: JSON.stringify(classData),
      });

      if (error) throw new Error(error.message);

      toast.success("Turma cadastrada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['classes', tenantId] });
      form.reset({
        name: "",
        school_year: new Date().getFullYear(),
        period: undefined,
        room: null,
        course_ids: [],
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

          {/* Seleção Múltipla de Séries/Anos */}
          <div className="space-y-2">
            <Label htmlFor="course_ids">Séries / Anos</Label>
            <div className="flex gap-2">
              <Select 
                onValueChange={setSelectedCourseToAdd} 
                value={selectedCourseToAdd}
                disabled={isLoadingCourses || availableCourses.length === 0}
              >
                <SelectTrigger className="flex-grow">
                  <SelectValue placeholder={isLoadingCourses ? "Carregando Séries/Anos..." : "Adicionar Série/Ano"} />
                </SelectTrigger>
                <SelectContent>
                  {availableCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={handleAddCourse} disabled={!selectedCourseToAdd}>
                Adicionar
              </Button>
            </div>
            
            {/* Exibição dos Cursos Selecionados */}
            <div className="flex flex-wrap gap-2 mt-2 min-h-[30px]">
              {selectedCoursesDetails.map(c => (
                <Badge key={c.id} variant="secondary" className="flex items-center gap-1 pr-1">
                  {c.name}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveCourse(c.id)}
                    className="ml-1 p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
                  >
                    <X className="h-3 w-3 text-destructive" />
                  </button>
                </Badge>
              ))}
            </div>
            {form.formState.errors.course_ids && <p className="text-sm text-destructive">{form.formState.errors.course_ids.message}</p>}
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