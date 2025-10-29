import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Unlock, Pencil, MoreHorizontal } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/utils/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Tenant {
  id: string;
  name: string;
  status: 'trial' | 'active' | 'blocked';
  trial_expires_at: string | null;
  created_at: string;
}

const fetchTenants = async (): Promise<Tenant[]> => {
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, status, trial_expires_at, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

const StatusBadge = ({ status }: { status: Tenant['status'] }) => {
  const variants = {
    trial: "bg-yellow-400 text-yellow-900",
    active: "bg-green-500 text-white",
    blocked: "bg-red-600 text-white",
  };
  const text = {
    trial: "Avaliação",
    active: "Ativo",
    blocked: "Bloqueado",
  };
  return <Badge className={cn(variants[status])}>{text[status]}</Badge>;
};

const TrialCountdown = ({ expiresAt }: { expiresAt: string | null }) => {
  if (!expiresAt) return <span className="text-muted-foreground">-</span>;

  const expirationDate = new Date(expiresAt);
  const now = new Date();
  const daysRemaining = differenceInDays(expirationDate, now);

  if (daysRemaining < 0) {
    return <span className="text-red-500 font-medium">Expirado</span>;
  }
  if (daysRemaining <= 2) {
    return <span className="text-orange-500 font-medium">{daysRemaining} dia(s)</span>;
  }
  return <span>{daysRemaining} dias</span>;
};

interface TenantsTableProps {
  onEdit: (tenant: Tenant) => void;
}

const TenantsTable: React.FC<TenantsTableProps> = ({ onEdit }) => {
  const queryClient = useQueryClient();
  const { data: tenants, isLoading, error } = useQuery({
    queryKey: ["tenants"],
    queryFn: fetchTenants,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Tenant['status'] }) => {
      const { error } = await supabase.from("tenants").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Status do cliente atualizado!");
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (err: any) => {
      showError(`Erro ao atualizar status: ${err.message}`);
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-8">Erro ao carregar clientes: {error.message}</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Escola</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Fim da Avaliação</TableHead>
            <TableHead>Data de Cadastro</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants && tenants.length > 0 ? (
            tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell><StatusBadge status={tenant.status} /></TableCell>
                <TableCell><TrialCountdown expiresAt={tenant.trial_expires_at} /></TableCell>
                <TableCell>{format(new Date(tenant.created_at), "dd/MM/yyyy")}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEdit(tenant)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      {tenant.status === 'blocked' ? (
                        <DropdownMenuItem
                          onClick={() => updateStatusMutation.mutate({ id: tenant.id, status: 'active' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          <Unlock className="mr-2 h-4 w-4" /> Habilitar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => updateStatusMutation.mutate({ id: tenant.id, status: 'blocked' })}
                          disabled={updateStatusMutation.isPending}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Lock className="mr-2 h-4 w-4" /> Bloquear
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">Nenhum cliente encontrado.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TenantsTable;