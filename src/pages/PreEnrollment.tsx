import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, CheckCircle, School, Link2Off } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

// --- Schema de Validação (sem tenant_id) ---
const preEnrollmentSchema = z.object({
  full_name: z.string().min(5, "Nome completo é obrigatório."),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida. Use o formato AAAA-MM-DD."),
  phone: z.string().min(8, "Telefone é obrigatório."),
  email: z.string().email("Email inválido.").optional().or(z.literal('')).nullable(),
});

type PreEnrollmentFormData = z.infer<typeof preEnrollmentSchema>;

// --- Função para buscar o nome da escola ---
const fetchSchoolName = async (tenantId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .single();

  if (error) {
    console.error("Error fetching school name:", error);
    return null;
  }
  return data.name;
};

const PreEnrollment: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  console.log("PreEnrollment Page - tenantId from useParams:", tenantId); // Log para depuração
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  const { data: schoolName, isLoading: isLoadingSchool, error: schoolError } = useQuery({
    queryKey: ['schoolName', tenantId],
    queryFn: () => fetchSchoolName(tenantId!),
    enabled: !!tenantId,
  });

  const form = useForm<PreEnrollmentFormData>({
    resolver: zodResolver(preEnrollmentSchema),
    defaultValues: {
      full_name: "",
      birth_date: "",
      phone: "",
      email: null,
    },
  });

  const onSubmit = async (data: PreEnrollmentFormData) => {
    setIsSubmitting(true);
    setSuccessCode(null);

    const submissionData = {
      ...data,
      tenant_id: tenantId,
      email: data.email || null,
    };

    try {
      const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('pre-enrollment', {
        body: JSON.stringify(submissionData),
      });

      if (edgeFunctionError) throw new Error(edgeFunctionError.message);
      
      const response = edgeFunctionData as { error?: string, success?: boolean, registration_code?: string };
      if (response.error) throw new Error(response.error);

      if (response.success && response.registration_code) {
        setSuccessCode(response.registration_code);
        toast.success("Pré-Matrícula Enviada!", {
          description: `Seu código de matrícula é: ${response.registration_code}`,
        });
        form.reset();
      } else {
        throw new Error("Resposta da função inválida.");
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      toast.error("Erro no Envio", { description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingSchool) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenantId || schoolError || !schoolName) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-destructive">
              <Link2Off className="h-6 w-6" /> Link Inválido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">O link de pré-matrícula que você usou é inválido ou a escola não foi encontrada.</p>
            <Button asChild variant="link" className="mt-4">
              <Link to="/">Voltar para a página inicial</Link>
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
          <div className="flex justify-center items-center gap-2 text-muted-foreground">
            <School className="h-5 w-5" />
            <span className="font-semibold">{schoolName}</span>
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Pré-Matrícula</CardTitle>
          <CardDescription>Preencha os dados do aluno para iniciar o processo.</CardDescription>
        </CardHeader>
        <CardContent>
          {successCode ? (
            <div className="text-center p-6 space-y-4 bg-green-50 dark:bg-green-900/20 rounded-lg border">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <h3 className="text-xl font-semibold">Sucesso!</h3>
              <p>Sua pré-matrícula foi registrada.</p>
              <p className="text-2xl font-bold text-primary">{successCode}</p>
              <p className="text-sm text-muted-foreground">Aguarde o contato da secretaria.</p>
              <Button onClick={() => setSuccessCode(null)} variant="outline" className="mt-4">
                Fazer Outra Pré-Matrícula
              </Button>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo do Aluno</Label>
                <Input id="full_name" {...form.register("full_name")} />
                {form.formState.errors.full_name && <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input id="birth_date" type="date" {...form.register("birth_date")} />
                {form.formState.errors.birth_date && <p className="text-sm text-destructive">{form.formState.errors.birth_date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone de Contato</Label>
                <Input id="phone" type="tel" {...form.register("phone")} />
                {form.formState.errors.phone && <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Opcional)</Label>
                <Input id="email" type="email" {...form.register("email")} />
                {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar Pré-Matrícula"}
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