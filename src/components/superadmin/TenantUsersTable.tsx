import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile, UserRole } from "@/types/user";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, User, Check, ChevronsUpDown } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TenantUsersTableProps {
  tenantId: string;
}

// Consulta simplificada para diagnóstico
const fetchTenantUsers = async (tenantId: string): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, tenant_id, first_name, last_name, role, avatar_url, updated_at")
    .eq("tenant_id", tenantId)
    .order("role", { ascending: true });

  if (error) throw new Error(error.message);
  
  // Mapeia os dados, definindo o email como 'N/A' temporariamente
  return data.map((p: any) => ({
    ...p,
    email: 'N/A', // Email removido temporariamente para diagnóstico
  })) as Profile[];
};

const userRoles: UserRole[] = ['admin', 'secretary', 'student'];

const TenantUsersTable: React.FC<TenantUsersTableProps> = ({ tenantId }) => {
  const queryClient = useQueryClient();
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["tenantUsers", tenantId],
    queryFn: () => fetchTenantUsers(tenantId),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: UserRole }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Papel do usuário atualizado!");
      queryClient.invalidateQueries({ queryKey: ["tenantUsers", tenantId] });
    },
    onError: (err: any) => {
      showError(`Erro ao atualizar papel: ${err.message}`);
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">Erro ao carregar usuários: {error.message}</div>;
  }

  return (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="w-[150px]">Papel</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users && users.length > 0 ? (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {user.first_name} {user.last_name}
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(newRole: UserRole) => updateRoleMutation.mutate({ userId: user.id, newRole })}
                    disabled={updateRoleMutation.isPending}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {userRoles.map(role => (
                        <SelectItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="h-12 text-center">Nenhum usuário encontrado para este cliente.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TenantUsersTable;