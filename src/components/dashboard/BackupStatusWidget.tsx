import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Database, Clock, AlertTriangle, CheckCircle, Loader2, ShieldAlert } from 'lucide-react';
import useBackupStatus, { BackupStatus } from '@/hooks/useBackupStatus';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useBackupNotifications } from '@/hooks/useBackupNotifications'; // Importando o hook

const getStatusDetails = (status: BackupStatus) => {
  switch (status) {
    case 'healthy':
      return {
        label: 'Saudável',
        color: 'bg-green-500 hover:bg-green-600',
        icon: CheckCircle,
      };
    case 'warning':
      return {
        label: 'Atenção',
        color: 'bg-yellow-500 hover:bg-yellow-600 text-white',
        icon: AlertTriangle,
      };
    case 'critical':
      return {
        label: 'Crítico',
        color: 'bg-red-600 hover:bg-red-700',
        icon: ShieldAlert,
      };
  }
};

const BackupStatusWidget: React.FC = () => {
  const { 
    status: currentStatus, 
    timeSinceLastBackup, 
    lastBackup, 
    nextScheduled, 
    isBackingUp, 
    startBackup 
  } = useBackupStatus();
  const { showSuccessFeedback, showProgressNotification, dismissNotification } = useBackupNotifications();
  const [progressNotificationId, setProgressNotificationId] = useState<string | null>(null);

  const { label, color, icon: StatusIcon } = getStatusDetails(currentStatus);

  const formattedLastBackup = lastBackup 
    ? format(parseISO(lastBackup), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : 'N/A';

  const formattedNextScheduled = nextScheduled 
    ? format(parseISO(nextScheduled), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : 'N/A';

  const handleManualBackup = async () => {
    const id = showProgressNotification('Backup em Andamento', 'Realizando backup manual...');
    setProgressNotificationId(id);
    try {
      await startBackup();
      showSuccessFeedback('Backup Concluído!', 'O backup manual foi realizado com sucesso.');
    } catch (error) {
      // Erros do startBackup são tratados pelo useBackupMonitoring ou pelo QuickBackupPanel
      // Este widget apenas mostra o progresso e sucesso do backup manual
      console.error("Erro ao iniciar backup manual:", error);
    } finally {
      if (progressNotificationId) dismissNotification(progressNotificationId);
      setProgressNotificationId(null);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Status do Backup
        </CardTitle>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={cn("text-sm font-medium", color)}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Status baseado no tempo desde o último backup.</p>
          </TooltipContent>
        </Tooltip>
      </CardHeader>
      
      <CardContent className="flex-grow space-y-4 pt-4">
        {/* Alerta de Pendência - REMOVIDO, AGORA GERENCIADO POR BackupAlerts/useBackupMonitoring */}

        {/* Informações de Tempo */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Último Backup:</span>
            <span className="font-medium">{formattedLastBackup}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tempo Decorrido:</span>
            <span className={cn("font-medium", currentStatus === 'critical' && 'text-destructive')}>{timeSinceLastBackup}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Próximo Agendado:</span>
            <span className="font-medium">{formattedNextScheduled}</span>
          </div>
        </div>

        {/* Botão de Ação */}
        <Button 
          onClick={handleManualBackup} 
          disabled={isBackingUp || !!progressNotificationId}
          className="w-full bg-primary hover:bg-primary/90 mt-4"
        >
          {isBackingUp || !!progressNotificationId ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fazendo Backup...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Backup Agora
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BackupStatusWidget;