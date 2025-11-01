import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, School, MoreHorizontal, Ban, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { Navigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
}

const fetchTenants = async (): Promise<Tenant[]> => {
  const { data, error } = await supabase.functions.invoke('get-all-tenant-metrics');
  if (error) throw new Error(error.message);
  if (data.error) throw new Error(data.error); // Edge function might return an error object
  return data as Tenant[];
};

const TenantsPage: React.FC = () => {
  const { isSuperAdmin, isLoading: isProfileLoading } = useProfile();
  const queryClient = useQueryClient();

  const { data: tenants, isLoading: isTenantsLoading, error } = useQuery<Tenant[], Error>({
    queryKey: ['tenants'],
    queryFn: fetchTenants,
    enabled: isSuperAdmin, // Only fetch if the current user is a Super Admin
  });

  const updateTenantStatusMutation = useMutation({
    mutationFn: async ({ tenantId, newStatus }: { tenantId: string; newStatus: 'active' | 'suspended' }) => {
      const { error: edgeFunctionError } = await supabase.functions.invoke('update-tenant-status', {
        body: JSON.stringify({ tenant_id: tenantId, new_status: newStatus }),
      });
      if (edgeFunctionError) throw new Error(edgeFunctionError.message);
    },
    onSuccess: (_, variables) => {
      toast.success(`Escola ${variables.newStatus === 'active' ? 'habilitada' : 'bloqueada'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['tenants'] }); // Refetch tenants to update the list
    },
    onError: (err) => {
      toast.error("Erro ao atualizar status da escola", { description: err.message });
    },
  });

  const handleBlockTenant = (tenantId: string) => {
    updateTenantStatusMutation.mutate({ tenantId, newStatus: 'suspended' });
  };

  const handleEnableTenant = (tenantId: string) => {
    updateTenantStatusMutation.mutate({ tenantId, newStatus: 'active' });
  };

  if (isProfileLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    // Redirect if not a Super Admin
    return <Navigate to="/dashboard" replace />;
  }

  if (isTenantsLoading) {
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
                  <TableHead>Funcionários</TableHead>
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
                    <TableCell>{tenant.student_count}</TableCell>
                    <TableCell>{tenant.class_count}</TableCell>
                    <TableCell>{tenant.teacher_count}</TableCell>
                    <TableCell>{tenant.employee_count}</TableCell>
                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                    <TableCell>{format(new Date(tenant.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell>
                      {tenant.trial_expires_at 
                        ? format(new Date(tenant.trial_expires_at), 'dd/MM/yyyy', { locale: ptBR })
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={updateTenantStatusMutation.isPending}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {tenant.status === 'active' || tenant.status === 'trial' ? (
                            <DropdownMenuItem 
                              onClick={() => handleBlockTenant(tenant.id)} 
                              className="text-destructive"
                              disabled={updateTenantStatusMutation.isPending}
                            >
                              <Ban className="mr-2 h-4 w-4" /> Bloquear Escola
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleEnableTenant(tenant.id)}
                              disabled={updateTenantStatusMutation.isPending}
                            >
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Habilitar Escola
                            </DropdownMenuItem>
                          )}
                          {/* Adicionar outras ações aqui, se necessário */}
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
    </div>
  );
};

export default TenantsPage;