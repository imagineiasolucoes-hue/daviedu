import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckCircle, XCircle, Clock, HardDrive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
// Removendo imports de BackupStatusWidget e QuickBackupPanel
// import BackupStatusWidget from '@/components/dashboard/BackupStatusWidget';
// import QuickBackupPanel from '@/components/backup/QuickBackupPanel';
import { toast } from 'sonner'; // Importando toast para as ações do painel

interface Tenant {
  id: string;
  name: string;
  status: 'trial' | 'active' | 'suspended';
  trial_expires_at: string | null;
  created_at: string;
}

const fetchTenants = async (): Promise<Tenant[]> => {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data as Tenant[];
};

const TenantsPage: React.FC = () => {
  const { data: tenants, isLoading, error } = useQuery<Tenant[], Error>({
    queryKey: ['tenants'],
    queryFn: fetchTenants,
  });

  // Mock data e handlers para o QuickBackupPanel (removidos, mas mantendo para referência se necessário em outro lugar)
  // const mockDiskUsage = {
  //   used: 750,
  //   total: 1024,
  //   percent: (750 / 1024) * 100,
  // };

  // const handleQuickBackup = async () => {
  //   console.log("Executando backup completo (Super Admin)...");
  //   await new Promise(resolve => setTimeout(resolve, 2000)); // Simula API call
  //   toast.success("Backup Completo Concluído!", { description: "Todos os dados foram salvos com sucesso." });
  // };

  // const handleSelectiveBackup = async (type: 'database' | 'files' | 'code') => {
  //   console.log(`Executando backup seletivo (Super Admin): ${type}...`);
  //   await new Promise(resolve => setTimeout(resolve, 1500)); // Simula API call
  //   toast.success(`Backup Seletivo (${type}) Concluído!`, { description: `Os dados de ${type} foram salvos.` });
  // };

  // const handleEmergencyRestore = async () => {
  //   console.log("Executando restauração de emergência (Super Admin)...");
  //   await new Promise(resolve => setTimeout(resolve, 3000)); // Simula API call
  //   toast.success("Restauração Concluída!", { description: "O último backup estável foi restaurado." });
  // };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive">Erro ao carregar escolas: {error.message}</div>;
  }

  const getStatusBadge = (status: Tenant['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Ativa</Badge>;
      case 'trial':
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Teste</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspensa</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestão de Escolas (Tenants)</h1>

      {/* Seção de Backup REMOVIDA daqui */}
      {/* <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <HardDrive className="h-6 w-6 text-primary" /> Sistema de Backup
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
      </section> */}

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Lista de Escolas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Escola</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead>Expiração do Teste</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants?.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                    <TableCell>{format(new Date(tenant.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell>
                      {tenant.trial_expires_at 
                        ? format(new Date(tenant.trial_expires_at), 'dd/MM/yyyy', { locale: ptBR })
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">Ver Detalhes</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {tenants?.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">Nenhuma escola cadastrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantsPage;