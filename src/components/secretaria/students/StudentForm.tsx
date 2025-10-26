import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { fetchTenantId } from "@/lib/tenant";
import { showError, showSuccess } from "@/utils/toast";
import { Student, Class } from "@/types/academic";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateNextRegistrationCode } from "@/lib/registration";
import { academicLevels, classOptions, AcademicLevel, getLevelByClassName } from "@/lib/academic-options";

// Define o esquema Zod para o formulário do aluno
const studentSchema = z.object({
  // Matrícula
  registration_code: z.string().min(1, "O código de matrícula é obrigatório."),
  status: z.enum(["active", "inactive", "suspended"]),
  
  // Campos de Turma (Temporários para UI ou IDs)
  class_id: z.string().optional(),
  class_level: z.enum(academicLevels as [string, ...string[]]).optional(),
  class_name: z.string().optional(),

  // Dados Pessoais
  full_name: z.string().min(3, "O nome completo é obrigatório."),
  birth_date: z.date().optional(),
  gender: z.enum(["Masculino", "Feminino", "Outro"]).optional(),
  nationality: z.string().optional(),
  naturality: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal("")),

  // Endereço
  zip_code: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
});

interface StudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Student | null;
}

const StudentForm: React.FC<StudentFormProps> = ({ isOpen, onClose, initialData }) => {
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
  });

  const { watch, setValue } = form;
  const selectedLevel = watch("class_level");
  const selectedClassName = watch("class_name");

  // Fetch next registration code only if creating a new student
  const { data: nextCode, isLoading: isLoadingCode } = useQuery({
    queryKey: ["nextRegistrationCode"],
    queryFn: generateNextRegistrationCode,
    enabled: isOpen && !isEditMode,
    staleTime: 0,
  });

  // Fetch all classes (FIX: Select all fields to match Class interface)
  const { data: classes } = useQuery<Class[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*");
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  // Effect to set initial form values
  useEffect(() => {
    if (initialData) {
      // Find the class name and level if class_id exists
      const currentClass = classes?.find(c => c.id === initialData.class_id);
      const initialLevel = currentClass ? getLevelByClassName(currentClass.name) : undefined;

      form.reset({
        ...initialData,
        birth_date: initialData.birth_date ? parseISO(initialData.birth_date) : undefined,
        gender: initialData.gender || undefined,
        email: initialData.email || "",
        
        // Set class fields for editing
        class_id: initialData.class_id || "",
        class_level: initialLevel,
        class_name: currentClass?.name || "",
      });
    } else {
      form.reset({
        full_name: "",
        registration_code: nextCode || "",
        birth_date: undefined,
        status: "active",
        gender: undefined,
        nationality: "",
        naturality: "",
        cpf: "",
        rg: "",
        phone: "",
        email: "",
        zip_code: "",
        address_street: "",
        address_number: "",
        address_neighborhood: "",
        address_city: "",
        address_state: "",
        
        // Reset class fields
        class_id: "",
        class_level: undefined,
        class_name: "",
      });
    }
  }, [initialData, form, nextCode, classes]);

  // Effect to update class_id when class_name changes
  useEffect(() => {
    if (selectedClassName && classes) {
      const matchingClass = classes.find(c => c.name === selectedClassName);
      setValue("class_id", matchingClass?.id || "");
    } else {
      setValue("class_id", "");
    }
  }, [selectedClassName, classes, setValue]);

  // Effect to reset class name when level changes
  useEffect(() => {
    if (selectedLevel) {
      setValue("class_name", "");
    }
  }, [selectedLevel, setValue]);


  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof studentSchema>) => {
      const { tenantId, error: tenantError } = await fetchTenantId();
      if (tenantError) throw new Error(tenantError);

      // Destructure temporary UI fields
      const { class_level, class_name, ...rest } = values;

      const submissionData = {
        ...rest,
        tenant_id: tenantId,
        birth_date: values.birth_date ? format(values.birth_date, "yyyy-MM-dd") : null,
        
        // Ensure optional fields are null if empty string
        gender: values.gender || null,
        nationality: values.nationality || null,
        naturality: values.naturality || null,
        cpf: values.cpf || null,
        rg: values.rg || null,
        phone: values.phone || null,
        email: values.email || null,
        zip_code: values.zip_code || null,
        address_street: values.address_street || null,
        address_number: values.address_number || null,
        address_neighborhood: values.address_neighborhood || null,
        address_city: values.address_city || null,
        address_state: values.address_state || null,
        class_id: values.class_id || null,
      };

      if (isEditMode) {
        const { error } = await supabase
          .from("students")
          .update(submissionData)
          .eq("id", initialData!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("students").insert(submissionData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      showSuccess(isEditMode ? "Aluno atualizado!" : "Aluno cadastrado!");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["nextRegistrationCode"] }); // Invalidate to fetch the next code
      onClose();
    },
    onError: (error: any) => showError(error.message),
  });

  const onSubmit = (values: z.infer<typeof studentSchema>) => {
    mutation.mutate(values);
  };

  const filteredClassNames = classOptions.filter(
    (opt) => opt.level === selectedLevel
  );
  
  // Filter available classes based on the selected name (e.g., '1º Ano')
  const availableClasses = classes?.filter(c => {
    if (!selectedClassName) return false;
    return c.name === selectedClassName;
  }) || [];


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Aluno" : "Cadastrar Novo Aluno"}</DialogTitle>
          <DialogDescription>
            Preencha as informações cadastrais e de matrícula do aluno.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="personal">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="address">Endereço</TabsTrigger>
                <TabsTrigger value="enrollment">Matrícula</TabsTrigger>
              </TabsList>

              {/* TAB 1: Dados Pessoais */}
              <TabsContent value="personal" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Maria da Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="birth_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Nascimento</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                              >
                                {field.value ? format(field.value, "dd/MM/yyyy") : <span>Escolha uma data</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gênero</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Feminino">Feminino</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nacionalidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Brasileira" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="naturality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Naturalidade (Cidade)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: São Paulo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RG</FormLabel>
                        <FormControl>
                          <Input placeholder="00.000.000-0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="aluno@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* TAB 2: Endereço */}
              <TabsContent value="address" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="zip_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input placeholder="00000-000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address_street"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Rua/Avenida</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua Exemplo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="address_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input placeholder="123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address_neighborhood"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input placeholder="Centro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address_city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="São Paulo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address_state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado (UF)</FormLabel>
                        <FormControl>
                          <Input placeholder="SP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* TAB 3: Matrícula */}
              <TabsContent value="enrollment" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="registration_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código de Matrícula</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: 2024001" 
                            {...field} 
                            disabled={!isEditMode || isLoadingCode} // Disable if creating or loading
                            value={isEditMode ? field.value : (isLoadingCode ? "Gerando..." : nextCode || "")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                            <SelectItem value="suspended">Suspenso</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Seleção de Turma */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="class_level"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nível de Ensino</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Selecione o nível" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {academicLevels.map((level) => (
                                <SelectItem key={level} value={level}>
                                    {level}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="class_name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome da Turma</FormLabel>
                            <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!selectedLevel}
                            >
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder={selectedLevel ? "Selecione o nome da turma" : "Selecione o Nível primeiro"} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {filteredClassNames.map((option) => (
                                <SelectItem key={option.name} value={option.name}>
                                    {option.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="class_id"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Turma (Ano Letivo)</FormLabel>
                            <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!selectedClassName || availableClasses.length === 0}
                            >
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder={selectedClassName ? "Selecione a turma" : "Selecione o Nome da Turma"} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {availableClasses.map((classItem) => (
                                <SelectItem key={classItem.id} value={classItem.id}>
                                    {classItem.name} ({classItem.school_year})
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                
                <div className="p-4 border rounded-md text-sm text-muted-foreground">
                    <p>Informações de Responsáveis serão adicionadas em breve.</p>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending || isLoadingCode}>
                {mutation.isPending || isLoadingCode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default StudentForm;