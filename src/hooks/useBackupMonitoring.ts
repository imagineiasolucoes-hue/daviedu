import { useEffect, useCallback, useRef } from 'react';
import { useBackupNotifications } from './useBackupNotifications';
import useBackupStatus from './useBackupStatus'; // Para o status do tenant atual
import useGlobalBackupStatus from './useGlobalBackupStatus'; // NOVO IMPORT para o status global
import { useProfile } from './useProfile'; // NOVO IMPORT para verificar se é Super Admin
import { format, parseISO, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const useBackupMonitoring = () => {
  const { profile, isSuperAdmin } = useProfile();

  // Monitoramento para o tenant atual (se não for Super Admin ou se for Super Admin mas quiser ver o status do tenant)
  const {
    status: tenantBackupStatus,
    lastBackup: lastTenantBackup,
    nextScheduled: nextTenantScheduled,
    isBackingUp: isTenantBackingUp,
    startBackup: startTenantBackup,
  } = useBackupStatus();

  // Monitoramento para o status global (apenas para Super Admin)
  const {
    overallStatus: globalBackupStatus,
    lastCodeBackup,
    lastSchemaBackup,
    lastConfigBackup,
    isGlobalBackingUp,
    startFullGlobalBackup,
  } = useGlobalBackupStatus();

  const { showBackupReminder, showEmergencyAlert, showProgressNotification, showSuccessFeedback, dismissNotification } = useBackupNotifications();

  // Refs para controlar se um alerta específico já foi mostrado para evitar duplicação
  const criticalTenantAlertShownRef = useRef(false);
  const warningTenantAlertShownRef = useRef(false);
  const progressTenantNotificationIdRef = useRef<string | null>(null);
  const lastTenantBackupRef = useRef(lastTenantBackup);

  const criticalGlobalAlertShownRef = useRef(false); // NOVO
  const warningGlobalAlertShownRef = useRef(false); // NOVO
  const progressGlobalNotificationIdRef = useRef<string | null>(null); // NOVO
  const lastGlobalBackupRef = useRef(lastCodeBackup); // Usar o backup de código como referência para o global

  // Efeito para lidar com alertas proativos baseados no status do backup do TENANT
  useEffect(() => {
    if (!profile?.tenant_id) return; // Apenas monitora se houver um tenant associado

    // Alerta Crítico: Backup > 48h ou nunca
    if (tenantBackupStatus === 'critical' && !criticalTenantAlertShownRef.current) {
      const message = lastTenantBackup
        ? `Último backup do tenant há mais de 48 horas (${format(parseISO(lastTenantBackup), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}).`
        : 'Nenhum backup do tenant realizado ainda. Faça um backup imediatamente!';
      showEmergencyAlert({
        title: 'Backup do Tenant Crítico!',
        message: message,
        actions: [
          { label: 'Fazer Backup Urgente', onClick: startTenantBackup },
        ],
      });
      criticalTenantAlertShownRef.current = true;
    } else if (tenantBackupStatus !== 'critical' && criticalTenantAlertShownRef.current) {
      criticalTenantAlertShownRef.current = false;
    }

    // Alerta de Aviso: Backup > 24h e < 48h
    if (tenantBackupStatus === 'warning' && !warningTenantAlertShownRef.current) {
      const message = `Último backup do tenant há mais de 24 horas (${format(parseISO(lastTenantBackup!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}). Considere executar um backup manual.`;
      showBackupReminder(message, [
        { label: 'Fazer Backup', onClick: startTenantBackup },
      ]);
      warningTenantAlertShownRef.current = true;
    } else if (tenantBackupStatus !== 'warning' && warningTenantAlertShownRef.current) {
      warningTenantAlertShownRef.current = false;
    }

    // Alerta de Informação: Backup em andamento
    if (isTenantBackingUp && !progressTenantNotificationIdRef.current) {
      const id = showProgressNotification('Backup do Tenant em Andamento', 'Seu backup está sendo processado...');
      progressTenantNotificationIdRef.current = id;
    } else if (!isTenantBackingUp && progressTenantNotificationIdRef.current) {
      dismissNotification(progressTenantNotificationIdRef.current);
      progressTenantNotificationIdRef.current = null;
    }

    // Alerta de Informação: Backup concluído (acionado quando lastTenantBackup muda e isTenantBackingUp se torna falso)
    if (lastTenantBackupRef.current !== lastTenantBackup && !isTenantBackingUp && lastTenantBackupRef.current !== null) {
        showSuccessFeedback('Backup do Tenant Concluído!', `Backup realizado com sucesso em ${format(parseISO(lastTenantBackup!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`);
    }
    lastTenantBackupRef.current = lastTenantBackup;

  }, [profile?.tenant_id, tenantBackupStatus, lastTenantBackup, isTenantBackingUp, startTenantBackup, showBackupReminder, showEmergencyAlert, showProgressNotification, showSuccessFeedback, dismissNotification]);

  // NOVO Efeito para lidar com alertas proativos baseados no status do backup GLOBAL (apenas para Super Admin)
  useEffect(() => {
    if (!isSuperAdmin) return;

    // Alerta Crítico Global
    if (globalBackupStatus === 'critical' && !criticalGlobalAlertShownRef.current) {
      const message = lastCodeBackup
        ? `Último backup global há mais de 48 horas (${format(parseISO(lastCodeBackup), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}).`
        : 'Nenhum backup global realizado ainda. Faça um backup completo imediatamente!';
      showEmergencyAlert({
        title: 'Backup Global Crítico!',
        message: message,
        actions: [
          { label: 'Fazer Backup Global Urgente', onClick: startFullGlobalBackup },
        ],
      });
      criticalGlobalAlertShownRef.current = true;
    } else if (globalBackupStatus !== 'critical' && criticalGlobalAlertShownRef.current) {
      criticalGlobalAlertShownRef.current = false;
    }

    // Alerta de Aviso Global
    if (globalBackupStatus === 'warning' && !warningGlobalAlertShownRef.current) {
      const message = `Último backup global há mais de 24 horas (${format(parseISO(lastCodeBackup!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}). Considere executar um backup global manual.`;
      showBackupReminder(message, [
        { label: 'Fazer Backup Global', onClick: startFullGlobalBackup },
      ]);
      warningGlobalAlertShownRef.current = true;
    } else if (globalBackupStatus !== 'warning' && warningGlobalAlertShownRef.current) {
      warningGlobalAlertShownRef.current = false;
    }

    // Alerta de Informação: Backup global em andamento
    if (isGlobalBackingUp && !progressGlobalNotificationIdRef.current) {
      const id = showProgressNotification('Backup Global em Andamento', 'Seu backup global está sendo processado...');
      progressGlobalNotificationIdRef.current = id;
    } else if (!isGlobalBackingUp && progressGlobalNotificationIdRef.current) {
      dismissNotification(progressGlobalNotificationIdRef.current);
      progressGlobalNotificationIdRef.current = null;
    }

    // Alerta de Informação: Backup global concluído
    if (lastGlobalBackupRef.current !== lastCodeBackup && !isGlobalBackingUp && lastGlobalBackupRef.current !== null) {
        showSuccessFeedback('Backup Global Concluído!', `Backup global realizado com sucesso em ${format(parseISO(lastCodeBackup!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`);
    }
    lastGlobalBackupRef.current = lastCodeBackup;

  }, [isSuperAdmin, globalBackupStatus, lastCodeBackup, isGlobalBackingUp, startFullGlobalBackup, showBackupReminder, showEmergencyAlert, showProgressNotification, showSuccessFeedback, dismissNotification]);
};