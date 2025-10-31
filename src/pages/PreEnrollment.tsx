import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// --- Schema de Validação ---
const preEnrollmentSchema = z.object({
  tenant_id: z.string().uuid("ID da Escola inválido. Deve ser um UUID válido."),
  full_name: z.string().min(5, "Nome completo é obrigatório."),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida. Use o formato AAAA-MM-DD."),
  phone: z.string().min(8, "Telefone é obrigatório."),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
});

type PreEnrollmentFormData = z.infer<typeof preEnrollmentSchema>;

const PreEnrollment: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  const form = useForm<PreEnrollmentFormData>({
    resolver: zodResolver(preEnrollmentSchema),
    defaultValues: {
      tenant_id: "", // Em um cenário real, isso viria da URL (ex: /pre-matricula?tenant=UUID)
      full_name: "",
      birth_date: "",
      phone: "",
      email: "",
    },
  });

  const onSubmit = async (data: PreEnrollmentFormData) => {
    setIsSubmitting(true);
    setSuccessCode(null);

    // Formatar a data para o formato esperado pelo banco de dados (YYYY-MM-DD)
    const submissionData = {
      ...data,
      birth_date: data.birth_date, // Já esperamos AAAA-MM-DD do input type="date"
      email: data.email || null, // Envia null se vazio
    };

    try {
      // 1. Chamar a Edge Function para processar a pré-matrícula
      const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('pre-enrollment', {
        body: JSON.stringify(submissionData),
      });

      if (edgeFunctionError) {
        throw new Error(edgeFunctionError.message);
      }
      
      const response = edgeFunctionData as { error?: string, success?: boolean, registration_code?: string };

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.success && response.registration_code) {
        setSuccessCode(response.registration_code);
        toast({
          title: "Pré-Matrícula Enviada!",
          description: `Seu código de matrícula é: ${response.registration_code}`,
          variant: "default",
        });
        form.reset(); // Limpa o formulário após o sucesso
      } else {
        throw new Error("Resposta da função inválida.");
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado ao enviar a pré-matrícula.";
      toast({
        title: "Erro no Envio",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Pré-Matrícula</CardTitle>
          <CardDescription>Preencha os dados do aluno para iniciar o processo de matrícula.</CardDescription>
        </CardHeader>
        <CardContent>
          {successCode ? (
            <div className="text-center p-6 space-y-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <h3 className="text-xl font-semibold text-green-700 dark:text-green-300">Sucesso!</h3>
              <p className="text-lg text-foreground">
                Sua pré-matrícula foi registrada.
              </p>
              <p className="text-2xl font-bold text-primary">
                Código de Matrícula: {successCode}
              </p>
              <p className="text-sm text-muted-foreground">
                Aguarde o contato da secretaria da escola para finalizar a matrícula.
              </p>
              <Button onClick={() => setSuccessCode(null)} variant="outline" className="mt-4">
                Fazer Outra Pré-Matrícula
              </Button>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* ID da Escola (Temporário, para testes) */}
              <div className="space-y-2">
                <Label htmlFor="tenant_id">ID da Escola (Tenant ID)</Label>
                <Input
                  id="tenant_id"
                  placeholder="Insira o UUID da escola"
                  {...form.register("tenant_id")}
                />
                {form.formState.errors.tenant_id && (
                  <p className="text-sm text-destructive">{form.formState.errors.tenant_id.message}</p>
                )}
              </div>

              {/* Nome Completo */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo do Aluno</Label>
                <Input
                  id="full_name"
                  placeholder="Ex: Maria da Silva"
                  {...form.register("full_name")}
                />
                {form.formState.errors.full_name && (
                  <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>
                )}
              </div>

              {/* Data de Nascimento */}
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  {...form.register("birth_date")}
                />
                {form.formState.errors.birth_date && (
                  <p className="text-sm text-destructive">{form.formState.errors.birth_date.message}</p>
                )}
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone de Contato</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(XX) XXXXX-XXXX"
                  {...form.register("phone")}
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                )}
              </div>

              {/* Email (Opcional) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email (Opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@contato.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Enviar Pré-Matrícula"
                )}
              </Button>
            </form>
          )}
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/" className="text-primary hover:underline">
              Voltar para a página inicial
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreEnrollment;