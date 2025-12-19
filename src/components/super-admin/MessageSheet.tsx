import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, MessageSquare, School, Users } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

// --- Tipos e Schemas ---
const userRoles: UserRole[] = ['admin', 'secretary', 'teacher', 'student'];

const messageSchema = z.object({
  title: z.string().min(5, "O título é obrigatório."),
  content: z.string().min(10, "O conteúdo é obrigatório."),
  tenant_id: z.string().uuid("ID de escola inválido.").optional().nullable(),
  is_active: z.boolean().default(true),
  target_role: z.array(z.enum(userRoles as [UserRole, ...UserRole[]])).min(1, "Selecione pelo menos uma função alvo."),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface Tenant {
  id: string;
  name: string;
}

interface MessageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMessage: {
    id: string;
    title: string;
    content: string;
    tenant_id: string | null;
    is_active: boolean;
    target_role: UserRole[];
  } | null;
}

// --- Funções de Busca de Dados ---
const fetchAllTenants = async (): Promise<Tenant[]> => {
  const { data, error } = await supabase
    .from('tenants')
    .select('id, name')
    .order('name');
  if (error) throw new Error(error.message);
  return data;
};

const MessageSheet: React.FC<MessageSheetProps> = ({ open, onOpenChange, initialMessage }) => {
  const queryClient = useQueryClient();
  const isEditing = !!initialMessage;

  const { data: tenants, isLoading: isLoadingTenants } = useQuery<Tenant[], Error>({
    queryKey: ['allTenants'],
    queryFn: fetchAllTenants,
    enabled: open,
  });

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      title: "",
      content: "",
      tenant_id: null,
      is_active: true,
      target_role: userRoles, // Padrão: todas as roles
    },
  });

  useEffect(() => {
    if (isEditing && initialMessage) {
      form.reset({
        title: initialMessage.title,
        content: initialMessage.content,
        tenant_id: initialMessage.tenant_id,
        is_active: initialMessage.is_active,
        target_role: initialMessage.target_role,
      });
    } else if (!isEditing) {
      form.reset({
        title: "",
        content: "",
        tenant_id: null,
        is_active: true,
        target_role: userRoles,
      });
    }
  }, [initialMessage, form, isEditing]);

  const mutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      const payload = {
        ...data,
        tenant_id: data.tenant_id || null, // Garante que seja null se 'global' for selecionado
      };

      if (isEditing) {
        const { error } = await supabase
          .from('super_admin_messages')
          .update(payload)
          .eq('id', initialMessage!.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('super_admin_messages')
          .insert(payload);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success(`Mensagem ${isEditing ? 'atualizada' : 'criada'} com sucesso.`);
      queryClient.invalidateQueries({ queryKey: ['superAdminMessagesList'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminMessages'] }); // Invalida o display dos usuários
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao ${isEditing ? 'Atualizar' : 'Criar'} Mensagem`, { description: error.message });
    },
  });

  const onSubmit = (data: MessageFormData) => {
    mutation.mutate(data);
  };
  
  const selectedRoles = form.watch('target_role');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar Mensagem Global" : "Criar Nova Mensagem Global"}</SheetTitle>
          <SheetDescription>
            {isEditing ? "Atualize o conteúdo e o público alvo da notificação." : "Crie uma notificação pop-up para aparecer para os usuários dos tenants."}
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          
          {/* Título e Conteúdo */}
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" {...form.register("title")} placeholder="Ex: Manutenção Agendada" />
            {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo da Mensagem</Label>
            <Textarea id="content" {...form.register("content")} rows={4} placeholder="Ex: O sistema passará por manutenção das 2h às 4h da manhã." />
            {form.formState.errors.content && <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>}
          </div>

          <Separator />

          {/* Configurações de Alvo */}
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Público Alvo
          </h3>
          
          {/* Seleção de Tenant */}
          <div className="space-y-2">
            <Label htmlFor="tenant_id">Escola (Tenant)</Label>
            <Select 
              onValueChange={(value) => form.setValue('tenant_id', value === 'global' ? null : value)} 
              value={form.watch('tenant_id') || 'global'}
              disabled={isLoadingTenants}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingTenants ? "Carregando escolas..." : "Selecione a escola"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global (Todas as Escolas)</SelectItem>
                {tenants?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.tenant_id && <p className="text-sm text-destructive">{form.formState.errors.tenant_id.message}</p>}
          </div>

          {/* Seleção de Roles */}
          <div className="space-y-2">
            <Label>Funções de Usuário Alvo</Label>
            <div className="grid grid-cols-2 gap-3">
              {userRoles.map(role => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox
                    id={role}
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={(checked) => {
                      const currentRoles = form.getValues('target_role');
                      const newRoles = checked
                        ? [...currentRoles, role]
                        : currentRoles.filter(r => r !== role);
                      form.setValue('target_role', newRoles, { shouldValidate: true });
                    }}
                  />
                  <Label htmlFor={role} className="capitalize text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {role.replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
            {form.formState.errors.target_role && <p className="text-sm text-destructive mt-2">{form.formState.errors.target_role.message}</p>}
          </div>

          <Separator />

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={form.watch('is_active')}
              onCheckedChange={(checked) => form.setValue('is_active', checked)}
            />
            <Label htmlFor="is_active">Mensagem Ativa (Visível agora)</Label>
          </div>

          <SheetFooter className="pt-4">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar Alterações" : "Criar Mensagem"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default MessageSheet;