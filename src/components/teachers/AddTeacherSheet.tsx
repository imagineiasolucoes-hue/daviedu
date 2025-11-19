import React, { useState, useMemo, useEffect } from 'react';
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
import { Loader2, PlusCircle, X, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/SessionContextProvider'; // Importar useAuth

// --- Tipos e Schemas ---
const classAssignmentSchema = z.object({
  class_id: z.string().uuid(),
  period: z.enum(['Manhã', 'Tarde', 'Noite', 'Integral']),
});

const teacherSchema = z.object({
  full_name: z.string().min(5, "Nome completo é obrigatório."),
  main_subject: z.string().optional().nullable(), // Pode ser nulo, mas agora virá de um select
  base_salary: z.coerce.number().min(0.01, "Salário deve ser um valor positivo."),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de contratação inválida. Use o formato AAAA-MM-DD."),
  
  // Novos campos de contato e endereço
  email: z.string().email("Email inválido.").optional().or(z.literal('')).nullable(),
  phone: z.string().optional().nullable(),
  zip_code: z.string().optional().nullable(),
  address_street: z.string().optional().nullable(),
  address_number: z.string().optional().nullable(),
  address_neighborhood: z.string().optional().nullable(),
  address_city: z.string().optional().nullable(),
  address_state: z.string().optional().nullable(),
  
  // Campo para vincular o usuário de login
  user_id: z.string().uuid("Selecione um usuário para login.").optional().nullable(),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

interface Course {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  school_year: number;
  period: string; // Período padrão da turma
  // CORREÇÃO: Adicionando a estrutura de relação N:M
  class_courses: {
    course_id: string;
    courses: { name: string } | null;
  }[];
}

interface Subject { // Interface para matérias
  id: string;
  name: string;
}

interface AvailableUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface ClassAssignment extends z.infer<typeof classAssignmentSchema> {
  className: string;
}

// --- Funções de Dados ---
const fetchClasses = async (tenantId: string): Promise<Class[]> => {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, school_year, period, class_courses(courses(name))') // Incluindo courses(name)
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw new Error(error.message);
  return data as unknown as Class[];
};

const fetchSubjects = async (tenantId: string): Promise<Subject[]> => { // Nova função para buscar matérias
  const { data, error } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw new Error(error.message);
  return data;
};

// Nova função para buscar usuários que não são funcionários/professores
const fetchAvailableUsers = async (tenantId: string): Promise<AvailableUser[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .eq('tenant_id', tenantId)
    .is('employee_id', null) // Usuários que não estão vinculados a um funcionário
    .neq('role', 'student') // Excluir alunos (opcional, mas geralmente professores não são alunos)
    .order('email');
  
  if (error) throw new Error(error.message);
  return data as AvailableUser[];
};

const AddTeacherSheet: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;
  const [classesToTeach, setClassesToTeach] = useState<ClassAssignment[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');

  const { data: allClasses, isLoading: isLoadingClasses } = useQuery<Class[], Error>({
    queryKey: ['classes', tenantId],
    queryFn: () => fetchClasses(tenantId!),
    enabled: !!tenantId && isOpen,
  });

  const { data: subjects, isLoading: isLoadingSubjects } = useQuery<Subject[], Error>({ // Nova query para matérias
    queryKey: ['subjects', tenantId],
    queryFn: () => fetchSubjects(tenantId!),
    enabled: !!tenantId && isOpen,
  });
  
  const { data: availableUsers, isLoading: isLoadingAvailableUsers } = useQuery<AvailableUser[], Error>({
    queryKey: ['availableUsers', tenantId],
    queryFn: () => fetchAvailableUsers(tenantId!),
    enabled: !!tenantId && isOpen,
  });

  const availableClasses = useMemo(() => {
    if (!allClasses) return [];
    const assignedIds = classesToTeach.map(c => c.class_id);
    return allClasses.filter(c => !assignedIds.includes(c.id));
  }, [allClasses, classesToTeach]);

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      full_name: "",
      main_subject: null,
      hire_date: "",
      email: null,
      phone: null,
      zip_code: null,
      address_street: null,
      address_number: null,
      address_neighborhood: null,
      address_city: null,
      address_state: null,
      user_id: null, // Novo campo
    },
  });

  const handleAddClass = () => {
    if (selectedClassId && selectedPeriod) {
      const classDetails = allClasses?.find(c => c.id === selectedClassId);
      if (classDetails) {
        // Acessando o nome do curso através da relação class_courses
        const courseName = classDetails.class_courses?.[0]?.courses?.name ? ` - ${classDetails.class_courses[0].courses.name}` : '';
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

  const onSubmit = async (data: TeacherFormData) => {
    if (!tenantId) {
      toast.error("Erro", { description: "ID da escola não encontrado." });
      return;
    }

    const classesPayload = classesToTeach.map(c => ({
        class_id: c.class_id,
        period: c.period,
    }));

    try {
      const payload = { 
        ...data, 
        tenant_id: tenantId,
        user_id: data.user_id || null, // Enviando o user_id selecionado
        classes_to_teach: classesPayload,
        email: data.email || null,
        phone: data.phone || null,
        zip_code: data.zip_code || null,
        address_street: data.address_street || null,
        address_number: data.address_number || null,
        address_neighborhood: data.address_neighborhood || null,
        address_city: data.address_city || null,
        address_state: data.address_state || null,
        main_subject: data.main_subject || null,
      };

      const { error } = await supabase.functions.invoke('create-teacher', {
        body: JSON.stringify(payload),
      });

      if (error) throw new Error(error.message);

      toast.success("Professor cadastrado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['teachers', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['availableUsers', tenantId] }); // Invalida a lista de usuários disponíveis
      form.reset();
      setClassesToTeach([]);
      setIsOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      toast.error("Erro ao Cadastrar", { description: errorMessage });
    }
  };

  const isLoading = isLoadingClasses || isLoadingSubjects || isLoadingAvailableUsers;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Professor
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Cadastrar Novo Professor</SheetTitle>
          <SheetDescription>
            Preencha as informações para adicionar um novo professor.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          
          {/* Informações Profissionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Profissionais</h3>
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input id="full_name" {...form.register("full_name")} />
              {form.formState.errors.full_name && <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="main_subject">Matéria Principal (Opcional)</Label>
              <Select 
                onValueChange={(value) => form.setValue('main_subject', value === "none" ? null : value)} 
                value={form.watch('main_subject') || 'none'}
                disabled={isLoadingSubjects || (subjects && subjects.length === 0)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingSubjects ? "Carregando matérias..." : "Selecione a matéria principal"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {subjects?.map((subject) => (
                    <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!subjects || subjects.length === 0) && !isLoadingSubjects && (
                <p className="text-xs text-muted-foreground mt-1">
                    Nenhuma matéria cadastrada. Cadastre uma matéria em "Gestão de Turmas" &gt; "Matérias".
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hire_date">Data de Contratação</Label>
                <Input id="hire_date" type="date" {...form.register("hire_date")} />
                {form.formState.errors.hire_date && <p className="text-sm text-destructive">{form.formState.errors.hire_date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="base_salary">Salário Base</Label>
                <Input id="base_salary" type="number" step="0.01" {...form.register("base_salary")} />
                {form.formState.errors.base_salary && <p className="text-sm text-destructive">{form.formState.errors.base_salary.message}</p>}
              </div>
            </div>
          </div>

          <Separator />
          
          {/* Vínculo de Usuário para Login */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Vincular Conta de Login (Opcional)
            </h3>
            <div className="space-y-2">
              <Label htmlFor="user_id">Usuário de Login</Label>
              <Select 
                onValueChange={(value) => form.setValue('user_id', value === "none" ? null : value)} 
                value={form.watch('user_id') || 'none'}
                disabled={isLoadingAvailableUsers}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingAvailableUsers ? "Carregando usuários..." : "Selecione um usuário para login"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum Usuário (Acesso apenas administrativo)</SelectItem>
                  {availableUsers?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.email} ({u.first_name} {u.last_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.user_id && <p className="text-sm text-destructive">{form.formState.errors.user_id.message}</p>}
              {(!availableUsers || availableUsers.length === 0) && !isLoadingAvailableUsers && (
                <p className="text-xs text-muted-foreground mt-1">
                    Nenhum usuário disponível para vincular. Peça ao professor para se cadastrar primeiro.
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contato</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email (Opcional)</Label>
                <Input id="email" type="email" {...form.register("email")} />
                {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone (Opcional)</Label>
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
                <Label htmlFor="zip_code">CEP (Opcional)</Label>
                <Input id="zip_code" {...form.register("zip_code")} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address_street">Rua (Opcional)</Label>
                <Input id="address_street" {...form.register("address_street")} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1">
                <Label htmlFor="address_number">Número (Opcional)</Label>
                <Input id="address_number" {...form.register("address_number")} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address_neighborhood">Bairro (Opcional)</Label>
                <Input id="address_neighborhood" {...form.register("address_neighborhood")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_city">Cidade (Opcional)</Label>
                <Input id="address_city" {...form.register("address_city")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_state">Estado (Opcional)</Label>
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
                        {c.name} ({c.school_year}) {c.class_courses?.[0]?.courses?.name ? ` - ${c.class_courses[0].courses.name}` : ''}
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
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Professor
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddTeacherSheet;