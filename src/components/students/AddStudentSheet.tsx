import React, { useState, useMemo } from 'react';
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

// --- Schema de Validação ---
const studentSchema = z.object({
  full_name: z.string().min(5, "Nome completo é obrigatório."),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida. Use o formato AAAA-MM-DD."),
  
  // Campos de relacionamento
  class_id: z.string().uuid("Selecione uma turma.").optional().nullable(),
  
  // Contato e Documentos do Aluno
  phone: z.string().optional().nullable(), // Pode ser nulo
  email: z.string().email("Email inválido.").optional().or(z.literal('')).nullable(), // Pode ser nulo ou string vazia
  cpf: z.string().optional().nullable(), // Pode ser nulo
  rg: z.string().optional().nullable(), // Pode ser nulo
  
  // Dados Pessoais do Aluno
  gender: z.enum(['Masculino', 'Feminino', 'Outro']).optional().nullable(),
  nationality: z.string().optional().nullable(),
  naturality: z.string().optional().nullable(), // Naturalidade (Cidade de nascimento)

  // Endereço
  zip_code: z.string().optional().nullable(),
  address_street: z.string().optional().nullable(),
  address_number: z.string().optional().nullable(),
  address_neighborhood: z.string().optional().nullable(),
  address_city: z.string().optional().nullable(),
  address_state: z.string().optional().nullable(),

  // Informações Adicionais do Aluno
  special_needs: z.string().optional().nullable(),
  medication_use: z.string().optional().nullable(),
}).merge(guardianSchema); // Mesclando com o schema do responsável

type StudentFormData = z.infer<typeof studentSchema>;

interface Class {
  id: string;
  name: string;
  school_year: number;
  // class_courses: { courses: { name: string } | null }[]; // Não precisamos disso aqui, apenas para exibição
}

// --- Funções de Busca de Dados ---
const fetchClasses = async (tenantId: string): Promise<Class[]> => {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, school_year')
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
      class_id: null,
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

  // Encontra o ano letivo da turma selecionada
  const selectedClass = useMemo(() => {
    if (!allClasses || !selectedClassId) return null;
    return allClasses.find(c => c.id === selectedClassId);
  }, [allClasses, selectedClassId]);


  const onSubmit = async (data: StudentFormData) => {
    if (!tenantId) {
      toast.error("Erro", { description: "ID da escola não encontrado." });
      return;
    }
    
    if (!selectedClass) {
        toast.error("Erro", { description: "Selecione uma turma válida para continuar." });
        return;
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
      // Usaremos uma nova Edge Function para lidar com a transação de criação de aluno e responsável
      const { error } = await supabase.functions.invoke('create-student-and-guardian', {
        body: JSON.stringify(payload),
      });

      if (error) throw new Error(error.message);

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

  const isLoading = isLoadingClasses;

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

              {/* CAMPO: Turma (agora sem filtro de curso) */}
              <div className="space-y-2">
                <Label htmlFor="class_id">Turma</Label>
                <Select 
                  onValueChange={(value) => form.setValue('class_id', value === "none" ? null : value)} 
                  value={form.watch('class_id') || 'none'}
                  disabled={isLoadingClasses}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingClasses ? "Carregando Turmas..." : "Selecione uma turma"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma Turma</SelectItem>
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
              <Button type="submit" disabled={form.formState.isSubmitting || isLoading || !selectedClassId}>
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