import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, GraduationCap, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

// --- Tipos e Schemas ---
type UserType = 'student' | 'teacher';

const baseSchema = z.object({
  email: z.string().email("Email inválido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  tenantId: z.string().uuid("Selecione uma escola."),
});

const studentSchema = baseSchema.extend({
  userType: z.literal('student'),
  registrationCode: z.string().min(1, "A matrícula é obrigatória."),
});

const teacherSchema = baseSchema.extend({
  userType: z.literal('teacher'),
  fullName: z.string().min(5, "O nome completo é obrigatório."),
});

const formSchema = z.union([studentSchema, teacherSchema]);

type UserSignupFormData = z.infer<typeof formSchema>;

interface Tenant {
  id: string;
  name: string;
}

// --- Funções de Busca de Dados ---
const fetchTenants = async (): Promise<Tenant[]> => {
  // Busca apenas tenants ativos ou em trial para cadastro
  const { data, error } = await supabase
    .from('tenants')
    .select('id, name')
    .in('status', ['active', 'trial'])
    .order('name');
  if (error) throw new Error(error.message);
  return data;
};

const UserSignup: React.FC = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType>('student');

  const { data: tenants, isLoading: isLoadingTenants, error: tenantsError } = useQuery<Tenant[], Error>({
    queryKey: ['publicTenants'],
    queryFn: fetchTenants,
  });

  const form = useForm<UserSignupFormData>({
    resolver: zodResolver(userType === 'student' ? studentSchema : teacherSchema),
    defaultValues: {
      email: "",
      password: "",
      tenantId: undefined,
      userType: userType,
      registrationCode: "",
      fullName: "",
    },
  });

  // Atualiza o tipo de usuário no formulário ao mudar o estado local
  React.useEffect(() => {
    form.setValue('userType', userType);
    form.clearErrors(); // Limpa erros ao trocar de tipo
  }, [userType, form]);

  const onSubmit = async (data: UserSignupFormData) => {
    let edgeFunctionName: 'register-student' | 'register-teacher';
    let payload: any;

    if (data.userType === 'student') {
      edgeFunctionName = 'register-student';
      payload = {
        email: data.email,
        password: data.password,
        tenant_id: data.tenantId,
        registration_code: data.registrationCode,
      };
    } else {
      edgeFunctionName = 'register-teacher';
      payload = {
        email: data.email,
        password: data.password,
        tenant_id: data.tenantId,
        full_name: data.fullName,
      };
    }

    try {
      const { error: edgeFunctionError } = await supabase.functions.invoke(edgeFunctionName, {
        body: JSON.stringify(payload),
      });

      if (edgeFunctionError) {
        throw new Error(edgeFunctionError.message);
      }

      toast.success("Cadastro realizado com sucesso!", {
        description: "Você pode fazer login agora.",
      });

      navigate('/login');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado durante o cadastro.";
      toast.error("Erro no Cadastro", {
        description: errorMessage,
      });
    }
  };

  const isSubmitting = form.formState.isSubmitting;
  const errors = form.formState.errors;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Cadastro de Usuário</CardTitle>
          <CardDescription>Vincule-se à sua escola como aluno ou professor.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Seleção de Tipo de Usuário */}
            <div className="space-y-2">
              <Label>Eu sou:</Label>
              <RadioGroup 
                defaultValue="student" 
                onValueChange={(value: UserType) => setUserType(value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-md flex-1 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="student" id="r1" />
                  <Label htmlFor="r1" className="flex items-center gap-2 cursor-pointer">
                    <GraduationCap className="h-4 w-4" /> Aluno
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-md flex-1 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="teacher" id="r2" />
                  <Label htmlFor="r2" className="flex items-center gap-2 cursor-pointer">
                    <UserCheck className="h-4 w-4" /> Professor
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Seleção de Escola */}
            <div className="space-y-2">
              <Label htmlFor="tenantId">Selecione sua Escola</Label>
              <Select 
                onValueChange={(value) => form.setValue('tenantId', value)} 
                value={form.watch('tenantId') || ''}
                disabled={isLoadingTenants || (tenants && tenants.length === 0)}
              >
                <SelectTrigger id="tenantId">
                  <SelectValue placeholder={isLoadingTenants ? "Carregando escolas..." : "Selecione sua escola"} />
                </SelectTrigger>
                <SelectContent>
                  {tenants?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tenantId && <p className="text-sm text-destructive">{errors.tenantId.message}</p>}
              {tenantsError && <p className="text-sm text-destructive">Erro ao carregar escolas: {tenantsError.message}</p>}
            </div>

            {/* Campos Comuns */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu.email@exemplo.com" {...form.register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" {...form.register("password")} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            {/* Campos Específicos */}
            {userType === 'student' && (
              <div className="space-y-2">
                <Label htmlFor="registrationCode">Código de Matrícula</Label>
                <Input id="registrationCode" placeholder="Ex: 2024001" {...form.register("registrationCode")} />
                {errors['registrationCode'] && <p className="text-sm text-destructive">{errors['registrationCode'].message}</p>}
                <p className="text-xs text-muted-foreground">Este código é fornecido pela secretaria da sua escola.</p>
              </div>
            )}

            {userType === 'teacher' && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input id="fullName" placeholder="Seu Nome Completo" {...form.register("fullName")} />
                {errors['fullName'] && <p className="text-sm text-destructive">{errors['fullName'].message}</p>}
                <p className="text-xs text-muted-foreground">Use o nome completo que a escola utiliza em seus registros.</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting || isLoadingTenants}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {userType === 'student' ? "Cadastrar Aluno" : "Cadastrar Professor"}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Fazer Login
            </            Link>
          </div>
          <div className="mt-2 text-center text-sm text-muted-foreground">
            É administrador de uma nova escola?{' '}
            <Link to="/register" className="text-accent hover:underline">
              Inicie seu Teste Grátis
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSignup;