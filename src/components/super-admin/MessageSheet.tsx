import React, { useEffect, useMemo, useState, useRef } from 'react';
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
import { Loader2, MessageSquare, School, Users, Upload, Image, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// --- Tipos e Schemas ---
const userRoles: UserRole[] = ['admin', 'secretary', 'teacher', 'student'];

// Função auxiliar para pré-processar strings vazias para null
const preprocessString = z.preprocess(
  (value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    }
    return value;
  },
  z.string().optional().nullable()
);

const messageSchema = z.object({
  title: z.string().min(5, "O título é obrigatório."),
  content: z.string().min(10, "O conteúdo é obrigatório."),
  tenant_id: z.string().uuid("ID de escola inválido.").optional().nullable(),
  is_active: z.boolean().default(true),
  target_role: z.array(z.enum(userRoles as [UserRole, ...UserRole[]])).min(1, "Selecione pelo menos uma função alvo."),
  link_url: z.string().url("URL inválida.").optional().or(z.literal('')).nullable(), // Novo campo
  image_url: preprocessString, // Novo campo (será a URL final)
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
    link_url: string | null; // Adicionado
    image_url: string | null; // Adicionado
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      target_role: userRoles,
      link_url: null,
      image_url: null,
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
        link_url: initialMessage.link_url || null,
        image_url: initialMessage.image_url || null,
      });
    } else if (!isEditing) {
      form.reset({
        title: "",
        content: "",
        tenant_id: null,
        is_active: true,
        target_role: userRoles,
        link_url: null,
        image_url: null,
      });
    }
    setImageFile(null); // Limpa o arquivo de imagem ao abrir/fechar
  }, [initialMessage, form, isEditing, open]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      form.setValue('image_url', URL.createObjectURL(file)); // Usa URL temporária para preview
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    form.setValue('image_url', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const mutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      let finalImageUrl = data.image_url;

      // 1. Upload da Imagem, se houver um novo arquivo
      if (imageFile) {
        // CORREÇÃO: Usando uma subpasta 'messages' em vez de 'public' para evitar conflitos de caminho
        const filePath = `messages/${Date.now()}_${imageFile.name}`; 
        
        // NOTA: O bucket 'sa-messages' deve ser criado manualmente no Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('sa-messages')
          .upload(filePath, imageFile, { upsert: true });

        if (uploadError) {
          throw new Error(`Erro no Upload da Imagem: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('sa-messages')
          .getPublicUrl(filePath);
        
        finalImageUrl = publicUrl;
      } else if (data.image_url && !data.image_url.startsWith('blob:')) {
        // Se não há novo arquivo, mas há uma URL existente (mantida), usamos ela
        finalImageUrl = data.image_url;
      } else {
        // Se não há arquivo e a URL é temporária ou nula, limpamos
        finalImageUrl = null;
      }

      // 2. Inserção/Atualização no DB
      const payload = {
        ...data,
        tenant_id: data.tenant_id || null,
        link_url: data.link_url || null,
        image_url: finalImageUrl, // Usa a URL final
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
      queryClient.invalidateQueries({ queryKey: ['superAdminMessages'] });
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
  const currentImageUrl = form.watch('image_url');

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

          {/* Link Externo */}
          <div className="space-y-2">
            <Label htmlFor="link_url">Link Externo (Opcional)</Label>
            <Input id="link_url" {...form.register("link_url")} placeholder="Ex: https://kiwify.com.br/assinatura" />
            {form.formState.errors.link_url && <p className="text-sm text-destructive">{form.formState.errors.link_url.message}</p>}
            <p className="text-xs text-muted-foreground">Se preenchido, um botão de ação será exibido na notificação.</p>
          </div>

          <Separator />

          {/* Imagem (Upload) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              Imagem (Opcional)
            </h3>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border">
                <AvatarImage src={currentImageUrl || ''} alt="Preview da Imagem" />
                <AvatarFallback><Image className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  {imageFile ? "Alterar Imagem" : (currentImageUrl ? "Alterar Imagem" : "Enviar Imagem")}
                </Button>
                {currentImageUrl && (
                  <Button type="button" variant="ghost" onClick={handleRemoveImage} className="w-full">
                    <X className="mr-2 h-4 w-4" /> Remover Imagem
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">A imagem será exibida no topo da notificação.</p>
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