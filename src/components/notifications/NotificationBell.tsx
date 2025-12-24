import React, { useState, useEffect, useRef } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { SaasNotification } from '@/types/saas-notifications';
import NotificationCard from './NotificationCard';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

// Mock de notificações lidas (para simular estado no cliente)
const getReadNotifications = (): Set<string> => {
  const stored = localStorage.getItem('read_saas_notifications');
  return stored ? new Set(JSON.parse(stored)) : new Set();
};

const setReadNotifications = (readIds: Set<string>) => {
  localStorage.setItem('read_saas_notifications', JSON.stringify(Array.from(readIds)));
};

const fetchNotificationsForUser = async (userId: string): Promise<SaasNotification[]> => {
  const { data, error } = await supabase.functions.invoke('saas-notifications/get-for-user');
  if (error) throw new Error(error.message);
  // @ts-ignore
  if (data.error) throw new Error(data.error);
  // @ts-ignore
  return data.notifications as SaasNotification[];
};

const NotificationBell: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const queryClient = useQueryClient();
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(getReadNotifications);
  const popoverRef = useRef<HTMLDivElement>(null);

  const { data: notifications, isLoading: isLoadingNotifications, error } = useQuery<SaasNotification[], Error>({
    queryKey: ['saasNotifications', user?.id, profile?.tenant_id, profile?.role],
    queryFn: () => fetchNotificationsForUser(user!.id),
    enabled: !!user && !!profile && !isAuthLoading && !isProfileLoading,
    refetchInterval: 60000, // Refetch a cada minuto
  });

  const unreadCount = notifications?.filter(n => !readNotificationIds.has(n.id)).length || 0;

  const handleNotificationClick = (notification: SaasNotification) => {
    const newReadIds = new Set(readNotificationIds);
    newReadIds.add(notification.id);
    setReadNotificationIds(newReadIds);
    setReadNotifications(newReadIds);
    queryClient.invalidateQueries({ queryKey: ['saasNotifications'] }); // Força a atualização do contador
  };

  useEffect(() => {
    // Atualiza o estado de leitura quando as notificações são carregadas
    if (notifications) {
      const newReadIds = new Set(readNotificationIds);
      let changed = false;
      notifications.forEach(n => {
        if (n.is_read && !newReadIds.has(n.id)) {
          newReadIds.add(n.id);
          changed = true;
        }
      });
      if (changed) {
        setReadNotificationIds(newReadIds);
        setReadNotifications(newReadIds);
      }
    }
  }, [notifications]);

  if (isAuthLoading || isProfileLoading || !user || !profile) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </Button>
    );
  }

  if (error) {
    console.error("Error fetching notifications:", error);
    // toast.error("Erro ao carregar notificações", { description: error.message });
    return null; // Não exibe o sino se houver erro
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" ref={popoverRef}>
        <div className="flex items-center justify-between p-4">
          <h4 className="font-semibold text-lg">Notificações</h4>
          {unreadCount > 0 && (
            <span className="text-sm text-muted-foreground">{unreadCount} não lida(s)</span>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          <div className="p-2">
            {isLoadingNotifications ? (
              <div className="flex justify-center items-center h-full py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id} className="mb-2 last:mb-0">
                  <NotificationCard
                    notification={{ ...notification, is_read: readNotificationIds.has(notification.id) }}
                    onClick={handleNotificationClick}
                  />
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma notificação recente.</p>
            )}
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-4 text-center">
          <Button asChild variant="link" className="w-full">
            <Link to="/notifications" onClick={() => {
                // Marcar todas como lidas ao ir para a página completa
                const allIds = new Set(notifications?.map(n => n.id) || []);
                setReadNotificationIds(allIds);
                setReadNotifications(allIds);
                queryClient.invalidateQueries({ queryKey: ['saasNotifications'] });
            }}>
              Ver Todas as Notificações
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;