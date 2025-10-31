import React, { useEffect, useState, useMemo } from 'react';
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
import { Loader2, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// --- Tipos e Schemas ---
const classAssignmentSchema = z.object({
  class_id: z.string().uuid(),
  period: z.enum(['Manhã', 'Tarde', 'Noite', 'Integral']),
});

const teacherSchema = z.object({
  full_name: z.string().min(5, "Nome completo é obrigatório."),
  main_subject: z.string().optional(),
  base_salary: z.coerce.number().min(0, "Salário deve ser um valor positivo."),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de contratação inválida."),
  status: z.enum(['active', 'inactive']),
  
  // Novos campos de contato e endereço
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  phone: z.string().optional(),
  zip_code: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

interface Class {
  id: string;
  name: string;
  school_year: number;
  period: string;
  courses: { name: string } | null; // Adicionado o nome do curso
}

interface TeacherDetails extends TeacherFormData {
  id: string;
  tenant_id: string;
  teacher_classes: {
    class_id: string;
    period: 'Manhã' | 'Tarde' | 'Noite' | 'Integral';
    classes: {
      name: string;
      school_year: number;
      courses: { name: string } | null; // Adicionado o nome do curso
    } | null;
  }[];
}

interface ClassAssignment extends z.infer<typeof classAssignmentSchema> {
  className: string;
}

interface EditTeacherSheetProps {
  teacherId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// --- Funções de Dados ---
const fetchTeacherDetails = async (teacherId: string): Promise<TeacherDetails> => {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      teacher_classes (
        class_id,
        period,
        classes (
          name,
          school_year,
          courses (name)
        )
      )
    `)
    .eq('id', teacherId)
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as TeacherDetails;
};

const fetchClasses = async (tenantId: string): Promise<Class[]> => {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, school_year, period, courses (name)') // Incluindo courses(name)
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw new Error(error.message);
  return data as unknown as Class[];
};

const EditTeacherSheet: React.FC<EditTeacherSheetProps> = ({ teacherId, open, onOpenChange }) => {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;
  const [classesToTeach, setClassesToTeach] = useState<ClassAssignment[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');

  const { data: teacher, isLoading: isLoadingTeacher } = useQuery<TeacherDetails, Error>({
    queryKey: ['teacher', teacherId],
    queryFn: () => fetchTeacherDetails(teacherId!),
    enabled: !!teacherId && open,
  });

  const { data: allClasses, isLoading: isLoadingClasses } = useQuery<Class[], Error>({
    queryKey: ['classes', tenantId],
    queryFn: () => fetchClasses(tenantId!),
    enabled: !!tenantId && open,
  });

  const availableClasses = useMemo(() => {
    if (!allClasses) return [];
    const assignedIds = classesToTeach.map(c => c.class_id);
    return allClasses.filter(c => !assignedIds.includes(c.id));
  }, [allClasses, classesToTeach]);

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
        status: teacher.status as 'active' | 'inactive',
        email: teacher.email || '',
        phone: teacher.phone || '',
        zip_code: teacher.zip_code || '',
        address_street: teacher.address_street || '',
        address_number: teacher.address_number || '',
        address_neighborhood: teacher.address_neighborhood || '',
        address_city: teacher.address_city || '',
        address_state: teacher.address_state || '',
      });
      
      // Inicializa as turmas
      const initialClasses: ClassAssignment[] = teacher.teacher_classes
        .filter(tc => tc.classes)
        .map(tc => {
          const courseName = tc.classes?.courses?.name ? ` - ${tc.classes.courses.name}` : '';
          return {
            class_id: tc.class_id,
            period: tc.period,
            className: `${tc.classes!.name} (${tc.classes!.school_year})${courseName}`, // Adicionando o nome do curso
          };
        });
      setClassesToTeach(initialClasses);
    }
  }, [teacher, form, open]);

  const handleAddClass = () => {
    if (selectedClassId && selectedPeriod) {
      const classDetails = allClasses?.find(c => c.id === selectedClassId);
      if (classDetails) {
        const courseName = classDetails.courses?.name ? ` - ${classDetails.courses.name}` : '';
        setClassesToTeach(prev => [
          ...prev,
          {
            class_id: selectedClassId,
            period: selectedPeriod as ClassAssignment['period'],
            className: `${classDetails.name} (${classDetails.school_year})${courseName}`, // Adicionando o nome do curso
          }
        ]);
        setSelectedClassId('');
        setSelectedPeriod('');
      }
    }
  };

  const handleRemoveClass = (classId: string) => {
    setClassesToTeach(prev => prev.filter(c => c.class_id !== classId));
  };

  const mutation = useMutation({
    mutationFn: async (data: TeacherFormData) => {
      if (!teacherId) throw new Error("ID do professor ausente.");

      const classesPayload = classesToTeach.map(c => ({
        class_id: c.class_id,
        period: c.period,
      }));

      const payload = {
        ...data,
        employee_id: teacherId,
        tenant_id: tenantId,
        classes_to_teach: classesPayload, // Enviando a lista completa de turmas
        email: data.email || null,
        phone: data.phone || null,
        zip_code: data.zip_code || null,
        address_street: data.address_street || null,
        address_number: data.address_number || null,
        address_neighborhood: data.address_neighborhood || null,
        address_city: data.address_city || null,
        address_state: data.address_state || null,
      };

      const { error } = await supabase.functions.invoke('update-teacher', {
        body: JSON.stringify(payload),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Professor atualizado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['teachers', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['teacher', teacherId] }); // Refetch details
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erro ao Atualizar", { description: error.message });
    },
  });

  const onSubmit = (data: TeacherFormData) => {
    mutation.mutate(data);
  };

  const isLoading = isLoadingTeacher || isLoadingClasses;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Professor</SheetTitle>
          <SheetDescription>
            Atualize as informações do professor abaixo.
          </SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            
            {/* Informações Profissionais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Profissionais</h3>
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
            </div>

            <Separator />

            {/* Contato */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contato</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...form.register("email")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" type="tel" {...form.register("phone")} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Endereço</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input id="zip_code" {...form.register("zip_code")} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address_street">Rua</Label>
                  <Input id="address_street" {...form.register("address_street")} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="address_number">Número</Label>
                  <Input id="address_number" {...form.register("address_number")} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address_neighborhood">Bairro</Label>
                  <Input id="address_neighborhood" {...form.register("address_neighborhood")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_city">Cidade</Label>
                  <Input id="address_city" {...form.register("address_city")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_state">Estado</Label>
                  <Input id="address_state" {...form.register("address_state")} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Turmas para Lecionar */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Turmas para Lecionar</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="class_id">Turma</Label>
                  <Select 
                    onValueChange={setSelectedClassId} 
                    value={selectedClassId}
                    disabled={isLoadingClasses || availableClasses.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingClasses ? "Carregando Turmas..." : "Selecione uma turma"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClasses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.school_year}) {c.courses?.name ? ` - ${c.courses.name}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="period">Turno</Label>
                  <Select 
                    onValueChange={setSelectedPeriod} 
                    value={selectedPeriod}
                    disabled={!selectedClassId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Turno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manhã">Manhã</SelectItem>
                      <SelectItem value="Tarde">Tarde</SelectItem>
                      <SelectItem value="Noite">Noite</SelectItem>
                      <SelectItem value="Integral">Integral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddClass} 
                disabled={!selectedClassId || !selectedPeriod}
                className="w-full"
              >
                Adicionar Turma
              </Button>

              {/* Lista de Turmas Adicionadas */}
              <div className="space-y-2 pt-2">
                {classesToTeach.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma turma adicionada.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {classesToTeach.map(c => (
                      <Badge key={c.class_id} variant="secondary" className="flex items-center gap-1 pr-1">
                        {c.className} ({c.period})
                        <button 
                          type="button" 
                          onClick={() => handleRemoveClass(c.class_id)}
                          className="ml-1 p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
                        >
                          <X className="h-3 w-3 text-destructive" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
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