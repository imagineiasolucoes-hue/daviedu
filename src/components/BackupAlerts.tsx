import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ShieldAlert, AlertTriangle, Info, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import useBackupStatus, { BackupStatus } from '@/hooks/useBackupStatus';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Alert, AlertType } from '@/types/alerts'; // Importando os tipos definidos

interface BackupAlertsProps {
  maxAlerts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoDismissDelay?: number; // segundos
}

const LOCAL_STORAGE_KEY = 'backup_alerts';

const BackupAlerts: React.FC<BackupAlertsProps> = ({
  maxAlerts = 5,
  position = 'bottom-right',
  autoDismissDelay = 10, // 10 segundos
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { status: backupStatus, lastBackup, nextScheduled, isBackingUp, startBackup } = useBackupStatus();
  const lastBackupRef = useRef(lastBackup); // Para detectar mudanças em lastBackup para o alerta "Backup concluído"

  const addAlert = useCallback((newAlert: Omit<Alert, 'id' | 'timestamp'>) => {
    setAlerts((prevAlerts) => {
      // Previne alertas críticos/de aviso duplicados com a mesma mensagem
      if (newAlert.type !== 'info' && prevAlerts.some(
        (a) => a.type === newAlert.type && a.message === newAlert.message
      )) {
        return prevAlerts;
      }
      // Previne múltiplos alertas "Backup em Andamento"
      if (newAlert.type === 'info' && newAlert.title === 'Backup em Andamento' && prevAlerts.some(a => a.title === 'Backup em Andamento')) {
        return prevAlerts;
      }
      // Previne múltiplos alertas "Backup Programado"
      if (newAlert.type === 'info' && newAlert.title === 'Backup Programado' && prevAlerts.some(a => a.title === 'Backup Programado')) {
        return prevAlerts;
      }
      // Previne múltiplos alertas "Backup Concluído"
      if (newAlert.type === 'info' && newAlert.title === 'Backup Concluído!' && prevAlerts.some(a => a.title === 'Backup Concluído!')) {
        return prevAlerts;
      }
      return [...prevAlerts, { ...newAlert, id: crypto.randomUUID(), timestamp: new Date() }];
    });
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== id));
  }, []);

  // Efeito para lidar com o auto-dismissal
  useEffect(() => {
    alerts.forEach((alert) => {
      if (alert.autoDismiss && alert.autoDismiss > 0) {
        const timer = setTimeout(() => {
          removeAlert(alert.id);
        }, alert.autoDismiss * 1000);
        return () => clearTimeout(timer);
      }
    });
  }, [alerts, removeAlert]);

  // Efeito para reagir às mudanças no status do backup e gerar alertas
  useEffect(() => {
    // Alerta Crítico: Backup > 48h ou nunca
    if (backupStatus === 'critical') {
      addAlert({
        type: 'critical',
        title: 'Backup Crítico!',
        message: lastBackup ? `Último backup há mais de 48 horas (${format(parseISO(lastBackup), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })})` : 'Nenhum backup realizado ainda.',
        action: { label: 'Fazer Backup Urgente', onClick: startBackup },
      });
    } else {
      // Descarta alertas críticos se o status não for mais crítico
      setAlerts(prev => prev.filter(a => a.type !== 'critical'));
    }

    // Alerta de Aviso: Backup > 24h e < 48h
    if (backupStatus === 'warning') {
      addAlert({
        type: 'warning',
        title: 'Backup Recomendado',
        message: `Último backup há mais de 24 horas (${format(parseISO(lastBackup!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}).`,
        action: { label: 'Fazer Backup', onClick: startBackup },
        autoDismiss: autoDismissDelay,
      });
    } else {
      // Descarta alertas de aviso se o status não for mais de aviso
      setAlerts(prev => prev.filter(a => a.type !== 'warning'));
    }

    // Alerta de Informação: Próximo Agendado (apenas se não for crítico/aviso)
    if (backupStatus === 'healthy' && nextScheduled) {
      addAlert({
        type: 'info',
        title: 'Backup Programado',
        message: `Próximo backup agendado para ${format(parseISO(nextScheduled), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`,
        action: { label: 'Visualizar Agenda', onClick: () => console.log('Visualizar agenda clicado') }, // Ação placeholder
        autoDismiss: autoDismissDelay,
      });
    } else {
        // Descarta alertas de "Backup Programado" se o status não for saudável ou não houver próximo agendamento
        setAlerts(prev => prev.filter(a => !(a.type === 'info' && a.title === 'Backup Programado')));
    }

    // Alerta de Informação: Backup em andamento
    if (isBackingUp) {
      addAlert({
        type: 'info',
        title: 'Backup em Andamento',
        message: 'Seu backup está sendo processado...',
        autoDismiss: 0, // Não auto-descarta
      });
    } else {
      // Descarta o alerta "Backup em Andamento"
      setAlerts(prev => prev.filter(a => !(a.type === 'info' && a.title === 'Backup em Andamento')));
    }

    // Alerta de Informação: Backup concluído (acionado quando lastBackup muda e isBackingUp se torna falso)
    if (lastBackupRef.current !== lastBackup && !isBackingUp && lastBackupRef.current !== null) {
        addAlert({
            type: 'info',
            title: 'Backup Concluído!',
            message: `Backup realizado com sucesso em ${format(parseISO(lastBackup!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`,
            autoDismiss: autoDismissDelay,
        });
    }
    lastBackupRef.current = lastBackup; // Atualiza a referência

  }, [backupStatus, lastBackup, nextScheduled, isBackingUp, addAlert, autoDismissDelay, startBackup]);

  // Efeito para persistência no localStorage
  useEffect(() => {
    try {
      const serialisedState = JSON.stringify(alerts.filter(a => a.type === 'critical' || a.type === 'warning').map(alert => ({
        ...alert,
        timestamp: alert.timestamp.toISOString(), // Converte Date para string para armazenamento
        action: alert.action ? { label: alert.action.label } : undefined, // Armazena apenas o label, onClick não pode ser serializado
      })));
      localStorage.setItem(LOCAL_STORAGE_KEY, serialisedState);
    } catch (e) {
      console.warn("Não foi possível salvar os alertas no localStorage", e);
    }
  }, [alerts]);

  // Efeito para carregar alertas do localStorage na montagem
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const storedAlerts: Alert[] = JSON.parse(raw).map((alert: any) => {
          const restoredAlert: Alert = {
            ...alert,
            timestamp: new Date(alert.timestamp),
          };
          // Re-anexa onClick para alertas críticos/de aviso
          if (restoredAlert.action) {
            restoredAlert.action.onClick = startBackup; // Re-anexa a função startBackup
          }
          return restoredAlert;
        });
        // Filtra alertas que já deveriam ter sido auto-descartados ou que não são persistentes
        const now = new Date();
        const filteredStoredAlerts = storedAlerts.filter(a => 
            (a.type === 'critical' || a.type === 'warning') && 
            (!a.autoDismiss || (now.getTime() - a.timestamp.getTime()) / 1000 < a.autoDismiss * 1000) // Multiplica por 1000 para segundos
        );
        setAlerts(filteredStoredAlerts);
      }
    } catch (e) {
      console.warn("Não foi possível carregar os alertas do localStorage", e);
    }
  }, [startBackup]);

  const positionClasses = {
    'top-right': 'top-4 right-4 items-end',
    'top-left': 'top-4 left-4 items-start',
    'bottom-right': 'bottom-4 right-4 items-end',
    'bottom-left': 'bottom-4 left-4 items-start',
  };

  const getIcon = (type: AlertType) => {
    switch (type) {
      case 'critical': return <ShieldAlert className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info': return <Info className="h-5 w-5 text-blue-600" />;
      default: return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getBorderColor = (type: AlertType) => {
    switch (type) {
      case 'critical': return 'border-red-500';
      case 'warning': return 'border-yellow-500';
      case 'info': return 'border-blue-500';
      default: return 'border-gray-300';
    }
  };

  const getBgColor = (type: AlertType) => {
    switch (type) {
      case 'critical': return 'bg-red-50 dark:bg-red-950/30';
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-950/30';
      case 'info': return 'bg-blue-50 dark:bg-blue-950/30';
      default: return 'bg-gray-50 dark:bg-gray-950/30';
    }
  };

  return (
    <div className={cn(
      "fixed z-[9999] flex flex-col gap-3 max-h-[90vh] w-full max-w-sm p-4 pointer-events-none",
      positionClasses[position]
    )}>
      <div className="flex items-center justify-between mb-2 pointer-events-auto">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Alertas de Backup
          {alerts.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary rounded-full">
              {alerts.length}
            </span>
          )}
        </h3>
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar">
        {alerts.slice(0, maxAlerts).map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "relative flex items-start gap-3 p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 ease-out transform opacity-100 translate-y-0 pointer-events-auto",
              getBgColor(alert.type),
              getBorderColor(alert.type)
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(alert.type)}
            </div>
            <div className="flex-grow">
              <p className="font-semibold text-foreground">{alert.title}</p>
              <p className="text-sm text-muted-foreground">{alert.message}</p>
              {alert.action && (
                <button
                  onClick={alert.action.onClick}
                  className="mt-2 text-sm font-medium text-primary hover:underline"
                >
                  {alert.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => removeAlert(alert.id)}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BackupAlerts;