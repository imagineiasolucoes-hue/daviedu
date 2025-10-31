import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const profileSchema = z.object({
  first_name: z.string().min(2, "O nome é obrigatório."),
  last_name: z.string().min(2, "O sobrenome é obrigatório."),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfileSettingsForm: React.FC = () => {
  const { profile, isLoading, refetch } = useProfile();
  const { user } = useAuth();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!profile) return;

    // Atualiza os dados na tabela de profiles
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (profileUpdateError) {
      toast.error("Erro ao Salvar Perfil", { description: profileUpdateError.message });
    } else {
      toast.success("Perfil salvo com sucesso!");
      await refetch();
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Perfil</CardTitle>
          <CardDescription>Gerencie suas informações pessoais.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1">
              <h3 className="font-semibold">Informações Pessoais</h3>
              <p className="text-sm text-muted-foreground">Seu nome, sobrenome e contatos.</p>
            </div>
            <div className="md:col-span-2 grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nome</Label>
                  <Input id="first_name" {...form.register("first_name")} />
                  {form.formState.errors.first_name && <p className="text-sm text-destructive">{form.formState.errors.first_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Sobrenome</Label>
                  <Input id="last_name" {...form.register("last_name")} />
                  {form.formState.errors.last_name && <p className="text-sm text-destructive">{form.formState.errors.last_name.message}</p>}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail de Cadastro</Label>
                  <Input id="email" type="email" value={user?.email || ''} disabled />
                  <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone de Contato</Label>
                  <Input id="phone" type="tel" {...form.register("phone")} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default ProfileSettingsForm;