import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Manter import para outros inputs, se houver
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const securitySchema = z.object({
  password: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres."),
});

type SecurityFormData = z.infer<typeof securitySchema>;

const SecuritySettingsForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SecurityFormData>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = async (data: SecurityFormData) => {
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      toast.error("Erro ao Alterar Senha", {
        description: error.message,
      });
    } else {
      toast.success("Senha alterada com sucesso!");
      form.reset();
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Segurança e Acesso</CardTitle>
          <CardDescription>Altere sua senha de acesso ao sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1">
              <h3 className="font-semibold">Alterar Senha</h3>
              <p className="text-sm text-muted-foreground">
                Após a alteração, você será desconectado de outras sessões ativas.
              </p>
            </div>
            <div className="md:col-span-2 grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  {/* Usando input HTML nativo para depuração */}
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...form.register("password")}
                    placeholder="••••••••"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10" // Adicionando classes Tailwind diretamente
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar Nova Senha
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default SecuritySettingsForm;