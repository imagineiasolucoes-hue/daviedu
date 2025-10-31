import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// --- Schema de Validação ---
const registerSchema = z.object({
  schoolName: z.string().min(3, "O nome da escola deve ter pelo menos 3 caracteres."),
  firstName: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  lastName: z.string().min(2, "O sobrenome deve ter pelo menos 2 caracteres."),
  email: z.string().email("Email inválido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      schoolName: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    
    try {
      // 1. Criar o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Falha ao criar o usuário. Verifique seu email para confirmação.");
      }

      const userId = authData.user.id;

      // 2. Chamar a Edge Function para criar o Tenant e o Perfil Admin
      const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('create-tenant-and-admin', {
        body: JSON.stringify({
          schoolName: data.schoolName,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          userId: userId,
        }),
      });

      if (edgeFunctionError) {
        // Se a Edge Function falhar, tentamos reverter a criação do usuário (opcional, mas boa prática)
        await supabase.auth.admin.deleteUser(userId);
        throw new Error(edgeFunctionError.message);
      }
      
      const response = edgeFunctionData as { error?: string, success?: boolean };

      if (response.error) {
        // Se a Edge Function retornar um erro de negócio (ex: escola já existe)
        await supabase.auth.admin.deleteUser(userId);
        throw new Error(response.error);
      }

      toast({
        title: "Teste Iniciado!",
        description: "Seu teste de 7 dias começou! Você será redirecionado para o login.",
        variant: "default",
      });

      navigate('/login');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado durante o cadastro.";
      toast({
        title: "Erro no Cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-accent">Inicie seu Teste Grátis</CardTitle>
          <CardDescription>Inicie seu teste grátis de 7 dias.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome da Escola */}
            <div className="space-y-2">
              <Label htmlFor="schoolName">Nome da Escola</Label>
              <Input
                id="schoolName"
                placeholder="Ex: Escola Davi"
                {...form.register("schoolName")}
              />
              {form.formState.errors.schoolName && (
                <p className="text-sm text-destructive">{form.formState.errors.schoolName.message}</p>
              )}
            </div>

            {/* Nome e Sobrenome */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Seu Nome</Label>
                <Input
                  id="firstName"
                  placeholder="João"
                  {...form.register("firstName")}
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Seu Sobrenome</Label>
                <Input
                  id="lastName"
                  placeholder="Silva"
                  {...form.register("lastName")}
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email (Será o login)</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@escola.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Iniciar Teste Grátis"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-accent hover:underline">
              Fazer Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;