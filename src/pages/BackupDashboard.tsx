import React from 'react';
import BackupStatusWidget from '@/components/dashboard/BackupStatusWidget';
import QuickBackupPanel from '@/components/backup/QuickBackupPanel';
import { Loader2, HardDrive } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const BackupDashboard: React.FC = () => {
  const { profile, isLoading: isProfileLoading, isSuperAdmin, isSchoolUser } = useProfile();

  // Mock data e handlers para o QuickBackupPanel
  const mockDiskUsage = {
    used: 750,
    total: 1024,
    percent: (750 / 1024) * 100,
  };

  const handleQuickBackup = async () => {
    console.log("Executando backup completo...");
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simula API call
  };

  const handleSelectiveBackup = async (type: 'database' | 'files' | 'code') => {
    console.log(`Executando backup seletivo: ${type}...`);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simula API call
  };

  const handleEmergencyRestore = async () => {
    console.log("Executando restauração de emergência...");
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simula API call
  };

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isSuperAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <HardDrive className="h-8 w-8 text-primary" />
          Sistema de Backup (Super Administrador)
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Visão Geral do Sistema de Backup</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Como Super Administrador, você pode monitorar e gerenciar backups de todas as escolas.
              Funcionalidades específicas para Super Admin serão adicionadas aqui.
            </p>
          </CardContent>
        </Card>
        {/* Adicionando os painéis de backup para Super Admin também */}
        <div className="grid gap-4 lg:grid-cols-3">
          <BackupStatusWidget />
          <div className="lg:col-span-2">
            <QuickBackupPanel
              onQuickBackup={handleQuickBackup}
              onSelectiveBackup={handleSelectiveBackup}
              onEmergencyRestore={handleEmergencyRestore}
              diskUsage={mockDiskUsage}
            />
          </div>
        </div>
      </div>
    );
  }
  
  if (!isSchoolUser) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <HardDrive className="h-8 w-8 text-primary" />
          Sistema de Backup
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Aguardando Ativação da Escola</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Seu perfil está ativo, mas ainda não está associado a uma escola (Tenant). 
              O acesso ao sistema de backup é liberado após a ativação da escola.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <HardDrive className="h-8 w-8 text-primary" />
        Sistema de Backup
      </h1>
      
      <div className="grid gap-4 lg:grid-cols-3">
        <BackupStatusWidget />
        <div className="lg:col-span-2">
          <QuickBackupPanel
            onQuickBackup={handleQuickBackup}
            onSelectiveBackup={handleSelectiveBackup}
            onEmergencyRestore={handleEmergencyRestore}
            diskUsage={mockDiskUsage}
          />
        </div>
      </div>
    </div>
  );
};

export default BackupDashboard;