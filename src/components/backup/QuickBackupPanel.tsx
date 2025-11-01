import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Zap, Database, Folder, Code, HardDrive, AlertTriangle, Loader2, ChevronDown, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

type SelectiveBackupType = 'database' | 'files' | 'code';

interface DiskUsage {
  used: number;
  total: number;
  percent: number;
}

interface QuickBackupPanelProps {
  onQuickBackup: () => Promise<void>;
  onSelectiveBackup: (type: SelectiveBackupType) => Promise<void>;
  onEmergencyRestore: () => Promise<void>;
  diskUsage: DiskUsage;
}

const QuickBackupPanel: React.FC<QuickBackupPanelProps> = ({
  onQuickBackup,
  onSelectiveBackup,
  onEmergencyRestore,
  diskUsage,
}) => {
  const [isQuickBackupLoading, setIsQuickBackupLoading] = useState(false);
  const [isSelectiveBackupLoading, setIsSelectiveBackupLoading] = useState(false);
  const [isRestoreLoading, setIsRestoreLoading] = useState(false);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);

  const handleQuickBackup = async () => {
    setIsQuickBackupLoading(true);
    try {
      await onQuickBackup();
      toast.success("Backup Completo Concluído!", { description: "Todos os dados foram salvos com sucesso." });
    } catch (error) {
      toast.error("Erro no Backup Completo", { description: (error as Error).message });
    } finally {
      setIsQuickBackupLoading(false);
    }
  };

  const handleSelectiveBackup = async (type: SelectiveBackupType) => {
    setIsSelectiveBackupLoading(true);
    try {
      await onSelectiveBackup(type);
      toast.success(`Backup Seletivo (${type}) Concluído!`, { description: `Os dados de ${type} foram salvos.` });
    } catch (error) {
      toast.error(`Erro no Backup Seletivo (${type})`, { description: (error as Error).message });
    } finally {
      setIsSelectiveBackupLoading(false);
    }
  };

  const handleEmergencyRestore = async () => {
    setIsRestoreLoading(true);
    try {
      await onEmergencyRestore();
      toast.success("Restauração Concluída!", { description: "O último backup estável foi restaurado." });
    } catch (error) {
      toast.error("Erro na Restauração", { description: (error as Error).message });
    } finally {
      setIsRestoreLoading(false);
      setIsRestoreConfirmOpen(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <RefreshCcw className="h-5 w-5 text-primary" />
          Painel de Backup e Restauração
        </CardTitle>
        <CardDescription>Gerencie a segurança dos dados da sua escola.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-6 pt-4">
        {/* 1. Backup Rápido */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" /> Backup Rápido
          </h3>
          <p className="text-sm text-muted-foreground">
            Crie um backup completo de todos os dados da sua escola com um clique.
          </p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleQuickBackup}
                  disabled={isQuickBackupLoading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {isQuickBackupLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  Backup Completo Agora
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Realiza um backup de todos os dados (banco de dados, arquivos, código).</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Separator />

        {/* 2. Backup Seletivo */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-green-600" /> Backup Seletivo
          </h3>
          <p className="text-sm text-muted-foreground">
            Escolha quais tipos de dados você deseja fazer backup.
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isSelectiveBackupLoading} className="w-full">
                {isSelectiveBackupLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Fazer Backup Seletivo
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleSelectiveBackup('database')} disabled={isSelectiveBackupLoading}>
                <Database className="mr-2 h-4 w-4" /> Banco de Dados
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSelectiveBackup('files')} disabled={isSelectiveBackupLoading}>
                <Folder className="mr-2 h-4 w-4" /> Arquivos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSelectiveBackup('code')} disabled={isSelectiveBackupLoading}>
                <Code className="mr-2 h-4 w-4" /> Código Fonte
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator />

        {/* 3. Status de Espaço */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-blue-600" /> Espaço de Armazenamento
          </h3>
          <p className="text-sm text-muted-foreground">
            Uso atual do espaço de armazenamento para backups.
          </p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Progress value={diskUsage.percent} className="w-full" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{diskUsage.used} MB de {diskUsage.total} MB ({diskUsage.percent.toFixed(1)}%) utilizados.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Separator />

        {/* 4. Emergência - Restore */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5 text-destructive" /> Restauração de Emergência
          </h3>
          <p className="text-sm text-muted-foreground">
            Restaura o sistema para o último backup estável. Use com extrema cautela!
          </p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  onClick={() => setIsRestoreConfirmOpen(true)}
                  disabled={isRestoreLoading}
                  className="w-full"
                >
                  {isRestoreLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="mr-2 h-4 w-4" />
                  )}
                  Restaurar Último Backup Estável
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Esta ação é irreversível e pode causar perda de dados recentes.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>

      {/* Modal de Confirmação para Restauração */}
      <AlertDialog open={isRestoreConfirmOpen} onOpenChange={setIsRestoreConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" /> Confirmar Restauração de Emergência
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a restaurar o sistema para o último backup estável.
              <br /><br />
              <strong>Esta ação é irreversível e todos os dados inseridos após o último backup serão perdidos.</strong>
              <br /><br />
              Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoreLoading}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleEmergencyRestore}
              disabled={isRestoreLoading}
            >
              {isRestoreLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Restauração
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default QuickBackupPanel;