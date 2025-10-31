import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const securitySchema = z.object({
  password: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres."),
});

type SecurityFormData = z.infer<typeof securitySchema>;

const SecuritySettingsForm: React.FC = () => {
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
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  placeholder="••••••••"
                />
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