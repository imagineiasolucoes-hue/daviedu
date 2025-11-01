import { useState, useEffect, useMemo } from 'react';
import { differenceInHours, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type GlobalBackupStatus = 'healthy' | 'warning' | 'critical';

interface GlobalBackupData {
  lastCodeBackup: string | null; // ISO string
  lastSchemaBackup: string | null; // ISO string
  lastConfigBackup: string | null; // ISO string
  nextScheduledGlobal: string | null; // ISO string
}

interface GlobalBackupState extends GlobalBackupData {
  overallStatus: GlobalBackupStatus;
  timeSinceLastGlobalBackup: string;
  isGlobalBackingUp: boolean;
  startGlobalCodeBackup: () => Promise<void>;
  startGlobalSchemaBackup: () => Promise<void>;
  startGlobalConfigBackup: () => Promise<void>;
  startFullGlobalBackup: () => Promise<void>;
}

// Mock Data Inicial para o backup global
const MOCK_GLOBAL_DATA: GlobalBackupData = {
  lastCodeBackup: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), // 12 horas atrás
  lastSchemaBackup: new Date(Date.now() - 18 * 3600 * 1000).toISOString(), // 18 horas atrás
  lastConfigBackup: new Date(Date.now() - 20 * 3600 * 1000).toISOString(), // 20 horas atrás
  nextScheduledGlobal: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), // 24 horas no futuro
};

const useGlobalBackupStatus = (initialData: GlobalBackupData = MOCK_GLOBAL_DATA): GlobalBackupState => {
  const [data, setData] = useState<GlobalBackupData>(initialData);
  const [isGlobalBackingUp, setIsGlobalBackingUp] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Atualiza a cada minuto
    return () => clearInterval(interval);
  }, []);

  const { overallStatus, timeSinceLastGlobalBackup } = useMemo(() => {
    const allBackupTimes = [
      data.lastCodeBackup,
      data.lastSchemaBackup,
      data.lastConfigBackup,
    ].filter(Boolean).map(iso => parseISO(iso!));

    if (allBackupTimes.length === 0) {
      return { overallStatus: 'critical' as GlobalBackupStatus, timeSinceLastGlobalBackup: 'Nunca realizado' };
    }

    const oldestBackupDate = new Date(Math.min(...allBackupTimes.map(date => date.getTime())));
    const hoursSince = differenceInHours(currentTime, oldestBackupDate);

    let status: GlobalBackupStatus;
    let timeSince: string;

    if (hoursSince < 24) {
      status = 'healthy';
      timeSince = `Há ${hoursSince} horas`;
    } else if (hoursSince >= 24 && hoursSince < 48) {
      status = 'warning';
      timeSince = `Há ${hoursSince} horas`;
    } else {
      status = 'critical';
      timeSince = `Há mais de 48 horas (${hoursSince}h)`;
    }

    return { overallStatus: status, timeSinceLastGlobalBackup: timeSince };
  }, [data, currentTime]);

  const simulateBackup = async (type: keyof GlobalBackupData) => {
    setIsGlobalBackingUp(true);
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simula API call
    setData(prev => ({
      ...prev,
      [type]: new Date().toISOString(),
      nextScheduledGlobal: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), // Reschedule
    }));
    setIsGlobalBackingUp(false);
  };

  const startGlobalCodeBackup = () => simulateBackup('lastCodeBackup');
  const startGlobalSchemaBackup = () => simulateBackup('lastSchemaBackup');
  const startGlobalConfigBackup = () => simulateBackup('lastConfigBackup');
  
  const startFullGlobalBackup = async () => {
    setIsGlobalBackingUp(true);
    await new Promise(resolve => setTimeout(resolve, 5000)); // Simula API call
    const now = new Date().toISOString();
    setData(prev => ({
      ...prev,
      lastCodeBackup: now,
      lastSchemaBackup: now,
      lastConfigBackup: now,
      nextScheduledGlobal: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    }));
    setIsGlobalBackingUp(false);
  };

  return {
    ...data,
    overallStatus,
    timeSinceLastGlobalBackup,
    isGlobalBackingUp,
    startGlobalCodeBackup,
    startGlobalSchemaBackup,
    startGlobalConfigBackup,
    startFullGlobalBackup,
  };
};

export default useGlobalBackupStatus;