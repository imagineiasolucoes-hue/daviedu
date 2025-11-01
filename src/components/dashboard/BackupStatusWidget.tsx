import React from 'react';
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

const getStatusDetails = (status: BackupStatus) => {
  switch (status) {
    case 'healthy':
      return {
        label: 'Saudável',
        color: 'bg-green-500 hover:bg-green-600',
        icon: CheckCircle,
        alert: null,
      };
    case 'warning':
      return {
        label: 'Atenção',
        color: 'bg-yellow-500 hover:bg-yellow-600 text-white',
        icon: AlertTriangle,
        alert: {
          title: 'Backup Pendente',
          description: 'O último backup foi realizado há mais de 24 horas. Considere executar um backup manual.',
        },
      };
    case 'critical':
      return {
        label: 'Crítico',
        color: 'bg-red-600 hover:bg-red-700',
        icon: ShieldAlert,
        alert: {
          title: 'Risco de Perda de Dados',
          description: 'O backup está desatualizado (> 48h) ou nunca foi realizado. Faça um backup imediatamente!',
        },
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

  const { label, color, icon: StatusIcon, alert } = getStatusDetails(currentStatus);

  const formattedLastBackup = lastBackup 
    ? format(parseISO(lastBackup), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : 'N/A';

  const formattedNextScheduled = nextScheduled 
    ? format(parseISO(nextScheduled), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : 'N/A';

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
        {/* Alerta de Pendência */}
        {alert && (
          <Alert variant="destructive" className="border-l-4 border-red-500">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        )}

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
          onClick={startBackup} 
          disabled={isBackingUp}
          className="w-full bg-primary hover:bg-primary/90 mt-4"
        >
          {isBackingUp ? (
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