import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, DollarSign, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import AddRevenueSheet from '@/components/revenues/AddRevenueSheet';
import RevenueCategorySheet from '@/components/revenues/RevenueCategorySheet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// --- Tipos de Dados ---
interface Revenue {
  id: string;
  date: string;
  description: string | null;
  amount: number;
  payment_method: 'Dinheiro' | 'Cartão' | 'Pix' | 'Boleto' | 'Transferência';
  status: 'pendente' | 'pago';
  is_recurring: boolean;
  created_at: string;
  revenue_categories: { name: string } | null;
  students: { full_name: string; registration_code: string } | null;
}

// --- Função de Busca de Dados ---
const fetchRevenues = async (tenantId: string): Promise<Revenue[]> => {
  const { data, error } = await supabase
    .from('revenues')
    .select(`
      id,
      date,
      description,
      amount,
      payment_method,
      status,
      is_recurring,
      created_at,
      revenue_categories (name),
      students (full_name, registration_code)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false }); // Ordenar da mais recente para a mais antiga

  if (error) throw new Error(error.message);
  return data as unknown as Revenue[];
};

const RevenuesPage: React.FC = () => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const tenantId = profile?.tenant_id;

  // Estados para edição e exclusão (funcionalidade futura)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | null>(null);

  const { data: revenues, isLoading: isRevenuesLoading, error } = useQuery<Revenue[], Error>({
    queryKey: ['revenues', tenantId],
    queryFn: () => fetchRevenues(tenantId!),
    enabled: !!tenantId,
  });

  // Funções placeholder para edição e exclusão
  const handleEdit = (revenue: Revenue) => {
    setSelectedRevenue(revenue);
    setIsEditSheetOpen(true);
    // Implementar EditRevenueSheet
  };

  const handleDelete = (revenue: Revenue) => {
    setSelectedRevenue(revenue);
    setIsDeleteDialogOpen(true);
    // Implementar DeleteRevenueDialog
  };

  if (isProfileLoading || isRevenuesLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-destructive">Erro ao carregar receitas: {error.message}</div>;
  }

  const getStatusBadge = (status: Revenue['status']) => {
    switch (status) {
      case 'pago': return <Badge className="bg-green-500 hover:bg-green-600">Pago</Badge>;
      case 'pendente': return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Pendente</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Receitas</h1>
        <div className="flex gap-2">
          <RevenueCategorySheet />
          <AddRevenueSheet />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Lista de Receitas ({revenues?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenues?.map((revenue) => (
                  <TableRow key={revenue.id}>
                    <TableCell>{format(new Date(revenue.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{revenue.description || 'N/A'}</TableCell>
                    <TableCell>{revenue.revenue_categories?.name || 'N/A'}</TableCell>
                    <TableCell>{revenue.students?.full_name || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(revenue.amount)}</TableCell>
                    <TableCell>{revenue.payment_method}</TableCell>
                    <TableCell>{getStatusBadge(revenue.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(revenue)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(revenue)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {revenues?.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">Nenhuma receita registrada.</p>
          )}
        </CardContent>
      </Card>

      {/* EditRevenueSheet e DeleteRevenueDialog seriam adicionados aqui */}
      {/* <EditRevenueSheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen} revenueId={selectedRevenue?.id || null} /> */}
      {/* <DeleteRevenueDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} revenueId={selectedRevenue?.id || null} revenueDescription={selectedRevenue?.description || null} /> */}
    </div>
  );
};

export default RevenuesPage;