import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Database, Code, Settings, ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';
import useGlobalBackupStatus, { GlobalBackupStatus } from '@/hooks/useGlobalBackupStatus';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const getStatusDetails = (status: GlobalBackupStatus) => {
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

const GlobalBackupStatusWidget: React.FC = () => {
  const {
    overallStatus,
    timeSinceLastGlobalBackup,
    lastCodeBackup,
    lastSchemaBackup,
    lastConfigBackup,
    nextScheduledGlobal,
    isGlobalBackingUp,
  } = useGlobalBackupStatus();

  const { label, color, icon: StatusIcon } = getStatusDetails(overallStatus);

  const formatBackupTime = (isoString: string | null) => 
    isoString ? format(parseISO(isoString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A';

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Status Global do Backup
        </CardTitle>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={cn("text-sm font-medium", color)}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Status consolidado dos backups globais (código, schema, config).</p>
          </TooltipContent>
        </Tooltip>
      </CardHeader>
      
      <CardContent className="flex-grow space-y-4 pt-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Último Backup de Código:</span>
            <span className="font-medium">{formatBackupTime(lastCodeBackup)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Último Backup de Schema:</span>
            <span className="font-medium">{formatBackupTime(lastSchemaBackup)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Último Backup de Config:</span>
            <span className="font-medium">{formatBackupTime(lastConfigBackup)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tempo Decorrido (mais antigo):</span>
            <span className={cn("font-medium", overallStatus === 'critical' && 'text-destructive')}>{timeSinceLastGlobalBackup}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Próximo Agendado:</span>
            <span className="font-medium">{formatBackupTime(nextScheduledGlobal)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlobalBackupStatusWidget;