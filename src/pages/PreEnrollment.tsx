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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState } from "react";

// NOTE: Since this is a public form, we cannot use fetchTenantId (requires auth).
// For demonstration, we use a placeholder tenant ID. In a real multi-tenant app,
// this ID should be passed securely via URL parameter or derived from a public identifier.
const DEMO_TENANT_ID = "00000000-0000-0000-0000-000000000000"; // Placeholder ID

// Esquema simplificado para pré-matrícula
const preEnrollmentSchema = z.object({
  full_name: z.string().min(3, "O nome completo é obrigatório."),
  birth_date: z.date({ required_error: "A data de nascimento é obrigatória." }),
  phone: z.string().min(8, "O telefone é obrigatório."),
  email: z.string().email("Email inválido.").optional().or(z.literal("")),
});

const PreEnrollment = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof preEnrollmentSchema>>({
    resolver: zodResolver(preEnrollmentSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof preEnrollmentSchema>) => {
      // NOTE: We are using a placeholder tenant ID and a placeholder registration code.
      // The actual registration code generation should ideally happen server-side (Edge Function)
      // to ensure uniqueness and sequence integrity across concurrent public submissions.
      
      const submissionData = {
        tenant_id: DEMO_TENANT_ID, // Using placeholder ID
        full_name: values.full_name,
        birth_date: format(values.birth_date, "yyyy-MM-dd"),
        phone: values.phone,
        email: values.email || null,
        status: "pre-enrolled",
        registration_code: `PRE-${Date.now()}`, // Placeholder code
      };

      const { error } = await supabase.from("students").insert(submissionData);
      if (error) throw error;
    },
    onSuccess: () => {
      setIsSubmitted(true);
      showSuccess("Pré-matrícula enviada com sucesso! Entraremos em contato.");
    },
    onError: (error: any) => {
      showError(`Erro ao enviar pré-matrícula: ${error.message}`);
    },
  });

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8 space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <CardTitle className="text-2xl">Sucesso!</CardTitle>
            <CardDescription>
              Sua solicitação de pré-matrícula foi registrada. A secretaria da escola entrará em contato em breve.
            </CardDescription>
            <Button onClick={() => setIsSubmitted(false)} variant="outline">
              Fazer Outra Pré-Matrícula
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Formulário de Pré-Matrícula</CardTitle>
          <CardDescription>
            Preencha os dados básicos para iniciar o processo de matrícula.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(mutation.mutate)} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo do Aluno</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone de Contato</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contato@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Solicitação de Pré-Matrícula
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreEnrollment;