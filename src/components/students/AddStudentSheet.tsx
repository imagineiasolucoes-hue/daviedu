import React, { useState, useMemo, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2, PlusCircle } from 'lucide-react';
import GuardianForm, { guardianSchema, GuardianFormData } from './GuardianForm'; // Importando o novo componente e schema

// --- Tipos de Dados Auxiliares ---
interface Course {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  school_year: number;
  // Incluindo a relação N:M para saber quais cursos estão nesta turma
  class_courses: {
    course_id: string;
    courses: { id: string; name: string } | null; // Adicionando o nome do curso para facilitar a filtragem
  }[];
}

// Função auxiliar para pré-processar strings vazias para null
const preprocessString = z.preprocess(
  (value) => (value === '' ? null : value),
  z.string().optional().nullable()
);

// --- Schema de Validação ---
const studentSchema = z.object({
  full_name: z.string().min(5, "Nome completo é obrigatório."),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida. Use o formato AAAA-MM-DD."),
  
  // Turma: Selecionada primeiro
  class_id: z.string().uuid("Selecione uma turma."),
  
  // Série/Ano (Course): Selecionada em segundo, filtrada pela turma
  course_id: z.string().uuid("Selecione a Série/Ano."),
  
  // Contato e Documentos do Aluno
  phone: preprocessString, 
  email: z.preprocess(
    (value) => (value === '' ? null : value),
    z.string().email("Email inválido.").optional().nullable()
  ), 
  cpf: preprocessString, 
  rg: preprocessString, 
  
  // Dados Pessoais do Aluno
  gender: z.enum(['Masculino', 'Feminino', 'Outro']).optional().nullable(),
  nationality: preprocessString,
  naturality: preprocessString, 

  // Endereço
  zip_code: preprocessString,
  address_street: preprocessString,
  address_number: preprocessString,
  address_neighborhood: preprocessString,
  address_city: preprocessString,
  address_state: preprocessString,

  // Informações Adicionais do Aluno
  special_needs: preprocessString,
  medication_use: preprocessString,
}).merge(guardianSchema); 

type StudentFormData = z.infer<typeof studentSchema>;


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

const fetchClasses = async (tenantId: string): Promise<Class[]> => {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      id, 
      name, 
      school_year,
      class_courses (
        course_id,
        courses (id, name)
      )
    `)
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw new Error(error.message);
  return data as unknown as Class[];
};

const AddStudentSheet: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  // Não precisamos mais de allCourses, pois a lista de cursos é filtrada pela turma
  // Mas mantemos a query para fins de cache e consistência, embora não seja usada diretamente
  const { data: allCourses, isLoading: isLoadingCourses } = useQuery<Course[], Error>({
    queryKey: ['courses', tenantId],
    queryFn: () => fetchCourses(tenantId!),
    enabled: !!tenantId && isOpen,
  });

  const { data: allClasses, isLoading: isLoadingClasses } = useQuery<Class[], Error>({
    queryKey: ['classes', tenantId],
    queryFn: () => fetchClasses(tenantId!),
    enabled: !!tenantId && isOpen,
  });

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      full_name: "",
      birth_date: "",
      phone: null,
      email: null,
      class_id: undefined, 
      course_id: null, // Alterado para null para consistência com o DB
      gender: null,
      nationality: null,
      naturality: null,
      cpf: null,
      rg: null,
      zip_code: null,
      address_street: null,
      address_number: null,
      address_neighborhood: null,
      address_city: null,
      address_state: null,
      guardian_full_name: "",
      guardian_relationship: undefined,
      guardian_phone: null,
      guardian_email: null,
      guardian_cpf: null,
      special_needs: null,
      medication_use: null,
    },
  });

  const selectedClassId = form.watch('class_id');
  const selectedCourseId = form.watch('course_id');

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

  // Efeito para resetar o course_id se a turma mudar
  useEffect(() => {
    if (selectedClassId) {
      // Se a turma mudar, resetamos o curso para null
      form.setValue('course_id', null, { shouldValidate: true });
    }
  }, [selectedClassId, form]);


  const onSubmit = async (data: StudentFormData) => {
    if (!tenantId) {
      toast.error("Erro", { description: "ID da escola não encontrado." });
      return;
    }
    
    if (!selectedClass) {
        toast.error("Erro", { description: "Selecione uma turma válida para continuar." });
        return;
    }
    
    // Validação adicional: Se a turma tem cursos, o curso deve ser selecionado
    if (filteredCourses.length > 0 && !data.course_id) {
        form.setError('course_id', { type: 'manual', message: 'Selecione a Série/Ano.' });
        toast.error("Erro de Validação", { description: "Selecione a Série/Ano para a turma escolhida." });
        return;
    }

    // Separar dados do aluno e do responsável
    const { 
        guardian_full_name, guardian_relationship, guardian_phone, guardian_email, guardian_cpf,
        course_id, // Capturando course_id separadamente
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
        class_id: studentData.class_id, 
        course_id: course_id, // Incluindo o course_id no payload do aluno
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
        tenant_id: tenantId,
        school_year: selectedClass.school_year,
        student: studentPayload,
        guardian: guardianPayload,
    };

    try {
      const { error, data: edgeFunctionData } = await supabase.functions.invoke('create-student-and-guardian', {
        body: JSON.stringify(payload),
      });

      if (error) {
        // Tenta extrair a mensagem de erro do corpo da resposta da Edge Function
        const detailedError = error.context?.data?.error || error.message;
        throw new Error(detailedError);
      }
      
      // Se a Edge Function retornar um objeto de erro no corpo (como fazemos), trate-o
      if (edgeFunctionData && edgeFunctionData.error) {
        throw new Error(edgeFunctionData.error);
      }

      toast.success("Aluno e Responsável cadastrados com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['students', tenantId] });
      form.reset();
      setIsOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      toast.error("Erro ao Cadastrar", {
        description: errorMessage,
      });
    }
  };

  const isLoading = isLoadingClasses || isLoadingCourses;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Aluno
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Cadastrar Novo Aluno</SheetTitle>
          <SheetDescription>
            Preencha o formulário de matrícula completo.
          </SheetDescription>
        </SheetHeader>
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
                    form.setValue('class_id', value);
                  }} 
                  value={form.watch('class_id') || ''} 
                  disabled={isLoadingClasses}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingClasses ? "Carregando Turmas..." : "Selecione a turma"} />
                  </SelectTrigger>
                  <SelectContent>
                    {allClasses?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.school_year})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.class_id && <p className="text-sm text-destructive">{form.formState.errors.class_id.message}</p>}
                {(!allClasses || allClasses.length === 0) && !isLoadingClasses && (
                  <p className="text-xs text-muted-foreground mt-1">
                      Nenhuma turma encontrada.
                  </p>
                )}
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
                disabled={
                  form.formState.isSubmitting || 
                  isLoading || 
                  !form.watch('class_id') ||
                  (filteredCourses.length > 0 && !form.watch('course_id'))
                }
              >
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Aluno
              </Button>
            </SheetFooter>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
};

export default AddStudentSheet;