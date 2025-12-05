import React, { useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import GuardianForm, { guardianSchema, GuardianFormData } from './GuardianForm';

// --- Tipos de Dados Auxiliares ---
interface Course {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  school_year: number;
  class_courses: {
    course_id: string;
    courses: { id: string; name: string } | null;
  }[];
}

interface GuardianDetails {
  id: string;
  full_name: string;
  relationship: string;
  phone: string | null;
  email: string | null;
  cpf: string | null;
}

interface StudentDetails {
  id: string;
  full_name: string;
  registration_code: string;
  birth_date: string;
  class_id: string | null;
  course_id: string | null;
  status: 'active' | 'pre-enrolled' | 'inactive';
  phone: string | null;
  email: string | null;
  cpf: string | null;
  rg: string | null;
  gender: 'Masculino' | 'Feminino' | 'Outro' | null;
  nationality: string | null;
  naturality: string | null;
  zip_code: string | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  special_needs: string | null;
  medication_use: string | null;
  
  // Relação para buscar o responsável principal
  student_guardians: {
    is_primary: boolean;
    guardians: GuardianDetails | null;
  }[];
}

// Função auxiliar para pré-processar strings vazias para null
const preprocessString = z.preprocess(
  (value) => (value === '' ? null : value),
  z.string().optional().nullable()
);

// --- Schema de Validação (Completo) ---
const studentSchema = z.object({
  full_name: z.string().min(5, "Nome completo é obrigatório."),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida. Use o formato AAAA-MM-DD."),
  class_id: z.string().uuid("Selecione uma turma.").optional().nullable(),
  course_id: z.string().uuid("Selecione uma série/ano.").optional().nullable(),
  status: z.enum(['active', 'pre-enrolled', 'inactive']),
  
  phone: preprocessString, 
  email: z.preprocess(
    (value) => (value === '' ? null : value),
    z.string().email("Email inválido.").optional().nullable()
  ), 
  cpf: preprocessString, 
  rg: preprocessString, 
  gender: z.enum(['Masculino', 'Feminino', 'Outro']).optional().nullable(),
  nationality: preprocessString,
  naturality: preprocessString, 
  zip_code: preprocessString,
  address_street: preprocessString,
  address_number: preprocessString,
  address_neighborhood: preprocessString,
  address_city: preprocessString,
  address_state: preprocessString,
  special_needs: preprocessString,
  medication_use: preprocessString,
}).merge(guardianSchema); 

type StudentFormData = z.infer<typeof studentSchema>;

interface EditStudentSheetProps {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// --- Funções de Busca de Dados ---
const fetchStudentDetails = async (studentId: string): Promise<StudentDetails> => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      student_guardians (
        is_primary,
        guardians (*)
      )
    `)
    .eq('id', studentId)
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as StudentDetails;
};

const fetchClasses = async (tenantId: string): Promise<Class[]> => {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, school_year, class_courses(course_id, courses(id, name))')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw new Error(error.message);
  return data as unknown as Class[];
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

const EditStudentSheet: React.FC<EditStudentSheetProps> = ({ studentId, open, onOpenChange }) => {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const { data: student, isLoading: isLoadingStudent } = useQuery<StudentDetails, Error>({
    queryKey: ['student', studentId],
    queryFn: () => fetchStudentDetails(studentId!),
    enabled: !!studentId && open,
  });

  const { data: allClasses, isLoading: isLoadingClasses } = useQuery<Class[], Error>({
    queryKey: ['classes', tenantId],
    queryFn: () => fetchClasses(tenantId!),
    enabled: !!tenantId && open,
  });

  const { data: allCourses, isLoading: isLoadingCourses } = useQuery<Course[], Error>({
    queryKey: ['courses', tenantId],
    queryFn: () => fetchCourses(tenantId!),
    enabled: !!tenantId && open,
  });

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });

  const selectedClassId = form.watch('class_id');

  // --- DEBUG: Log de Erros ---
  useEffect(() => {
    if (open) {
      const subscription = form.watch((value, { name, type }) => {
        // Tenta validar o formulário a cada mudança para capturar erros
        form.trigger().then(isValid => {
          if (!isValid) {
            console.error("FORM VALIDATION ERRORS:", form.formState.errors);
          }
        });
      });
      return () => subscription.unsubscribe();
    }
  }, [form, open]);
  // --- FIM DEBUG ---

  // Encontra a turma selecionada e seus cursos associados
  const selectedClass = useMemo(() => {
    if (!allClasses || !selectedClassId) return null;
    return allClasses.find(c => c.id === selectedClassId);
  }, [allClasses, selectedClassId]);

  // Filtra as Séries/Anos disponíveis com base na Turma selecionada
  const filteredCourses = useMemo(() => {
    if (!selectedClass) return [];
    
    return selectedClass.class_courses
      .map(cc => cc.courses)
      .filter(c => c !== null) as Course[];
  }, [selectedClass]);

  // Efeito para carregar dados no formulário
  useEffect(() => {
    if (student) {
      const primaryGuardian = student.student_guardians.find(sg => sg.is_primary)?.guardians;
      
      form.reset({
        full_name: student.full_name,
        birth_date: student.birth_date,
        phone: student.phone || null,
        email: student.email || null,
        class_id: student.class_id || null,
        course_id: student.course_id || null,
        status: student.status,
        cpf: student.cpf || null,
        rg: student.rg || null,
        gender: student.gender || null,
        nationality: student.nationality || null,
        naturality: student.naturality || null,
        zip_code: student.zip_code || null,
        address_street: student.address_street || null,
        address_number: student.address_number || null,
        address_neighborhood: student.address_neighborhood || null,
        address_city: student.address_city || null,
        address_state: student.address_state || null,
        special_needs: student.special_needs || null,
        medication_use: student.medication_use || null,
        
        // Dados do Responsável
        guardian_full_name: primaryGuardian?.full_name || '',
        // Inicializa como string vazia se for nulo/undefined, para forçar o Select a exibir o placeholder
        guardian_relationship: primaryGuardian?.relationship as GuardianFormData['guardian_relationship'] || '', 
        guardian_phone: primaryGuardian?.phone || null,
        guardian_email: primaryGuardian?.email || null,
        guardian_cpf: primaryGuardian?.cpf || null,
      });
    }
  }, [student, form, open]);

  const mutation = useMutation({
    mutationFn: async (data: StudentFormData) => {
      if (!studentId || !tenantId) throw new Error("ID do aluno ou da escola ausente.");

      // Validação adicional: Se a turma tem cursos, o curso deve ser selecionado
      if (data.class_id && filteredCourses.length > 0 && !data.course_id) {
          throw new Error("Selecione a Série/Ano para a turma escolhida.");
      }
      
      // Se a turma for desvinculada (class_id: null), o course_id também deve ser null
      if (!data.class_id) {
          data.course_id = null;
      }

      // Separar dados do aluno e do responsável
      const { 
          guardian_full_name, guardian_relationship, guardian_phone, guardian_email, guardian_cpf,
          ...studentData 
      } = data;

      const guardianPayload: GuardianFormData = {
          guardian_full_name,
          guardian_relationship,
          guardian_phone: guardian_phone || null,
          guardian_email: guardian_email || null,
          guardian_cpf: guardian_cpf || null,
      };

      const studentPayload = {
          ...studentData,
          class_id: studentData.class_id || null, 
          course_id: studentData.course_id || null,
          gender: studentData.gender || null,
          email: studentData.email || null,
          phone: studentData.phone || null,
          cpf: studentData.cpf || null,
          rg: studentData.rg || null,
          nationality: studentData.nationality || null,
          naturality: studentData.naturality || null,
          zip_code: studentData.zip_code || null,
          address_street: studentData.address_street || null,
          address_number: studentData.address_number || null,
          address_neighborhood: studentData.address_neighborhood || null,
          address_city: studentData.address_city || null,
          address_state: studentData.address_state || null,
          special_needs: studentData.special_needs || null,
          medication_use: studentData.medication_use || null,
      };

      const payload = {
          student_id: studentId,
          tenant_id: tenantId,
          student: studentPayload,
          guardian: guardianPayload,
      };

      const { error } = await supabase.functions.invoke('update-student-and-guardian', {
        body: JSON.stringify(payload),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Aluno atualizado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['students', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['student', studentId] }); 
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erro ao Atualizar", { description: error.message });
    },
  });

  const onSubmit = (data: StudentFormData) => {
    mutation.mutate(data);
  };

  const isLoading = isLoadingStudent || isLoadingClasses || isLoadingCourses;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Aluno</SheetTitle>
          <SheetDescription>
            Atualize as informações completas do aluno e do responsável.
          </SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
              
              {/* Seção 1: Dados Pessoais e Matrícula */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dados Pessoais e Matrícula</h3>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input id="full_name" {...form.register("full_name")} />
                  {form.formState.errors.full_name && <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input id="birth_date" type="date" {...form.register("birth_date")} />
                    {form.formState.errors.birth_date && <p className="text-sm text-destructive">{form.formState.errors.birth_date.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gênero</Label>
                    <Select onValueChange={(value) => form.setValue('gender', value === "none" ? null : value as any)} value={form.watch('gender') || 'none'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não Informar</SelectItem>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Feminino">Feminino</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nacionalidade</Label>
                    <Input id="nationality" placeholder="Ex: Brasileira" {...form.register("nationality")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="naturality">Naturalidade (Cidade)</Label>
                    <Input id="naturality" placeholder="Ex: Salvador" {...form.register("naturality")} />
                  </div>
                </div>

                {/* CAMPO 1: Turma (Selecionada primeiro) */}
                <div className="space-y-2">
                  <Label htmlFor="class_id">Turma</Label>
                  <Select 
                    onValueChange={(value) => {
                      // Se o valor for 'none', define como null
                      form.setValue('class_id', value === 'none' ? null : value);
                    }} 
                    value={form.watch('class_id') || 'none'} 
                    disabled={isLoadingClasses}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingClasses ? "Carregando Turmas..." : "Selecione a turma"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma Turma (Desvincular)</SelectItem>
                      {allClasses?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.school_year})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.class_id && <p className="text-sm text-destructive">{form.formState.errors.class_id.message}</p>}
                </div>

                {/* CAMPO 2: Série/Ano (Course) (Filtrado pela Turma) */}
                <div className="space-y-2">
                  <Label htmlFor="course_id">Série / Ano</Label>
                  <Select 
                    onValueChange={(value) => form.setValue('course_id', value === 'none' ? null : value)}
                    value={form.watch('course_id') || 'none'}
                    disabled={!selectedClassId || filteredCourses.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!selectedClassId ? "Selecione a Turma primeiro" : (filteredCourses.length === 0 ? "Nenhuma Série/Ano associada" : "Selecione a Série/Ano")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma Série/Ano (Desvincular)</SelectItem>
                      {filteredCourses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.course_id && <p className="text-sm text-destructive">{form.formState.errors.course_id.message}</p>}
                  {selectedClassId && filteredCourses.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Nenhuma Série/Ano compatível com a turma selecionada.
                    </p>
                  )}
                </div>
              </div>

              {/* Status */}
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

              <Separator />

              {/* Seção 2: Contato e Documentos do Aluno */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contato e Documentos do Aluno</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" type="tel" {...form.register("phone")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...form.register("email")} />
                    {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" {...form.register("cpf")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rg">RG</Label>
                    <Input id="rg" {...form.register("rg")} />
                  
                  </div>
                </div>
              </div>

              <Separator />

              {/* Seção 3: Responsável Legal */}
              <GuardianForm />

              {/* Seção 4: Endereço */}
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

              {/* Seção 5: Informações de Saúde e Necessidades */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações Adicionais</h3>
                <div className="space-y-2">
                  <Label htmlFor="special_needs">Necessidades Especiais (Opcional)</Label>
                  <Textarea id="special_needs" placeholder="Descreva quaisquer necessidades especiais ou adaptações necessárias." {...form.register("special_needs")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medication_use">Uso de Medicamentos (Opcional)</Label>
                  <Textarea id="medication_use" placeholder="Liste medicamentos de uso contínuo e instruções." {...form.register("medication_use")} />
                </div>
              </div>

              <SheetFooter className="pt-4">
                <Button 
                  type="submit" 
                  disabled={mutation.isPending || isLoading}
                >
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </SheetFooter>
            </form>
          </FormProvider>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default EditStudentSheet;