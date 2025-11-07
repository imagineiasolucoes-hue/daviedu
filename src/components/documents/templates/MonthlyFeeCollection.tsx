import React, { useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Printer, ArrowLeft, School, User, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProfile } from '@/hooks/useProfile';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

// --- Tipos de Dados ---
interface StudentDetails {
  id: string;
  full_name: string;
  registration_code: string;
  birth_date: string;
  tenant_id: string;
  class_id: string | null;
  course_id: string | null;
  created_at: string;
  classes: { 
    id: string;
    name: string; 
    school_year: number; 
  } | null;
  courses: { name: string } | null;
  // Adicionado para refletir a estrutura do join do Supabase antes do processamento
  student_guardians?: {
    guardians: {
      full_name: string;
      relationship: string;
      phone: string | null;
      email: string | null;
    } | null;
  }[];
  // Propriedade final após o mapeamento
  guardians: {
    full_name: string;
    relationship: string;
    phone: string | null;
    email: string | null;
  }[];
}

interface TenantConfig {
  cnpj: string | null;
  phone: string | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip_code: string | null;
  logo_url: string | null;
}

interface TenantDetails {
  name: string;
  config: TenantConfig | null;
}

interface Revenue {
  id: string;
  date: string;
  description: string | null;
  amount: number;
  payment_method: 'Dinheiro' | 'Cartão' | 'Pix' | 'Boleto' | 'Transferência' | 'Sistema';
  status: 'pendente' | 'pago';
  is_recurring: boolean;
  revenue_categories: { name: string } | null;
}

// --- Funções de Busca ---
const fetchStudentData = async (studentId: string): Promise<StudentDetails> => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      id, 
      full_name, 
      registration_code, 
      birth_date, 
      tenant_id, 
      class_id,
      course_id,
      created_at, 
      classes (
        id,
        name, 
        school_year
      ),
      courses (name),
      student_guardians (
        guardians (
          full_name,
          relationship,
          phone,
          email
        )
      )
    `)
    .eq('id', studentId)
    .single();
  if (error) throw new Error(error.message);
  
  const student = data as unknown as StudentDetails;
  // Mapear os guardiões para a estrutura desejada
  student.guardians = student.student_guardians?.map((sg: any) => sg.guardians).filter(Boolean) || [];
  // Remover a propriedade student_guardians original se não for mais necessária
  delete (student as any).student_guardians;

  return student;
};

const fetchTenantDetails = async (tenantId: string): Promise<TenantDetails> => {
  const { data, error } = await supabase
    .from('tenants')
    .select('name, config')
    .eq('id', tenantId)
    .single();
  if (error) throw new Error(error.message);
  return data as TenantDetails;
};

const fetchPendingRevenues = async (studentId: string): Promise<Revenue[]> => {
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
      revenue_categories (name)
    `)
    .eq('student_id', studentId)
    .eq('status', 'pendente')
    .order('date', { ascending: true });
  
  if (error) throw new Error(error.message);
  return data as unknown as Revenue[];
};

const MonthlyFeeCollection: React.FC = () => {
  const { entityId: studentId } = useParams<{ entityId: string }>();
  const { profile } = useProfile();
  const tenantId = profile?.tenant_id;
  const printRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: student, isLoading: isLoadingStudent, error: studentError } = useQuery<StudentDetails, Error>({
    queryKey: ['studentDetails', studentId],
    queryFn: () => fetchStudentData(studentId!),
    enabled: !!studentId,
  });

  const { data: tenant, isLoading: isLoadingTenant, error: tenantError } = useQuery<TenantDetails, Error>({
    queryKey: ['tenantDetails', tenantId],
    queryFn: () => fetchTenantDetails(tenantId!),
    enabled: !!tenantId && !!student?.tenant_id,
  });

  const { data: pendingRevenues, isLoading: isLoadingRevenues, error: revenuesError } = useQuery<Revenue[], Error>({
    queryKey: ['pendingRevenues', studentId],
    queryFn: () => fetchPendingRevenues(studentId!),
    enabled: !!studentId,
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (revenueId: string) => {
      const { error } = await supabase
        .from('revenues')
        .update({ 
          status: 'pago', 
          date: new Date().toISOString().split('T')[0], // Data de hoje
          payment_method: 'Sistema' // Marcado como pago via sistema
        })
        .eq('id', revenueId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Receita marcada como paga!", { description: "O status da cobrança foi atualizado." });
      queryClient.invalidateQueries({ queryKey: ['pendingRevenues', studentId] });
      queryClient.invalidateQueries({ queryKey: ['revenues', tenantId] }); // Invalida a lista geral de receitas
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics', tenantId] }); // Atualiza o dashboard
      queryClient.invalidateQueries({ queryKey: ['financeMetrics', tenantId] }); // Atualiza o financeiro
    },
    onError: (error) => {
      toast.error("Erro ao marcar como pago", { description: error.message });
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const isLoading = isLoadingStudent || isLoadingTenant || isLoadingRevenues;
  const error = studentError || tenantError || revenuesError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl text-destructive">Erro ao Carregar Dados</h1>
        <p className="text-muted-foreground">Verifique se o aluno e a escola estão corretamente cadastrados. Erro: {error.message}</p>
        <Button asChild variant="link" className="mt-4 print-hidden">
          <Link to="/documents">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Link>
        </Button>
      </div>
    );
  }

  if (!student || !tenant) {
    return <div className="text-destructive p-8">Aluno ou escola não encontrados.</div>;
  }

  const studentCourseName = student.courses?.name || 'N/A';
  const primaryGuardian = student.guardians.find(g => g.relationship === 'Pai' || g.relationship === 'Mãe' || g.relationship === 'Tutor') || student.guardians[0];

  const schoolConfig = tenant.config;
  const fullAddress = [
    schoolConfig?.address_street,
    schoolConfig?.address_number ? `, ${schoolConfig.address_number}` : '',
    schoolConfig?.address_neighborhood ? ` - ${schoolConfig.address_neighborhood}` : '',
    schoolConfig?.address_city,
    schoolConfig?.address_state,
    schoolConfig?.address_zip_code ? ` - CEP: ${schoolConfig.address_zip_code}` : '',
  ].filter(Boolean).join('');

  const totalPendingAmount = pendingRevenues?.reduce((sum, rev) => sum + rev.amount, 0) || 0;

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 shadow-lg print:shadow-none print:p-0" ref={printRef}>
      
      {/* Botões de Ação (Ocultos na Impressão) */}
      <div className="flex justify-between items-center mb-6 print-hidden">
        <Button variant="outline" asChild>
          <Link to="/documents">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Link>
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir Cobrança
        </Button>
      </div>

      {/* Cabeçalho do Documento */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        {/* Informações da Escola (Esquerda) */}
        <div className="text-left space-y-1">
          <h1 className="text-2xl font-bold text-primary">{tenant.name}</h1>
          <p className="text-sm text-muted-foreground">DOCUMENTO DE COBRANÇA DE MENSALIDADE</p>
          <div className="mt-2 text-xs text-muted-foreground space-y-1">
            {schoolConfig?.cnpj && <p>CNPJ: {schoolConfig.cnpj}</p>}
            {schoolConfig?.phone && <p>Telefone: {schoolConfig.phone}</p>}
            {fullAddress && <p>Endereço: {fullAddress}</p>}
          </div>
        </div>

        {/* Logo da Escola (Direita) */}
        {tenant.config?.logo_url && (
          <img src={tenant.config.logo_url} alt="Logo da Escola" className="h-32 w-auto object-contain" />
        )}
      </div>

      {/* Dados do Aluno e Responsável */}
      <Card className="mb-6 border-dashed">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <User className="h-5 w-5 text-accent" />
            Dados do Aluno e Responsável
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="font-semibold">Aluno:</span> {student.full_name}</p>
            <p><span className="font-semibold">Matrícula:</span> {student.registration_code}</p>
            <p><span className="font-semibold">Turma:</span> {student.classes?.name || 'N/A'} ({student.classes?.school_year || 'N/A'})</p>
            <p><span className="font-semibold">Série/Ano:</span> {studentCourseName}</p>
          </div>
          {primaryGuardian && (
            <div>
              <p><span className="font-semibold">Responsável:</span> {primaryGuardian.full_name}</p>
              <p><span className="font-semibold">Parentesco:</span> {primaryGuardian.relationship}</p>
              {primaryGuardian.phone && <p><span className="font-semibold">Telefone:</span> {primaryGuardian.phone}</p>}
              {primaryGuardian.email && <p><span className="font-semibold">Email:</span> {primaryGuardian.email}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção de Cobranças Pendentes */}
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-primary" />
        Cobranças Pendentes
      </h2>
      
      {pendingRevenues && pendingRevenues.length > 0 ? (
        <div className="overflow-x-auto mb-6">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Vencimento</TableHead>
                <TableHead className="min-w-[200px]">Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right min-w-[100px]">Valor</TableHead>
                <TableHead className="text-center min-w-[120px] print-hidden">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRevenues.map((revenue) => (
                <TableRow key={revenue.id}>
                  <TableCell>{format(new Date(revenue.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                  <TableCell className="font-medium">{revenue.description || 'Mensalidade'}</TableCell>
                  <TableCell>{revenue.revenue_categories?.name || 'N/A'}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(revenue.amount)}</TableCell>
                  <TableCell className="text-center print-hidden">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => markAsPaidMutation.mutate(revenue.id)}
                      disabled={markAsPaidMutation.isPending}
                    >
                      {markAsPaidMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Marcar como Pago
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-center py-8 text-muted-foreground">Nenhuma cobrança pendente para este aluno.</p>
      )}

      {pendingRevenues && pendingRevenues.length > 0 && (
        <div className="flex justify-end items-center mt-4 p-4 bg-muted/50 rounded-md border">
          <span className="text-lg font-semibold mr-4">Total Pendente:</span>
          <span className="text-2xl font-bold text-destructive">{formatCurrency(totalPendingAmount)}</span>
        </div>
      )}

      {/* Rodapé do Documento (para impressão) */}
      <div className="mt-12 pt-4 border-t text-center text-xs text-muted-foreground print:mt-4">
        <p>Documento gerado pelo sistema Davi EDU em {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}.</p>
        <p>Este documento serve como um lembrete de cobrança. Para dúvidas, entre em contato com a secretaria da escola.</p>
      </div>
    </div>
  );
};

export default MonthlyFeeCollection;