import React from 'react';
import { X, ShieldAlert, AlertTriangle, Info, Database, CheckCircle } from 'lucide-react'; // Added CheckCircle
import { cn } from '@/lib/utils';
import { useBackupNotifications } from '@/hooks/useBackupNotifications';
import { Notification } from '@/types/notifications';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'; // Added AlertDialog imports
import { Button } from '@/components/ui/button'; // Added Button import

interface BackupAlertsProps {
  maxAlerts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const BackupAlerts: React.FC<BackupAlertsProps> = ({
  maxAlerts = 5,
  position = 'bottom-right',
}) => {
  const { notifications, dismissNotification } = useBackupNotifications();

  const positionClasses = {
    'top-right': 'top-4 right-4 items-end',
    'top-left': 'top-4 left-4 items-start',
    'bottom-right': 'bottom-4 right-4 items-end',
    'bottom-left': 'bottom-4 left-4 items-start',
  };

  const getIcon = (variant: Notification['variant']) => {
    switch (variant) {
      case 'error': return <ShieldAlert className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info': return <Info className="h-5 w-5 text-blue-600" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      default: return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getBorderColor = (variant: Notification['variant']) => {
    switch (variant) {
      case 'error': return 'border-red-500';
      case 'warning': return 'border-yellow-500';
      case 'info': return 'border-blue-500';
      case 'success': return 'border-green-500';
      default: return 'border-gray-300';
    }
  };

  const getBgColor = (variant: Notification['variant']) => {
    switch (variant) {
      case 'error': return 'bg-red-50 dark:bg-red-950/30';
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-950/30';
      case 'info': return 'bg-blue-50 dark:bg-blue-950/30';
      case 'success': return 'bg-green-50 dark:bg-green-950/30';
      default: return 'bg-gray-50 dark:bg-gray-950/30';
    }
  };

  // Filtra apenas as notificações do tipo 'toast' para serem exibidas aqui
  const toastNotifications = notifications.filter(n => n.type === 'toast');
  // Filtra as notificações do tipo 'modal' para serem exibidas como modais
  const modalNotifications = notifications.filter(n => n.type === 'modal');

  return (
    <>
      {/* Toast Notifications */}
      <div className={cn(
        "fixed z-[9999] flex flex-col gap-3 max-h-[90vh] w-full max-w-sm p-4 pointer-events-none",
        positionClasses[position]
      )}>
        <div className="flex items-center justify-between mb-2 pointer-events-auto">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Alertas de Backup
            {toastNotifications.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary rounded-full">
                {toastNotifications.length}
              </span>
            )}
          </h3>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar">
          {toastNotifications.slice(0, maxAlerts).map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "relative flex items-start gap-3 p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 ease-out transform opacity-100 translate-y-0 pointer-events-auto",
                getBgColor(alert.variant),
                getBorderColor(alert.variant)
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(alert.variant)}
              </div>
              <div className="flex-grow">
                <p className="font-semibold text-foreground">{alert.title}</p>
                <p className="text-sm text-muted-foreground">{alert.message}</p>
                {alert.actions && alert.actions.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {alert.actions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          action.onClick();
                          dismissNotification(alert.id); // Dispensa após a ação
                        }}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => dismissNotification(alert.id)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Notifications */}
      {modalNotifications.map(modal => (
        <AlertDialog key={modal.id} open={true} onOpenChange={() => dismissNotification(modal.id)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className={cn("flex items-center gap-2", modal.variant === 'error' ? 'text-destructive' : 'text-primary')}>
                {getIcon(modal.variant)} {modal.title}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {modal.message}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {modal.actions && modal.actions.map((action, idx) => (
                <Button
                  key={idx}
                  onClick={() => {
                    action.onClick();
                    dismissNotification(modal.id);
                  }}
                  variant={modal.variant === 'error' ? 'destructive' : 'default'}
                >
                  {action.label}
                </Button>
              ))}
              {/* Adiciona um botão de fechar padrão se não houver ações */}
              {!modal.actions || modal.actions.length === 0 ? (
                <AlertDialogCancel asChild>
                  <Button onClick={() => dismissNotification(modal.id)} variant="outline">
                    Fechar
                  </Button>
                </AlertDialogCancel>
              ) : null}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}
    </>
  );
};

export default BackupAlerts;