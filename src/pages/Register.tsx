import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { Loader2 } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import usePageTitle from "@/hooks/usePageTitle";

// Define o número de telefone para o WhatsApp (substitua pelo seu número)
const WHATSAPP_NUMBER = "5511999999999"; // Exemplo: 55 (código do país) 11 (DDD) 999999999 (número)

const registerSchema = z.object({
  schoolName: z.string().min(3, "O nome da escola é obrigatório"),
  firstName: z.string().min(2, "O nome é obrigatório"),
  lastName: z.string().min(2, "O sobrenome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"), // Added password field
});

const Register = () => {
  usePageTitle("Cadastro");
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      schoolName: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "", // Default value for password
    },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    try {
      // 1. Sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            first_name: values.firstName,
            last_name: values.lastName,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Falha ao criar usuário. Verifique seu email e tente novamente.");
      }

      // 2. Invoke the edge function to create tenant and update profile
      const { data, error: edgeFunctionError } = await supabase.functions.invoke("create-tenant-and-admin", {
        body: {
          schoolName: values.schoolName,
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          userId: authData.user.id, // Pass the newly created user's ID
        },
      });

      if (edgeFunctionError) {
        throw new Error(edgeFunctionError.message);
      }
      
      const { schoolName, firstName, email } = data as { schoolName: string, firstName: string, email: string };

      showSuccess("Solicitação enviada! Redirecionando para o WhatsApp...");

      // 1. Montar a mensagem para o WhatsApp
      const whatsappMessage = `Olá! Acabei de cadastrar minha escola no sistema Gestão Escolar. 
      
      *Nome da Escola:* ${schoolName}
      *Administrador:* ${firstName} ${values.lastName}
      *Email:* ${email}
      
      Gostaria de solicitar a liberação do meu acesso de 7 dias.`;

      const encodedMessage = encodeURIComponent(whatsappMessage);
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

      // 2. Redirecionar para o WhatsApp
      window.location.href = whatsappUrl;

    } catch (error: any) {
      console.error("Registration failed:", error);
      showError(error.message || "Ocorreu um erro ao cadastrar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Solicite seu Acesso Gratuito</CardTitle>
          <CardDescription>Cadastre sua escola para iniciar o teste de 7 dias.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="schoolName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Escola</FormLabel>
                    <FormControl>
                      <Input placeholder="Colégio Exemplo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seu Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="João" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seu Sobrenome</FormLabel>
                      <FormControl>
                        <Input placeholder="Silva" {...field} />
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
                    <FormLabel>Seu Email (Administrador)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cadastrar Escola e Falar com Consultor
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Já tem acesso?{" "}
            <Link to="/login" className="underline">
              Faça login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;