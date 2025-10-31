import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
  first_name: z.string().min(2, "O nome é obrigatório."),
  last_name: z.string().min(2, "O sobrenome é obrigatório."),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfileSettingsForm: React.FC = () => {
  const { profile, isLoading, refetch } = useProfile();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
      });
    }
  }, [profile, form]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!profile) return;

    let avatarUrl = profile.avatar_url;

    if (avatarFile) {
      const filePath = `${profile.id}/${Date.now()}_${avatarFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        toast.error("Erro no Upload do Avatar", { description: uploadError.message });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      avatarUrl = publicUrl;
    }

    await supabase.auth.updateUser({
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        avatar_url: avatarUrl,
      }
    });

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (profileUpdateError) {
      toast.error("Erro ao Salvar Perfil", { description: profileUpdateError.message });
    } else {
      toast.success("Perfil salvo com sucesso!");
      await refetch();
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Perfil</CardTitle>
          <CardDescription>Gerencie suas informações pessoais e avatar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1">
              <h3 className="font-semibold">Informações Pessoais</h3>
              <p className="text-sm text-muted-foreground">Seu nome e sobrenome.</p>
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
            </div>
          </div>

          <Separator />

          <div className="grid md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1">
              <h3 className="font-semibold">Foto de Perfil</h3>
              <p className="text-sm text-muted-foreground">Faça o upload da sua foto.</p>
            </div>
            <div className="md:col-span-2 flex items-center gap-6">
              <Avatar className="h-24 w-24 border">
                <AvatarImage src={avatarPreview || profile?.avatar_url || ''} alt="Avatar do Usuário" />
                <AvatarFallback>
                  {getInitials(profile?.first_name, profile?.last_name) || <User className="h-10 w-10" />}
                </AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" onClick={handleUploadClick}>
                <Upload className="mr-2 h-4 w-4" />
                {avatarFile ? "Alterar Foto" : "Enviar Foto"}
              </Button>
              <Input
                ref={fileInputRef}
                id="avatar-upload"
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleAvatarChange}
              />
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