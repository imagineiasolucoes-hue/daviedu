import React from 'react';
import { Outlet } from 'react-router-dom';
import BackupAlerts from '@/components/BackupAlerts';
import { useBackupMonitoring } from '@/hooks/useBackupMonitoring';

const DocumentLayout: React.FC = () => {
  // Mantém o monitoramento de backup ativo, mas o layout é minimalista
  useBackupMonitoring(); 

  return (
    <div className="min-h-screen bg-white text-foreground p-0 print:p-0">
      {/* O Outlet renderizará o documento (ex: StudentTranscript) */}
      <Outlet />
      {/* Mantém os alertas de backup flutuantes */}
      <BackupAlerts />
    </div>
  );
};

export default DocumentLayout;