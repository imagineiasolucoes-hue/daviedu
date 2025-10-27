import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const preEnrollmentSchema = z.object({
  full_name: z.string().min(3, "O nome completo é obrigatório."),
  birth_date: z.date({ required_error: "A data de nascimento é obrigatória." }),
  phone: z.string().min(8, "O telefone é obrigatório."),
  email: z.string().email("Email inválido.").optional().or(z.literal("")),
  gender: z.enum(["Masculino", "Feminino", "Outro"]).optional(),
  nationality: z.string().optional(),
  naturality: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  zip_code: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  guardian_name: z.string().optional(),
  special_needs: z.string().optional(),
  medication_use: z.string().optional(),
});

const PreEnrollment = () => {
  const [searchParams] = useSearchParams();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("tenant_id");
    setTenantId(id);
  }, [searchParams]);

  const form = useForm<z.infer<typeof preEnrollmentSchema>>({
    resolver: zodResolver(preEnrollmentSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      email: "",
      gender: undefined,
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

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof preEnrollmentSchema>) => {
      if (!tenantId) {
        throw new Error("Link de matrícula inválido ou incompleto.");
      }
      
      const submissionData = {
        tenant_id: tenantId,
        full_name: values.full_name,
        birth_date: format(values.birth_date, "yyyy-MM-dd"),
        phone: values.phone,
        email: values.email || null,
        gender: values.gender || null,
        nationality: values.nationality || null,
        naturality: values.naturality || null,
        cpf: values.cpf || null,
        rg: values.rg || null,
        zip_code: values.zip_code || null,
        address_street: values.address_street || null,
        address_number: values.address_number || null,
        address_neighborhood: values.address_neighborhood || null,
        address_city: values.address_city || null,
        address_state: values.address_state || null,
        guardian_name: values.guardian_name || null,
        special_needs: values.special_needs || null,
        medication_use: values.medication_use || null,
      };

      const { data, error } = await supabase.functions.invoke("pre-enrollment", {
        body: submissionData,
      });

      if (error) {
        try {
          const errorJson = JSON.parse(error.message);
          if (errorJson.error) {
            throw new Error(errorJson.error);
          }
        } catch (e) {
          throw new Error(error.message);
        }
      }
      
      return data as { registration_code: string };
    },
    onSuccess: (data) => {
      setGeneratedCode(data.registration_code);
      showSuccess("Pré-matrícula enviada com sucesso! Entraremos em contato em breve.");
      setIsSubmitted(true);
      form.reset();
    },
    onError: (error: any) => {
      showError(`Erro ao enviar pré-matrícula: ${error.message}`);
    },
  });

  const onSubmit = (values: z.infer<typeof preEnrollmentSchema>) => {
    mutation.mutate(values);
  };

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8 space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl">Link Inválido</CardTitle>
            <CardDescription>
              Este link de pré-matrícula está incompleto ou é inválido. Por favor, solicite um novo link à instituição de ensino.
            </CardDescription>
            <Button asChild>
              <Link to="/">Voltar à Página Inicial</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8 space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Sucesso!</CardTitle>
            <CardDescription>
              Sua solicitação de pré-matrícula foi registrada. A secretaria da escola entrará em contato em breve.
            </CardDescription>
            {generatedCode && (
                <p className="text-sm text-muted-foreground mt-2">
                    Seu código de referência é: <span className="font-bold text-primary">{generatedCode}</span>.
                </p>
            )}
            <Button onClick={() => { setIsSubmitted(false); setGeneratedCode(null); }} variant="outline">
              Fazer Outra Pré-Matrícula
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Formulário de Pré-Matrícula</CardTitle>
          <CardDescription>
            Preencha os dados básicos para iniciar o processo de matrícula.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Tabs defaultValue="personal">
                <TabsList className="grid w-full grid-cols-3 md:w-[600px] mx-auto">
                  <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
                  <TabsTrigger value="address">Endereço</TabsTrigger>
                  <TabsTrigger value="guardian_health">Responsável & Saúde</TabsTrigger>
                </TabsList>

                {/* TAB 1: Dados Pessoais */}
                <TabsContent value="personal" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo do Aluno</FormLabel>
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
                          <FormLabel>Nacionalidade (Opcional)</FormLabel>
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
                          <FormLabel>Naturalidade (Opcional)</FormLabel>
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
                          <FormLabel>CPF (Opcional)</FormLabel>
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
                          <FormLabel>RG (Opcional)</FormLabel>
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
                          <FormLabel>Telefone de Contato (Obrigatório)</FormLabel>
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
                          <FormLabel>Email (Opcional)</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="responsavel@exemplo.com" {...field} />
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
                          <FormLabel>CEP (Opcional)</FormLabel>
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
                          <FormLabel>Rua/Avenida (Opcional)</FormLabel>
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
                          <FormLabel>Número (Opcional)</FormLabel>
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
                          <FormLabel>Bairro (Opcional)</FormLabel>
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
                          <FormLabel>Cidade (Opcional)</FormLabel>
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
                          <FormLabel>Estado (UF) (Opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="SP" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                {/* TAB 3: Responsável & Saúde */}
                <TabsContent value="guardian_health" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="guardian_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Pai/Mãe ou Responsável Principal (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Ana Paula Silva" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="special_needs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Necessidades Especiais / Condições Médicas (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva se o aluno possui alguma necessidade especial, alergia ou condição médica relevante." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="medication_use"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Uso Contínuo de Medicamentos (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Liste os medicamentos de uso contínuo e a dosagem, se aplicável." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
              
              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar Solicitação de Pré-Matrícula
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreEnrollment;