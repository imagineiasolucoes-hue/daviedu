import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, BellRing, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { SaasNotification } from '@/types/saas-notifications';
import NotificationCard from '@/components/notifications/NotificationCard';
import { Separator } from '@/components/ui/separator';

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

const NotificationsPage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const queryClient = useQueryClient();
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(getReadNotifications);

  const { data: notifications, isLoading: isLoadingNotifications, error } = useQuery<SaasNotification[], Error>({
    queryKey: ['saasNotifications', user?.id, profile?.tenant_id, profile?.role],
    queryFn: () => fetchNotificationsForUser(user!.id),
    enabled: !!user && !!profile && !isAuthLoading && !isProfileLoading,
  });

  useEffect(() => {
    // Marcar todas as notificações como lidas ao carregar a página
    if (notifications) {
      const allNotificationIds = new Set(notifications.map(n => n.id));
      setReadNotificationIds(allNotificationIds);
      setReadNotifications(allNotificationIds);
      queryClient.invalidateQueries({ queryKey: ['saasNotifications'] }); // Atualiza o contador do sino
    }
  }, [notifications, queryClient]);

  if (isAuthLoading || isProfileLoading || isLoadingNotifications) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive">Erro ao carregar notificações: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BellRing className="h-8 w-8 text-primary" />
          Central de Notificações
        </h1>
        <Button variant="outline" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Dashboard
          </Link>
        </Button>
      </div>
      <p className="text-muted-foreground">
        Aqui você encontra todas as comunicações importantes da equipe Davi EDU.
      </p>

      <Separator />

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {notifications && notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationCard 
              key={notification.id} 
              notification={{ ...notification, is_read: true }} // Sempre lida nesta página
              isDetailedView={true} 
            />
          ))
        ) : (
          <Card className="lg:col-span-2">
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma notificação encontrada.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;