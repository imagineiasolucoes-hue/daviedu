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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2, PlusCircle } from 'lucide-react';

// --- Schema de Validação ---
const studentSchema = z.object({
  full_name: z.string().min(5, "Nome completo é obrigatório."),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida."),
  
  // Campos de relacionamento (class_id e course_id não são persistidos diretamente, mas usados para lógica)
  course_id: z.string().uuid("Selecione um curso/série.").optional().nullable(),
  class_id: z.string().uuid("Selecione uma turma.").optional().nullable(),
  
  // Contato e Documentos
  phone: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  
  // Dados Pessoais
  gender: z.enum(['Masculino', 'Feminino', 'Outro']).optional().nullable(),
  nationality: z.string().optional(),
  naturality: z.string().optional(), // Naturalidade (Cidade de nascimento)

  // Endereço
  zip_code: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),

  // Informações Adicionais
  guardian_name: z.string().optional(),
  special_needs: z.string().optional(),
  medication_use: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface Course {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  course_id: string | null;
  school_year: number; // Adicionando school_year
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

const fetchClasses = async (tenantId: string): Promise<Class[]> => {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, course_id, school_year') // Buscando school_year
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw new Error(error.message);
  return data as Class[];
};

const AddStudentSheet: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const { data: courses, isLoading: isLoadingCourses } = useQuery<Course[], Error>({
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
      phone: "",
      email: "",
      course_id: null,
      class_id: null,
      gender: null,
      nationality: "",
      naturality: "",
      cpf: "",
      rg: "",
      zip_code: "",
      address_street: "",
      address_number: "",
      address_neighborhood: "",
      address_city: "",
      address_state: "",
      guardian_name: "",
      special_needs: "",
      medication_use: "",
    },
  });

  const selectedCourseId = form.watch('course_id');
  const selectedClassId = form.watch('class_id');

  // Filtra as turmas com base no curso selecionado
  const filteredClasses = useMemo(() => {
    if (!allClasses) return [];
    if (!selectedCourseId) return allClasses;
    
    return allClasses.filter(c => c.course_id === selectedCourseId);
  }, [allClasses, selectedCourseId]);

  // Encontra o ano letivo da turma selecionada
  const selectedClass = useMemo(() => {
    if (!allClasses || !selectedClassId) return null;
    return allClasses.find(c => c.id === selectedClassId);
  }, [allClasses, selectedClassId]);

  // Resetar class_id se o curso mudar
  React.useEffect(() => {
    if (selectedCourseId) {
      form.setValue('class_id', null);
    }
  }, [selectedCourseId, form]);


  const onSubmit = async (data: StudentFormData) => {
    if (!tenantId) {
      toast.error("Erro", { description: "ID da escola não encontrado." });
      return;
    }
    
    if (!selectedClass) {
        toast.error("Erro", { description: "Selecione uma turma válida para continuar." });
        return;
    }

    try {
      // A Edge Function 'create-student' gera o registration_code
      const { error } = await supabase.functions.invoke('create-student', {
        body: JSON.stringify({ 
          ...data, 
          tenant_id: tenantId,
          // ENVIANDO O ANO LETIVO DA TURMA SELECIONADA
          school_year: selectedClass.school_year, 
          
          // Garantir que campos opcionais vazios sejam null ou omitidos
          class_id: data.class_id || null,
          gender: data.gender || null,
          email: data.email || null,
        }),
      });

      if (error) throw new Error(error.message);

      toast.success("Aluno cadastrado com sucesso.");
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

  const isLoading = isLoadingCourses || isLoadingClasses;

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
                <Select onValueChange={(value) => form.setValue('gender', value as any)} value={form.watch('gender') || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
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

            {/* CAMPO: Curso/Série */}
            <div className="space-y-2">
              <Label htmlFor="course_id">Curso / Série</Label>
              <Select 
                onValueChange={(value) => form.setValue('course_id', value)} 
                value={form.watch('course_id') || ''}
                disabled={isLoadingCourses}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingCourses ? "Carregando Cursos..." : "Selecione o curso/série"} />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.course_id && <p className="text-sm text-destructive">{form.formState.errors.course_id.message}</p>}
            </div>

            {/* CAMPO: Turma (filtrado) */}
            <div className="space-y-2">
              <Label htmlFor="class_id">Turma</Label>
              <Select 
                onValueChange={(value) => form.setValue('class_id', value)} 
                value={form.watch('class_id') || ''}
                disabled={isLoadingClasses || !selectedCourseId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!selectedCourseId ? "Selecione um curso primeiro" : (isLoadingClasses ? "Carregando Turmas..." : "Selecione uma turma")} />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.school_year})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.class_id && <p className="text-sm text-destructive">{form.formState.errors.class_id.message}</p>}
              {selectedCourseId && filteredClasses.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                    Nenhuma turma encontrada para o curso selecionado.
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Seção 2: Contato e Documentos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contato e Documentos</h3>
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
            <div className="space-y-2">
              <Label htmlFor="guardian_name">Nome do Responsável (Opcional)</Label>
              <Input id="guardian_name" {...form.register("guardian_name")} />
            </div>
          </div>

          <Separator />

          {/* Seção 3: Endereço */}
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

          {/* Seção 4: Informações de Saúde e Necessidades */}
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
            <Button type="submit" disabled={form.formState.isSubmitting || isLoading || !selectedClassId}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Aluno
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddStudentSheet;