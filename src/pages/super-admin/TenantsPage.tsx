import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, School, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { Navigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  name: string;
  status: 'trial' | 'active' | 'suspended';
  trial_expires_at: string | null;
  created_at: string;
  student_count: number;
  class_count: number;
  teacher_count: number;
  employee_count: number;
  plan_value: number;
}

const fetchTenants = async (): Promise<Tenant[]> => {
  const { data, error } = await supabase.functions.invoke('get-all-tenant-metrics');
  if (error) throw new Error(error.message);
  if (data.error) throw new Error(data.error);
  return data as Tenant[];
};

const TenantsPage: React.FC = () => {
  const { isSuperAdmin, isLoading: isProfileLoading } = useProfile();
  const queryClient = useQueryClient();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const { data: tenants, isLoading: isTenantsLoading, error } = useQuery<Tenant[], Error>({
    queryKey: ['tenants'],
    queryFn: fetchTenants,
    enabled: isSuperAdmin,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ tenantId, newStatus }: { tenantId: string, newStatus: Tenant['status'] }) => {
      const { error } = await supabase.functions.invoke('update-tenant-status', {
        body: JSON.stringify({ tenant_id: tenantId, new_status: newStatus }),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Status da escola atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status", { description: error.message });
    },
    onSettled: () => {
      setIsConfirmOpen(false);
      setSelectedTenant(null);
    },
  });

  const handleSuspendClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsConfirmOpen(true);
  };

  const handleConfirmSuspend = () => {
    if (selectedTenant) {
      updateStatusMutation.mutate({ tenantId: selectedTenant.id, newStatus: 'suspended' });
    }
  };

  const handleActivateClick = (tenant: Tenant) => {
    updateStatusMutation.mutate({ tenantId: tenant.id, newStatus: 'active' });
  };

  if (isProfileLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isTenantsLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-destructive">Erro ao carregar escolas: {error.message}</div>;
  }

  const getStatusBadge = (status: Tenant['status']) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500 hover:bg-green-600">Ativa</Badge>;
      case 'trial': return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Teste</Badge>;
      case 'suspended': return <Badge variant="destructive">Suspensa</Badge>;
      default: return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <School className="h-8 w-8 text-primary" />
        Gestão de Escolas (Tenants)
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Lista de Escolas ({tenants?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Escola</TableHead>
                  <TableHead>Alunos</TableHead>
                  <TableHead>Turmas</TableHead>
                  <TableHead>Professores</TableHead>
                  <TableHead>Plano ($)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants?.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{tenant.student_count}</TableCell>
                    <TableCell>{tenant.class_count}</TableCell>
                    <TableCell>{tenant.teacher_count}</TableCell>
                    <TableCell>{formatCurrency(tenant.plan_value)}</TableCell>
                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                    <TableCell>{format(new Date(tenant.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {tenant.status !== 'active' && (
                            <DropdownMenuItem onClick={() => handleActivateClick(tenant)}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Ativar Plano
                            </DropdownMenuItem>
                          )}
                          {tenant.status !== 'suspended' && (
                            <DropdownMenuItem onClick={() => handleSuspendClick(tenant)} className="text-destructive">
                              <XCircle className="mr-2 h-4 w-4" /> Suspender Acesso
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Suspensão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja suspender o acesso da escola <strong>{selectedTenant?.name}</strong>? Os usuários não poderão mais acessar o sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmSuspend}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Suspender
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TenantsPage;