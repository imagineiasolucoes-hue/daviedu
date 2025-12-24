import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, PlusCircle, Save, Globe, School, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SaasNotification, UserRole } from '@/types/saas-notifications';

// --- Schemas de Validação ---
const notificationSchema = z.object({
  title: z.string().min(5, "O título é obrigatório e deve ter pelo menos 5 caracteres."),
  content: z.string().min(20, "O conteúdo é obrigatório e deve ter pelo menos 20 caracteres."),
  image_url: z.string().url("URL da imagem inválida.").optional().or(z.literal('')).nullable(),
  external_link: z.string().url("URL do link externo inválida.").optional().or(z.literal('')).nullable(),
  is_global: z.boolean().default(true),
  target_tenant_id: z.string().uuid("Selecione uma escola válida.").optional().nullable(),
  target_role: z.enum(['admin', 'secretary', 'teacher', 'student']).optional().nullable(),
}).refine(data => {
  // Se não for global, target_tenant_id é obrigatório
  if (!data.is_global && !data.target_tenant_id) {
    return false;
  }
  // Se for global, target_tenant_id e target_role devem ser nulos
  if (data.is_global && (data.target_tenant_id || data.target_role)) {
    return false;
  }
  // Se target_role for selecionado, target_tenant_id também deve ser
  if (data.target_role && !data.target_tenant_id) {
    return false;
  }
  return true;
}, {
  message: "A configuração de direcionamento da notificação é inválida.",
  path: ["is_global", "target_tenant_id", "target_role"],
});

type NotificationFormData = z.infer<typeof notificationSchema>;

