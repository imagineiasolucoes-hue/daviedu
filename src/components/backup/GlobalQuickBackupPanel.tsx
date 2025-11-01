import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Zap, Database, Code, Settings, AlertTriangle, Loader2, ChevronDown, RefreshCcw } from 'lucide-react';
import { useBackupNotifications } from '@/hooks/useBackupNotifications';
import useGlobalBackupStatus from '@/hooks/useGlobalBackupStatus';

type GlobalSelectiveBackupType = 'code' | 'schema' | 'config';

const GlobalQuickBackupPanel: React.FC = () => {
  const {
    isGlobalBackingUp,
    startGlobalCodeBackup,
    startGlobalSchemaBackup,
    startGlobalConfigBackup,
    startFullGlobalBackup,
  } = useGlobalBackupStatus();
  const { showSuccessFeedback, showEmergencyAlert, showProgressNotification, dismissNotification } = useBackupNotifications();
  const [progressNotificationId, setProgressNotificationId] = useState<string | null>(null);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false); // Para restauração global

  const handleFullGlobalBackup = async () => {
    const id = showProgressNotification('Backup Global em Andamento', 'Realizando backup completo do sistema SaaS...');
    setProgressNotificationId(id);
    try {
      await startFullGlobalBackup();
      showSuccessFeedback('Backup Global Concluído!', 'O backup completo do sistema SaaS foi realizado com sucesso.');
    } catch (error) {
      showEmergencyAlert({
        title: 'Falha no Backup Global Completo',
        message: (error as Error).message || 'Não foi possível completar o backup global completo.',
        actions: [
          { label: 'Tentar Novamente', onClick: handleFullGlobalBackup },
        ],
      });
    } finally {
      if (progressNotificationId) dismissNotification(progressNotificationId);
      setProgressNotificationId(null);
    }
  };

  const handleGlobalSelectiveBackup = async (type: GlobalSelectiveBackupType) => {
    const id = showProgressNotification('Backup Seletivo Global em Andamento', `Realizando backup seletivo global de ${type}...`);
    setProgressNotificationId(id);
    try {
      switch (type) {
        case 'code': await startGlobalCodeBackup(); break;
        case 'schema': await startGlobalSchemaBackup(); break;
        case 'config': await startGlobalConfigBackup(); break;
      }
      showSuccessFeedback('Backup Seletivo Global Concluído!', `O backup global de ${type} foi realizado com sucesso.`);
    } catch (error) {
      showEmergencyAlert({
        title: `Falha no Backup Seletivo Global (${type})`,
        message: (error as Error).message || `Não foi possível completar o backup seletivo global de ${type}.`,
        actions: [
          { label: 'Tentar Novamente', onClick: () => handleGlobalSelectiveBackup(type) },
        ],
      });
    } finally {
      if (progressNotificationId) dismissNotification(progressNotificationId);
      setProgressNotificationId(null);
    }
  };

  const handleGlobalEmergencyRestore = async () => {
    // Simulação de restauração global
    const id = showProgressNotification('Restauração Global em Andamento', 'Restaurando o sistema SaaS para o último backup estável...');
    setProgressNotificationId(id);
    try {
      await new Promise(resolve => setTimeout(resolve, 7000)); // Simula API call de restauração global
      showSuccessFeedback('Restauração Global Concluída!', 'O sistema SaaS foi restaurado com sucesso.');
    } catch (error) {
      showEmergencyAlert({
        title: 'Falha na Restauração Global',
        message: (error as Error).message || 'Não foi possível restaurar o sistema SaaS.',
        actions: [
          { label: 'Tentar Novamente', onClick: handleGlobalEmergencyRestore },
        ],
      });
    } finally {
      setIsRestoreConfirmOpen(false);
      if (progressNotificationId) dismissNotification(progressNotificationId);
      setProgressNotificationId(null);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <RefreshCcw className="h-5 w-5 text-primary" />
          Painel de Backup Global
        </CardTitle>
        <CardDescription>Gerencie a segurança dos dados e infraestrutura do sistema SaaS.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-6 pt-4">
        {/* 1. Backup Completo do Sistema */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" /> Backup Completo do Sistema
          </h3>
          <p className="text-sm text-muted-foreground">
            Crie um backup completo de todo o código, schema e configurações globais.
          </p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleFullGlobalBackup}
                  disabled={isGlobalBackingUp || !!progressNotificationId}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {isGlobalBackingUp ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  Backup Completo Global Agora
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Realiza um backup de todos os componentes globais do SaaS.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Separator />

        {/* 2. Backup Seletivo Global */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-green-600" /> Backup Seletivo Global
          </h3>
          <p className="text-sm text-muted-foreground">
            Escolha quais componentes globais você deseja fazer backup.
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isGlobalBackingUp || !!progressNotificationId} className="w-full">
                {isGlobalBackingUp ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Fazer Backup Seletivo Global
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleGlobalSelectiveBackup('code')} disabled={isGlobalBackingUp || !!progressNotificationId}>
                <Code className="mr-2 h-4 w-4" /> Código-Fonte
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGlobalSelectiveBackup('schema')} disabled={isGlobalBackingUp || !!progressNotificationId}>
                <Database className="mr-2 h-4 w-4" /> Schema do Banco
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGlobalSelectiveBackup('config')} disabled={isGlobalBackingUp || !!progressNotificationId}>
                <Settings className="mr-2 h-4 w-4" /> Configurações do Sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator />

        {/* 3. Emergência - Restore Global */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5 text-destructive" /> Restauração de Emergência Global
          </h3>
          <p className="text-sm text-muted-foreground">
            Restaura o sistema SaaS para o último backup estável. Use com extrema cautela!
          </p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  onClick={() => setIsRestoreConfirmOpen(true)}
                  disabled={isGlobalBackingUp || !!progressNotificationId}
                  className="w-full"
                >
                  {isGlobalBackingUp ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="mr-2 h-4 w-4" />
                  )}
                  Restaurar Último Backup Global
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Esta ação é irreversível e pode causar perda de dados recentes em todo o sistema SaaS.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>

      {/* Modal de Confirmação para Restauração Global */}
      <AlertDialog open={isRestoreConfirmOpen} onOpenChange={setIsRestoreConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" /> Confirmar Restauração de Emergência Global
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a restaurar o sistema SaaS para o último backup estável.
              <br /><br />
              <strong>Esta ação é irreversível e todos os dados inseridos após o último backup serão perdidos para TODOS os tenants.</strong>
              <br /><br />
              Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isGlobalBackingUp}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleGlobalEmergencyRestore}
              disabled={isGlobalBackingUp}
            >
              {isGlobalBackingUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Restauração Global
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default GlobalQuickBackupPanel;