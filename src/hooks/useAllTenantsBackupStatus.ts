import { useState, useEffect, useMemo } from 'react';
import { differenceInHours, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type TenantConsolidatedStatus = 'healthy' | 'warning' | 'critical';

interface TenantBackupSummary {
  tenantId: string;
  tenantName: string;
  lastBackup: string | null; // ISO string
  status: TenantConsolidatedStatus;
}

interface AllTenantsBackupState {
  tenantsSummary: TenantBackupSummary[];
  overallTenantsStatus: TenantConsolidatedStatus;
  isLoading: boolean;
  startBackupAllTenants: () => Promise<void>;
}

// Mock Data Inicial para o resumo de todos os tenants
const MOCK_TENANTS_SUMMARY: TenantBackupSummary[] = [
  {
    tenantId: 'tenant-1',
    tenantName: 'Escola Alpha',
    lastBackup: new Date(Date.now() - 10 * 3600 * 1000).toISOString(), // 10 horas atrás
    status: 'healthy',
  },
  {
    tenantId: 'tenant-2',
    tenantName: 'Colégio Beta',
    lastBackup: new Date(Date.now() - 28 * 3600 * 1000).toISOString(), // 28 horas atrás
    status: 'warning',
  },
  {
    tenantId: 'tenant-3',
    tenantName: 'Instituto Gama',
    lastBackup: new Date(Date.now() - 50 * 3600 * 1000).toISOString(), // 50 horas atrás
    status: 'critical',
  },
  {
    tenantId: 'tenant-4',
    tenantName: 'Academia Delta',
    lastBackup: null, // Nunca realizado
    status: 'critical',
  },
];

const useAllTenantsBackupStatus = (): AllTenantsBackupState => {
  const [tenantsSummary, setTenantsSummary] = useState<TenantBackupSummary[]>(MOCK_TENANTS_SUMMARY);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      // Recalcula o status de cada tenant a cada minuto
      setTenantsSummary(prevSummary => prevSummary.map(tenant => {
        if (!tenant.lastBackup) {
          return { ...tenant, status: 'critical' };
        }
        const lastBackupDate = parseISO(tenant.lastBackup);
        const hoursSince = differenceInHours(currentTime, lastBackupDate);
        let status: TenantConsolidatedStatus;
        if (hoursSince < 24) {
          status = 'healthy';
        } else if (hoursSince >= 24 && hoursSince < 48) {
          status = 'warning';
        } else {
          status = 'critical';
        }
        return { ...tenant, status };
      }));
    }, 60000); // Atualiza a cada minuto
    return () => clearInterval(interval);
  }, [currentTime]);

  const overallTenantsStatus = useMemo(() => {
    if (tenantsSummary.some(t => t.status === 'critical')) {
      return 'critical';
    }
    if (tenantsSummary.some(t => t.status === 'warning')) {
      return 'warning';
    }
    return 'healthy';
  }, [tenantsSummary]);

  const startBackupAllTenants = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 5000)); // Simula API call para todos os tenants
    const now = new Date().toISOString();
    setTenantsSummary(prevSummary => prevSummary.map(tenant => ({
      ...tenant,
      lastBackup: now,
      status: 'healthy',
    })));
    setIsLoading(false);
  };

  return {
    tenantsSummary,
    overallTenantsStatus,
    isLoading,
    startBackupAllTenants,
  };
};

export default useAllTenantsBackupStatus;