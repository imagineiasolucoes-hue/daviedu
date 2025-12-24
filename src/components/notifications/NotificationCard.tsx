import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExternalLink, BellRing } from 'lucide-react';
import { SaasNotification } from '@/types/saas-notifications';
import { cn } from '@/lib/utils';

interface NotificationCardProps {
  notification: SaasNotification;
  isDetailedView?: boolean; // Para ajustar o layout em visualizações completas
  onClick?: (notification: SaasNotification) => void; // Para marcar como lida ou navegar
}

const NotificationCard: React.FC<NotificationCardProps> = ({ notification, isDetailedView = false, onClick }) => {
  const formattedDate = format(new Date(notification.published_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  const handleCardClick = () => {
    if (onClick) {
      onClick(notification);
    }
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        !isDetailedView && "hover:shadow-lg cursor-pointer",
        notification.is_read ? "bg-muted/30 border-muted" : "bg-card border-border"
      )}
      onClick={!isDetailedView ? handleCardClick : undefined}
    >
      {!notification.is_read && !isDetailedView && (
        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
      )}
      {notification.image_url && (
        <img 
          src={notification.image_url} 
          alt={notification.title} 
          className={cn(
            "w-full object-cover",
            isDetailedView ? "h-48 md:h-64" : "h-32"
          )} 
        />
      )}
      <CardHeader className={cn(isDetailedView ? "pb-4" : "pb-2")}>
        <CardTitle className={cn("flex items-center gap-2", isDetailedView ? "text-2xl" : "text-lg")}>
          <BellRing className="h-5 w-5 text-primary" />
          {notification.title}
        </CardTitle>
        <CardDescription className={cn(isDetailedView ? "text-base" : "text-sm")}>
          Publicado em {formattedDate}
          {notification.target_tenant_id && notification.tenant_name && (
            <span className="ml-2 text-muted-foreground">
              (Para: {notification.tenant_name})
            </span>
          )}
          {notification.target_role && (
            <span className="ml-2 text-muted-foreground">
              (Função: {notification.target_role})
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className={cn(isDetailedView ? "space-y-4" : "space-y-2")}>
        <p className={cn("text-muted-foreground", isDetailedView ? "text-base" : "text-sm")}>
          {notification.content}
        </p>
        {notification.external_link && (
          <Button asChild variant="link" className="p-0 h-auto text-primary">
            <a href={notification.external_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
              Saiba Mais <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
        {!isDetailedView && (
          <Button asChild variant="outline" size="sm" className="w-full mt-2">
            <Link to={`/notifications/${notification.id}`}>
              Ver Detalhes
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCard;