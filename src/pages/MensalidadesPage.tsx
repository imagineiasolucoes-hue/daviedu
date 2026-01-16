import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Calendar, CheckCircle2, AlertCircle, Loader2, PlayCircle } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

type TuitionStatus = 'pendente' | 'pago' | 'atrasado' | 'cancelado';

interface TuitionFee {
  id: string;
  student_id: string;
  student_name: string;
  amount: number;
  due_date: string;
  status: TuitionStatus;
  description: string;
}

const MensalidadesPage: React.FC = () => {
  const { profile } = useProfile();
  const tenantId = profile?.tenant_id;
  const [fees, setFees] = useState<TuitionFee[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Form state for bulk generation
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [amount, setAmount] = useState('500.00');
  const [dueDay, setDueDay] = useState('10');
  const [description, setDescription] = useState('Mensalidade Escolar');

  const fetchFees = async () => {
    if (!tenantId) return;
    setLoading(true);
    
    let query = supabase
      .from('tuition_fees')
      .select(`
        *,
        students!inner(full_name)
      `)
      .eq('tenant_id', tenantId)
      .order('due_date', { ascending: false });

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Erro ao carregar mensalidades: ' + error.message);
    } else {
      const formattedFees = data?.map(f => ({
        ...f,
        student_name: (f as any).students.full_name
      })) || [];
      setFees(formattedFees);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (tenantId) fetchFees();
  }, [tenantId, filterStatus]);

  const handleBulkGenerate = async () => {
    if (!tenantId) return;
    setGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-tuition-fees', {
        body: {
          tenant_id: tenantId,
          academic_period_id: null, // Could be dynamic in the future
          year,
          base_amount: parseFloat(amount),
          due_day: parseInt(dueDay),
          description
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Sucesso! ${data.count} mensalidades geradas.`);
      fetchFees();
    } catch (err: any) {
      toast.error('Erro ao gerar: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const updateFeeStatus = async (feeId: string, newStatus: TuitionStatus) => {
    const { error } = await supabase
      .from('tuition_fees')
      .update({ status: newStatus })
      .eq('id', feeId);
    
    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      toast.success('Status atualizado');
      fetchFees();
    }
  };

  // Cálculos de Métricas
  const totalExpected = fees.reduce((acc, f) => acc + f.amount, 0);
  const totalPaid = fees.filter(f => f.status === 'pago').reduce((acc, f) => acc + f.amount, 0);
  const totalPending = fees.filter(f => f.status === 'pendente' || f.status === 'atrasado').reduce((acc, f) => acc + f.amount, 0);
  const delinquencyRate = totalExpected > 0 ? ((totalPending / totalExpected) * 100).toFixed(1) : '0';

  const getStatusBadge = (status: TuitionStatus) => {
    const variants: Record<string, string> = {
      pago: 'bg-green-100 text-green-800 hover:bg-green-200',
      pendente: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      atrasado: 'bg-red-100 text-red-800 hover:bg-red-200',
      cancelado: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    };
    return (
      <Badge className={variants[status] || variants.pendente}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (!profile || !tenantId) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <DollarSign className="h-8 w-8 text-primary" />
          Gestão de Mensalidades
        </h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlayCircle className="mr-2 h-4 w-4" />
              Gerar em Massa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerar Mensalidades em Massa</DialogTitle>
              <DialogDescription>
                Crie mensalidades para todos os alunos ativos para o ano selecionado.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="year">Ano Letivo</Label>
                <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Valor Base (R$)</Label>
                <Input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDay">Dia de Vencimento (1-31)</Label>
                <Input id="dueDay" type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição Padrão</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <Button onClick={handleBulkGenerate} disabled={generating} className="w-full">
                {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gerar 12 Meses
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Esperada</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpected)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recebido</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendente/Atrasado</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalPending)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inadimplência</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{delinquencyRate}%</div>
            <p className="text-xs text-muted-foreground">Baseado no total esperado</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Tabela */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Relação de Mensalidades</CardTitle>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : fees.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">Nenhuma mensalidade encontrada.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">{fee.student_name}</TableCell>
                    <TableCell>{fee.description}</TableCell>
                    <TableCell>{new Date(fee.due_date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{formatCurrency(fee.amount)}</TableCell>
                    <TableCell>{getStatusBadge(fee.status)}</TableCell>
                    <TableCell>
                      {fee.status !== 'pago' && (
                        <Button size="sm" variant="outline" onClick={() => updateFeeStatus(fee.id, 'pago')}>
                          Dar Baixa
                        </Button>
                      )}
                      {fee.status === 'pago' && (
                        <Button size="sm" variant="ghost" onClick={() => updateFeeStatus(fee.id, 'pendente')}>
                          Estornar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MensalidadesPage;