import React from 'react';
import { Outlet } from 'react-router-dom';
// import BackupAlerts from '@/components/BackupAlerts'; // Removido
// import { useBackupMonitoring } from '@/hooks/useBackupMonitoring'; // Removido

const DocumentLayout: React.FC = () => {
  // Mantém o monitoramento de backup ativo, mas o layout é minimalista
  // useBackupMonitoring(); // Removido

  return (
    <div className="min-h-screen bg-white text-foreground p-0 print:p-0">
      {/* O Outlet renderizará o documento (ex: StudentTranscript) */}
      <Outlet />
      {/* Mantém os alertas de backup flutuantes */}
      {/* <BackupAlerts /> */} {/* Removido */}
    </div>
  );
};

export default DocumentLayout;