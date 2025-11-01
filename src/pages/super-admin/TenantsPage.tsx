import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

interface AdminProfile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface Tenant {
  id: string;
  name: string;
  status: 'trial' | 'active' | 'suspended';
  trial_expires_at: string | null;
  created_at: string;
  profiles: AdminProfile[];
}

const fetchTenants = async (): Promise<Tenant[]> => {
  const { data, error } = await supabase
    .from('tenants')
    .select(`
      *,
      profiles (
        first_name,
        last_name,
        email
      )
    `)
    .eq('profiles.role', 'admin')
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
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Gestão de Escolas (Tenants)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Escola</TableHead>
                <TableHead>Administrador</TableHead>
                <TableHead>Email do Admin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Expiração do Teste</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants?.map((tenant) => {
                const admin = tenant.profiles?.[0];
                const adminName = admin ? `${admin.first_name || ''} ${admin.last_name || ''}`.trim() : 'N/A';
                const adminEmail = admin?.email || 'N/A';

                return (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{adminName}</TableCell>
                    <TableCell>{adminEmail}</TableCell>
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
                );
              })}
            </TableBody>
          </Table>
        </div>
        {tenants?.length === 0 && (
          <p className="text-center py-8 text-muted-foreground">Nenhuma escola cadastrada.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default TenantsPage;