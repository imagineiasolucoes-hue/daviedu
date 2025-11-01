import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import { Navigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: 'super_admin' | 'admin' | 'secretary' | 'teacher' | 'student';
  tenant_id: string | null;
  tenants: { name: string } | null;
}

const fetchAllUsersWithProfiles = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase.functions.invoke('get-all-users-with-profiles');
  if (error) throw new Error(error.message);
  if (data.error) throw new Error(data.error); // Edge function might return an error object
  return data as UserProfile[];
};

const UsersPage: React.FC = () => {
  const { isSuperAdmin, isLoading: isProfileLoading } = useProfile();

  const { data: users, isLoading: isUsersLoading, error } = useQuery<UserProfile[], Error>({
    queryKey: ['allUsersWithProfiles'],
    queryFn: fetchAllUsersWithProfiles,
    enabled: isSuperAdmin, // Only fetch if the current user is a Super Admin
  });

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

  if (isUsersLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive">Erro ao carregar usuários: {error.message}</div>;
  }

  const getRoleBadge = (role: UserProfile['role']) => {
    switch (role) {
      case 'super_admin': return <Badge className="bg-purple-600 hover:bg-purple-700 text-white">Super Admin</Badge>;
      case 'admin': return <Badge className="bg-blue-600 hover:bg-blue-700 text-white">Admin</Badge>;
      case 'secretary': return <Badge className="bg-green-600 hover:bg-green-700 text-white">Secretaria</Badge>;
      case 'teacher': return <Badge variant="secondary">Professor</Badge>;
      case 'student': return <Badge variant="outline">Aluno</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Users className="h-8 w-8 text-primary" />
        Gestão de Usuários (Super Administrador)
      </h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Lista de Todos os Usuários ({users?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Sobrenome</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Escola (Tenant)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.first_name || 'N/A'}</TableCell>
                    <TableCell>{user.last_name || 'N/A'}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{user.tenants?.name || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      {/* Ações futuras como editar perfil, alterar role, etc. */}
                      <ShieldCheck className="h-4 w-4 text-muted-foreground inline-block" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {users?.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersPage;