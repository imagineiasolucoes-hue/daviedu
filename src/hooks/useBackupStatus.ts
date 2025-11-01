import { useState, useEffect, useMemo } from 'react';
import { differenceInHours, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type BackupStatus = 'healthy' | 'warning' | 'critical';

interface BackupData {
  lastBackup: string | null; // ISO string
  nextScheduled: string | null; // ISO string
}

interface BackupState extends BackupData {
  status: BackupStatus;
  timeSinceLastBackup: string;
  isBackingUp: boolean;
  startBackup: () => Promise<void>;
}

// Mock Data Inicial
const MOCK_DATA: BackupData = {
  // Exemplo: 10 horas atrás (Healthy)
  lastBackup: new Date(Date.now() - 10 * 3600 * 1000).toISOString(), 
  nextScheduled: new Date(Date.now() + 16 * 3600 * 1000).toISOString(),
};

const useBackupStatus = (initialData: BackupData = MOCK_DATA): BackupState => {
  const [data, setData] = useState<BackupData>(initialData);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Atualiza o tempo a cada minuto para manter o status preciso
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); 
    return () => clearInterval(interval);
  }, []);

  const { status, timeSinceLastBackup } = useMemo(() => {
    if (!data.lastBackup) {
      return { status: 'critical' as BackupStatus, timeSinceLastBackup: 'Nunca realizado' };
    }

    const lastBackupDate = parseISO(data.lastBackup);
    const hoursSince = differenceInHours(currentTime, lastBackupDate);

    let status: BackupStatus;
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

    return { status, timeSinceLastBackup: timeSince };
  }, [data.lastBackup, currentTime]);

  const startBackup = async () => {
    if (isBackingUp) return;
    setIsBackingUp(true);
    
    // Simulação de chamada de API
    await new Promise(resolve => setTimeout(resolve, 3000)); 

    // Atualiza o último backup para o momento atual
    setData(prev => ({
        ...prev,
        lastBackup: new Date().toISOString(),
        // Simula o agendamento do próximo backup para 12 horas no futuro
        nextScheduled: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    }));

    setIsBackingUp(false);
  };

  return {
    ...data,
    status,
    timeSinceLastBackup,
    isBackingUp,
    startBackup,
  };
};

export default useBackupStatus;