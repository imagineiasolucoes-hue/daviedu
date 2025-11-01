import React from 'react';
import BackupStatusWidget from '@/components/dashboard/BackupStatusWidget';
import QuickBackupPanel from '@/components/backup/QuickBackupPanel';
import GlobalBackupStatusWidget from '@/components/backup/GlobalBackupStatusWidget';
import GlobalQuickBackupPanel from '@/components/backup/GlobalQuickBackupPanel';
import { Loader2, HardDrive, School, Users } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns'; // Adicionado parseISO
import { ptBR } from 'date-fns/locale';
import useAllTenantsBackupStatus from '@/hooks/useAllTenantsBackupStatus';
import { useBackupNotifications } from '@/hooks/useBackupNotifications';

const BackupDashboard: React.FC = () => {
  const { profile, isLoading: isProfileLoading, isSuperAdmin, isSchoolUser } = useProfile();
  const { tenantsSummary, overallTenantsStatus, isLoading: isLoadingAllTenantsBackup, startBackupAllTenants } = useAllTenantsBackupStatus();
  const { showSuccessFeedback, showEmergencyAlert, showProgressNotification, dismissNotification } = useBackupNotifications();
  const [backupAllTenantsProgressId, setBackupAllTenantsProgressId] = React.useState<string | null>(null);

  // Mock data e handlers para o QuickBackupPanel (tenant-specific)
  const mockDiskUsage = {
    used: 750,
    total: 1024,
    percent: (750 / 1024) * 100,
  };

  const handleQuickBackupTenant = async () => {
    console.log("Executando backup completo do tenant atual...");
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simula API call
  };

  const handleSelectiveBackupTenant = async (type: 'database' | 'files' | 'code') => {
    console.log(`Executando backup seletivo do tenant atual: ${type}...`);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simula API call
  };

  const handleEmergencyRestoreTenant = async () => {
    console.log("Executando restauração de emergência do tenant atual...");
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simula API call
  };

  const handleBackupAllTenants = async () => {
    const id = showProgressNotification('Backup de Todos os Tenants em Andamento', 'Iniciando backup para todas as escolas...');
    setBackupAllTenantsProgressId(id);
    try {
      await startBackupAllTenants();
      showSuccessFeedback('Backup de Todos os Tenants Concluído!', 'O backup para todas as escolas foi realizado com sucesso.');
    } catch (error) {
      showEmergencyAlert({
        title: 'Falha no Backup de Todos os Tenants',
        message: (error as Error).message || 'Não foi possível completar o backup para todas as escolas.',
        actions: [
          { label: 'Tentar Novamente', onClick: handleBackupAllTenants },
        ],
      });
    } finally {
      if (backupAllTenantsProgressId) dismissNotification(backupAllTenantsProgressId);
      setBackupAllTenantsProgressId(null);
    }
  };

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isSuperAdmin) {
    const getTenantStatusBadge = (status: string) => {
      switch (status) {
        case 'healthy': return <Badge className="bg-green-500 hover:bg-green-600">Saudável</Badge>;
        case 'warning': return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Atenção</Badge>;
        case 'critical': return <Badge variant="destructive">Crítico</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
      }
    };

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <HardDrive className="h-8 w-8 text-primary" />
          Sistema de Backup (Super Administrador)
        </h1>
        
        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:flex">
            <TabsTrigger value="global">
              <HardDrive className="h-4 w-4 mr-2" />
              Backup Global
            </TabsTrigger>
            <TabsTrigger value="tenants">
              <School className="h-4 w-4 mr-2" />
              Backups por Escola
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="mt-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <GlobalBackupStatusWidget />
              <div className="lg:col-span-2">
                <GlobalQuickBackupPanel />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tenants" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <School className="h-5 w-5 text-primary" />
                  Status Consolidado dos Backups por Escola
                </CardTitle>
                <Badge className={
                  overallTenantsStatus === 'healthy' ? 'bg-green-500' :
                  overallTenantsStatus === 'warning' ? 'bg-yellow-500 text-white' :
                  'bg-red-600'
                }>
                  {overallTenantsStatus === 'healthy' ? 'Todas Saudáveis' :
                   overallTenantsStatus === 'warning' ? 'Com Avisos' :
                   'Com Críticos'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <QuickBackupPanel
                    onQuickBackup={handleQuickBackupTenant} // Placeholder, pois o botão será para todos os tenants
                    onSelectiveBackup={handleSelectiveBackupTenant} // Placeholder
                    onEmergencyRestore={handleEmergencyRestoreTenant} // Placeholder
                    diskUsage={mockDiskUsage} // Placeholder
                    isSuperAdmin={true} // Habilita o botão de backup de todos os tenants
                    onBackupAllTenants={handleBackupAllTenants}
                  />
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Escola</TableHead>
                        <TableHead>Último Backup</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingAllTenantsBackup ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                            Carregando status dos tenants...
                          </TableCell>
                        </TableRow>
                      ) : (
                        tenantsSummary.map((tenant) => (
                          <TableRow key={tenant.tenantId}>
                            <TableCell className="font-medium">{tenant.tenantName}</TableCell>
                            <TableCell>
                              {tenant.lastBackup ? format(parseISO(tenant.lastBackup), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Nunca'}
                            </TableCell>
                            <TableCell>{getTenantStatusBadge(tenant.status)}</TableCell>
                            <TableCell className="text-right">
                              {/* Ações específicas por tenant para Super Admin */}
                              <Users className="h-4 w-4 text-muted-foreground inline-block" /> {/* Exemplo de ícone de ação */}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {tenantsSummary.length === 0 && !isLoadingAllTenantsBackup && (
                  <p className="text-center py-8 text-muted-foreground">Nenhuma escola encontrada.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
            onQuickBackup={handleQuickBackupTenant}
            onSelectiveBackup={handleSelectiveBackupTenant}
            onEmergencyRestore={handleEmergencyRestoreTenant}
            diskUsage={mockDiskUsage}
            isSuperAdmin={false} // Não é Super Admin
          />
        </div>
      </div>
    </div>
  );
};

export default BackupDashboard;