import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile, UserRole } from '@/hooks/useProfile';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, MessageSquare, PlusCircle, Trash2, Pencil, School, Users, MoreHorizontal, Link as LinkIcon, Image } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MessageSheet from '@/components/super-admin/MessageSheet'; // Componente para adicionar/editar
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SuperAdminMessage {
  id: string;
  title: string;
  content: string;
  tenant_id: string | null;
  is_active: boolean;
  target_role: UserRole[];
  created_at: string;
  tenants: { name: string } | null;
  link_url: string | null; // Adicionado
  image_url: string | null; // Adicionado
}

const fetchMessages = async (): Promise<SuperAdminMessage[]> => {
  const { data, error } = await supabase
    .from('super_admin_messages')
    .select(`
      id, 
      title, 
      content, 
      is_active, 
      target_role, 
      created_at, 
      tenant_id,
      link_url,
      image_url,
      tenants (name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as unknown as SuperAdminMessage[];
};

const SuperAdminMessagesPage: React.FC = () => {
  const { isSuperAdmin, isLoading: isProfileLoading } = useProfile();
  const queryClient = useQueryClient();
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<SuperAdminMessage | null>(null);

  const { data: messages, isLoading: isLoadingMessages, error } = useQuery<SuperAdminMessage[], Error>({
    queryKey: ['superAdminMessagesList'],
    queryFn: fetchMessages,
    enabled: isSuperAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('super_admin_messages')
        .delete()
        .eq('id', messageId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Mensagem excluída com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['superAdminMessagesList'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminMessages'] }); // Invalida o display dos usuários
    },
    onError: (err) => {
      toast.error("Erro ao Excluir Mensagem", { description: err.message });
    },
  });

  const handleEdit = (message: SuperAdminMessage) => {
    setSelectedMessage(message);
    setIsSheetOpen(true);
  };

  const handleDelete = (message: SuperAdminMessage) => {
    if (window.confirm(`Tem certeza que deseja excluir a mensagem: "${message.title}"?`)) {
      deleteMutation.mutate(message.id);
    }
  };
  
  const handleNewMessage = () => {
    setSelectedMessage(null);
    setIsSheetOpen(true);
  };

  if (isProfileLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoadingMessages) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive">Erro ao carregar mensagens: {error.message}</div>;
  }

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white">Admin</Badge>;
      case 'secretary': return <Badge variant="secondary" className="bg-green-500 hover:bg-green-600 text-white">Secretaria</Badge>;
      case 'teacher': return <Badge variant="secondary">Professor</Badge>;
      case 'student': return <Badge variant="outline">Aluno</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8 text-primary" />
          Comunicação Global (Pop-ups)
        </h1>
        <Button onClick={handleNewMessage}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Mensagem
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Mensagens Ativas e Agendadas ({messages?.length || 0})</CardTitle>
          <CardDescription>Gerencie as notificações que aparecem para os usuários dos tenants.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Escola (Tenant)</TableHead>
                  <TableHead>Roles Alvo</TableHead>
                  <TableHead>Link</TableHead> {/* NOVA COLUNA */}
                  <TableHead>Imagem</TableHead> {/* NOVA COLUNA */}
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages?.map((msg) => (
                  <TableRow key={msg.id}>
                    <TableCell className="font-medium max-w-xs truncate">{msg.title}</TableCell>
                    <TableCell>
                      {msg.tenant_id ? (
                        <Badge variant="secondary" className="bg-indigo-500 hover:bg-indigo-600 text-white">
                          <School className="h-3 w-3 mr-1" /> {msg.tenants?.name || 'Tenant Desconhecido'}
                        </Badge>
                      ) : (
                        <Badge className="bg-purple-600 hover:bg-purple-700 text-white">
                          <Users className="h-3 w-3 mr-1" /> Global
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {msg.target_role.map(role => getRoleBadge(role))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {msg.link_url ? (
                        <a href={msg.link_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center text-sm">
                          <LinkIcon className="h-4 w-4 mr-1" /> Link
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {msg.image_url ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={msg.image_url} alt="Imagem" />
                          <AvatarFallback><Image className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {msg.is_active ? (
                        <Badge className="bg-green-500 hover:bg-green-600">Ativa</Badge>
                      ) : (
                        <Badge variant="destructive">Inativa</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(msg)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(msg)} disabled={deleteMutation.isPending}>
                            <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {messages?.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">Nenhuma mensagem global cadastrada.</p>
          )}
        </CardContent>
      </Card>
      
      <MessageSheet 
        open={isSheetOpen} 
        onOpenChange={setIsSheetOpen} 
        initialMessage={selectedMessage}
      />
    </div>
  );
};

export default SuperAdminMessagesPage;