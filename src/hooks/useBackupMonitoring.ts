import { useEffect, useCallback, useRef } from 'react';
import { useBackupNotifications } from './useBackupNotifications';
import useBackupStatus from './useBackupStatus';
import { format, parseISO, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const useBackupMonitoring = () => {
  const {
    status: backupStatus,
    lastBackup,
    nextScheduled,
    isBackingUp,
    startBackup,
  } = useBackupStatus();
  const { showBackupReminder, showEmergencyAlert, showProgressNotification, showSuccessFeedback, dismissNotification } = useBackupNotifications();

  // Refs para controlar se um alerta específico já foi mostrado para evitar duplicação
  const criticalAlertShownRef = useRef(false);
  const warningAlertShownRef = useRef(false);
  const progressNotificationIdRef = useRef<string | null>(null);
  const lastBackupRef = useRef(lastBackup); // Para detectar mudanças em lastBackup para o alerta "Backup concluído"

  // Efeito para lidar com alertas proativos baseados no status do backup
  useEffect(() => {
    // Alerta Crítico: Backup > 48h ou nunca
    if (backupStatus === 'critical' && !criticalAlertShownRef.current) {
      const message = lastBackup
        ? `Último backup há mais de 48 horas (${format(parseISO(lastBackup), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}).`
        : 'Nenhum backup realizado ainda. Faça um backup imediatamente!';
      showEmergencyAlert({
        title: 'Backup Crítico!',
        message: message,
        actions: [
          { label: 'Fazer Backup Urgente', onClick: startBackup },
        ],
      });
      criticalAlertShownRef.current = true;
    } else if (backupStatus !== 'critical' && criticalAlertShownRef.current) {
      // Se o status não for mais crítico, resetar o flag
      criticalAlertShownRef.current = false;
      // Poderíamos adicionar lógica para dispensar o alerta crítico aqui se ele fosse um modal específico
      // Por enquanto, o modal de emergência não é auto-dispensável.
    }

    // Alerta de Aviso: Backup > 24h e < 48h
    if (backupStatus === 'warning' && !warningAlertShownRef.current) {
      const message = `Último backup há mais de 24 horas (${format(parseISO(lastBackup!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}). Considere executar um backup manual.`;
      showBackupReminder(message, [
        { label: 'Fazer Backup', onClick: startBackup },
      ]);
      warningAlertShownRef.current = true;
    } else if (backupStatus !== 'warning' && warningAlertShownRef.current) {
      warningAlertShownRef.current = false;
    }

    // Alerta de Informação: Backup em andamento
    if (isBackingUp && !progressNotificationIdRef.current) {
      const id = showProgressNotification('Backup em Andamento', 'Seu backup está sendo processado...');
      progressNotificationIdRef.current = id;
    } else if (!isBackingUp && progressNotificationIdRef.current) {
      // Se o backup não está mais em andamento, dispensar a notificação de progresso
      dismissNotification(progressNotificationIdRef.current);
      progressNotificationIdRef.current = null;
    }

    // Alerta de Informação: Backup concluído (acionado quando lastBackup muda e isBackingUp se torna falso)
    if (lastBackupRef.current !== lastBackup && !isBackingUp && lastBackupRef.current !== null) {
        showSuccessFeedback('Backup Concluído!', `Backup realizado com sucesso em ${format(parseISO(lastBackup!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`);
    }
    lastBackupRef.current = lastBackup; // Atualiza a referência para o próximo ciclo

  }, [backupStatus, lastBackup, nextScheduled, isBackingUp, startBackup, showBackupReminder, showEmergencyAlert, showProgressNotification, showSuccessFeedback, dismissNotification]);
};