interface CreateEditNotificationSheetProps {
  notification?: SaasNotification | null; // Se for edição, passa a notificação
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

interface TenantOption {
  id: string;
  name: string;
}

const fetchTenants = async (): Promise<TenantOption[]> => {
  const { data, error } = await supabase
    .from('tenants')
    .select('id, name')
    .order('name');
  if (error) throw new Error(error.message);
  return data;
};

const CreateEditNotificationSheet: React.FC<CreateEditNotificationSheetProps> = ({ notification, open, onOpenChange, onClose }) => {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const isEditing = !!notification;

  const { data: tenants, isLoading: isLoadingTenants } = useQuery<TenantOption[], Error>({
    queryKey: ['allTenantsForNotifications'],
    queryFn: fetchTenants,
    enabled: open, // Só busca quando o sheet está aberto
  });

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: "",
      content: "",
      image_url: null,
      external_link: null,
      is_global: true,
      target_tenant_id: null,
      target_role: null,
    },
  });

  useEffect(() => {
    if (isEditing && notification) {
      form.reset({
        title: notification.title,
        content: notification.content,
        image_url: notification.image_url || null,
        external_link: notification.external_link || null,
        is_global: notification.is_global,
        target_tenant_id: notification.target_tenant_id || null,
        target_role: notification.target_role || null,
      });
    } else if (!isEditing) {
      form.reset({
        title: "",
        content: "",
        image_url: null,
        external_link: null,
        is_global: true,
        target_tenant_id: null,
        target_role: null,
      });
    }
  }, [notification, isEditing, form, open]);

  const createMutation = useMutation({
    mutationFn: async (data: NotificationFormData) => {
      const payload = {
        ...data,
        image_url: data.image_url || null,
        external_link: data.external_link || null,
        target_tenant_id: data.is_global ? null : data.target_tenant_id,
        target_role: data.is_global ? null : data.target_role,
      };
      const { error } = await supabase.functions.invoke('saas-notifications/create', {
        body: JSON.stringify(payload),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Notificação criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['allSaasNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['saasNotifications'] }); // Invalida para usuários
      onClose();
    },
    onError: (error) => {
      toast.error("Erro ao Criar Notificação", { description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: NotificationFormData) => {
      if (!notification?.id) throw new Error("ID da notificação ausente para atualização.");
      const payload = {
        id: notification.id,
        ...data,
        image_url: data.image_url || null,
        external_link: data.external_link || null,
        target_tenant_id: data.is_global ? null : data.target_tenant_id,
        target_role: data.is_global ? null : data.target_role,
      };
      const { error } = await supabase.functions.invoke('saas-notifications/update', {
        body: JSON.stringify(payload),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Notificação atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['allSaasNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['saasNotifications'] }); // Invalida para usuários
      onClose();
    },
    onError: (error) => {
      toast.error("Erro ao Atualizar Notificação", { description: error.message });
    },
  });

  const onSubmit = (data: NotificationFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isGlobal = form.watch('is_global');
  const targetTenantId = form.watch('target_tenant_id');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {!isEditing && (
        <SheetTrigger asChild>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Notificação
          </Button>
        </SheetTrigger>
      )}
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar Notificação" : "Criar Nova Notificação"}</SheetTitle>
          <SheetDescription>
            {isEditing ? "Atualize os detalhes da notificação." : "Crie uma nova notificação para os usuários do SaaS."}
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" {...form.register("title")} />
            {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea id="content" {...form.register("content")} rows={5} />
            {form.formState.errors.content && <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">URL da Imagem (Opcional)</Label>
            <Input id="image_url" {...form.register("image_url")} placeholder="Ex: https://exemplo.com/imagem.jpg" />
            {form.formState.errors.image_url && <p className="text-sm text-destructive">{form.formState.errors.image_url.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="external_link">Link Externo (Opcional)</Label>
            <Input id="external_link" {...form.register("external_link")} placeholder="Ex: https://blog.davi.edu/novidades" />
            {form.formState.errors.external_link && <p className="text-sm text-destructive">{form.formState.errors.external_link.message}</p>}
          </div>

          <Separator />

          {/* Direcionamento da Notificação */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Direcionamento</h3>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_global"
                checked={isGlobal}
                onCheckedChange={(checked) => {
                  form.setValue('is_global', checked);
                  if (checked) {
                    form.setValue('target_tenant_id', null);
                    form.setValue('target_role', null);
                  }
                }}
              />
              <Label htmlFor="is_global" className="flex items-center gap-2">
                <Globe className="h-4 w-4" /> Notificação Global (Para todas as escolas)
              </Label>
            </div>

            {!isGlobal && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="target_tenant_id" className="flex items-center gap-2">
                    <School className="h-4 w-4" /> Escola Específica
                  </Label>
                  <Select 
                    onValueChange={(value) => form.setValue('target_tenant_id', value === "none" ? null : value)} 
                    value={form.watch('target_tenant_id') || 'none'}
                    disabled={isLoadingTenants}
                  >
                    <SelectTrigger id="target_tenant_id">
                      <SelectValue placeholder={isLoadingTenants ? "Carregando escolas..." : "Selecione a escola"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma (Torna-se global se não houver escola)</SelectItem>
                      {tenants?.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.target_tenant_id && <p className="text-sm text-destructive">{form.formState.errors.target_tenant_id.message}</p>}
                </div>

                {targetTenantId && (
                  <div className="space-y-2">
                    <Label htmlFor="target_role" className="flex items-center gap-2">
                      <User className="h-4 w-4" /> Função Específica (Opcional)
                    </Label>
                    <Select 
                      onValueChange={(value) => form.setValue('target_role', value === "none" ? null : value as UserRole)} 
                      value={form.watch('target_role') || 'none'}
                    >
                      <SelectTrigger id="target_role">
                        <SelectValue placeholder="Todas as funções na escola" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Todas as Funções</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="secretary">Secretário(a)</SelectItem>
                        <SelectItem value="teacher">Professor(a)</SelectItem>
                        <SelectItem value="student">Aluno(a)</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.target_role && <p className="text-sm text-destructive">{form.formState.errors.target_role.message}</p>}
                  </div>
                )}
              </>
            )}
            {form.formState.errors.is_global && <p className="text-sm text-destructive">{form.formState.errors.is_global.message}</p>}
          </div>

          <SheetFooter className="pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? "Salvar Alterações" : "Criar Notificação"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default CreateEditNotificationSheet;