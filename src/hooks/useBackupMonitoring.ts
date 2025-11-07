import { useEffect, useCallback, useRef } from 'react';
import useBackupStatus from './useBackupStatus'; // Para o status do tenant atual
import useGlobalBackupStatus from './useGlobalBackupStatus'; // NOVO IMPORT para o status global
import { useProfile } from './useProfile'; // NOVO IMPORT para verificar se é Super Admin
import { format, parseISO, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const useBackupMonitoring = () => {
  const { profile, isSuperAdmin } = useProfile();

  // Monitoramento para o tenant atual
  const {
    status: tenantBackupStatus,
    lastBackup: lastTenantBackup,
    isBackingUp: isTenantBackingUp,
    startBackup: startTenantBackup,
  } = useBackupStatus();

  // Monitoramento para o status global (apenas para Super Admin)
  const {
    overallStatus: globalBackupStatus,
    lastCodeBackup,
    isGlobalBackingUp,
    startFullGlobalBackup,
  } = useGlobalBackupStatus();

  // Refs para controlar se um alerta específico já foi mostrado para evitar duplicação
  const criticalTenantAlertShownRef = useRef(false);
  const warningTenantAlertShownRef = useRef(false);
  const progressTenantNotificationIdRef = useRef<string | null>(null);
  const lastTenantBackupRef = useRef(lastTenantBackup);

  const criticalGlobalAlertShownRef = useRef(false); 
  const warningGlobalAlertShownRef = useRef(false); 
  const progressGlobalNotificationIdRef = useRef<string | null>(null); 
  const lastGlobalBackupRef = useRef(lastCodeBackup); 

  // Efeito para lidar com alertas proativos baseados no status do backup do TENANT
  useEffect(() => {
    if (!profile?.tenant_id) return; 

    // A lógica de exibição de alertas proativos foi removida para simplificar,
    // mas os refs e a lógica de monitoramento de status permanecem para uso futuro.

    // Atualiza a referência do último backup
    lastTenantBackupRef.current = lastTenantBackup;

  }, [profile?.tenant_id, tenantBackupStatus, lastTenantBackup, isTenantBackingUp, startTenantBackup]); 

  // Efeito para lidar com alertas proativos baseados no status do backup GLOBAL (apenas para Super Admin)
  useEffect(() => {
    if (!isSuperAdmin) return;

    // A lógica de exibição de alertas proativos foi removida para simplificar.

    // Atualiza a referência do último backup global
    lastGlobalBackupRef.current = lastCodeBackup;

  }, [isSuperAdmin, globalBackupStatus, lastCodeBackup, isGlobalBackingUp, startFullGlobalBackup]); 
};