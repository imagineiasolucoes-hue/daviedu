import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, BellRing, PlusCircle, MoreHorizontal, Pencil, Trash2, Globe, School, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { SaasNotification } from '@/types/saas-notifications';
import CreateEditNotificationSheet from '@/components/super-admin/CreateEditNotificationSheet';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fetchAllSaasNotifications = async (): Promise<SaasNotification[]> => {
  const { data, error } = await supabase.functions.invoke('saas-notifications/get-all');
  if (error) throw new Error(error.message);
  // @ts-ignore
  if (data.error) throw new Error(data.error);
  // @ts-ignore
  return data.notifications as SaasNotification[];
};

const ManageNotificationsPage: React.FC = () => {
  const { isSuperAdmin, isLoading: isProfileLoading } = useProfile();
  const queryClient = useQueryClient();

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<SaasNotification | null>(null);

  const { data: notifications, isLoading: isLoadingNotifications, error } = useQuery<SaasNotification[], Error>({
    queryKey: ['allSaasNotifications'],
    queryFn: fetchAllSaasNotifications,
    enabled: isSuperAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.functions.invoke('saas-notifications/delete', {
        body: JSON.stringify({ id: notificationId }),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Notificação excluída com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['allSaasNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['saasNotifications'] }); // Invalida para usuários
    },
    onError: (err) => {
      toast.error("Erro ao Excluir Notificação", { description: err.message });
    },
    onSettled: () => {
      setIsDeleteDialogOpen(false);
      setSelectedNotification(null);
    },
  });

  const handleEdit = (notification: SaasNotification) => {
    setSelectedNotification(notification);
    setIsEditSheetOpen(true);
  };

  const handleDelete = (notification: SaasNotification) => {
    setSelectedNotification(notification);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedNotification) {
      deleteMutation.mutate(selectedNotification.id);
    }
  };

  if (isProfileLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoadingNotifications) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-destructive">Erro ao carregar notificações: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BellRing className="h-8 w-8 text-primary" />
          Gerenciar Notificações SaaS
        </h1>
        <CreateEditNotificationSheet 
          open={false} // Sempre abre como nova
          onOpenChange={() => setIsEditSheetOpen(true)} // Abre o sheet de criação
          onClose={() => setIsEditSheetOpen(false)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Lista de Notificações ({notifications?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Publicado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications?.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="font-medium max-w-xs truncate">{notification.title}</TableCell>
                    <TableCell>
                      {notification.is_global ? (
                        <Badge variant="secondary" className="bg-blue-500 text-white">
                          <Globe className="h-3 w-3 mr-1" /> Global
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-purple-500 text-white">
                          <School className="h-3 w-3 mr-1" /> Específica
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {notification.is_global ? 'Todas as Escolas' : notification.tenant_name || 'N/A'}
                      {notification.target_role && (
                        <Badge variant="outline" className="ml-2">
                          <User className="h-3 w-3 mr-1" /> {notification.target_role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(notification.published_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(notification)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(notification)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {notifications?.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">Nenhuma notificação cadastrada.</p>
          )}
        </CardContent>
      </Card>

      <CreateEditNotificationSheet
        notification={selectedNotification}
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        onClose={() => setIsEditSheetOpen(false)}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-6 w-6" /> Confirmar Exclusão de Notificação
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a notificação "<strong>{selectedNotification?.title}</strong>"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageNotificationsPage;