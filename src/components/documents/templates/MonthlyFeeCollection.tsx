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
import { QRCodeSVG } from 'qrcode.react'; // Importar QRCodeSVG

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
  student_guardians?: {
    guardians: {
      full_name: string;
      relationship: string;
      phone: string | null;
      email: string | null;
    } | null;
  }[];
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
  // CAMPOS FINANCEIROS
  pix_key: string | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
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
  student.guardians = student.student_guardians?.map((sg: any) => sg.guardians).filter(Boolean) || [];
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
          date: new Date().toISOString().split('T')[0],
          payment_method: 'Sistema'
        })
        .eq('id', revenueId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Receita marcada como paga!", { description: "O status da cobrança foi atualizado." });
      queryClient.invalidateQueries({ queryKey: ['pendingRevenues', studentId] });
      queryClient.invalidateQueries({ queryKey: ['revenues', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['financeMetrics', tenantId] });
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
  
  // --- Dados de Pagamento (Lendo da Configuração do Tenant) ---
  const pixKey = schoolConfig?.pix_key || 'Nenhuma chave PIX configurada';
  
  const bankDetails = {
    bankName: schoolConfig?.bank_name || 'N/A',
    agency: schoolConfig?.bank_agency || 'N/A',
    account: schoolConfig?.bank_account || 'N/A',
    cnpj: schoolConfig?.cnpj || 'N/A',
  };

  const isPixConfigured = !!schoolConfig?.pix_key;
  const isBankConfigured = !!schoolConfig?.bank_name && !!schoolConfig?.bank_agency && !!schoolConfig?.bank_account;

  return (
    <React.Fragment>
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
        <div className="flex justify-between items-start mb-6 border-b pb-4"> {/* Ajustado para items-start */}
          {/* Informações da Escola (Esquerda) */}
          <div className="text-left space-y-1 flex-1"> {/* flex-1 para ocupar espaço */}
            <h1 className="text-xl font-bold text-primary">{tenant.name}</h1> {/* Fonte menor */}
            <p className="text-xs text-muted-foreground">DOCUMENTO DE COBRANÇA DE MENSALIDADE</p> {/* Fonte menor */}
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              {schoolConfig?.cnpj && <p>CNPJ: {schoolConfig.cnpj}</p>}
              {schoolConfig?.phone && <p>Telefone: {schoolConfig.phone}</p>}
              {fullAddress && <p>Endereço: {fullAddress}</p>}
            </div>
          </div>

          {/* Logo da Escola (Direita) */}
          {tenant.config?.logo_url && (
            <img src={tenant.config.logo_url} alt="Logo da Escola" className="h-20 w-auto object-contain" /> /* Logo menor */
          )}
        </div>

        {/* Data de Emissão e Total Pendente (Mais discreto) */}
        <div className="flex justify-between items-center mb-6 p-3 bg-muted/50 rounded-md border"> {/* Padding menor */}
          <div className="space-y-0.5"> {/* Espaçamento menor */}
            <p className="text-xs text-muted-foreground">Data de Emissão:</p> {/* Fonte menor */}
            <p className="font-semibold text-sm">{format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}</p> {/* Fonte menor */}
          </div>
          <div className="text-right space-y-0.5"> {/* Espaçamento menor */}
            <p className="text-sm font-semibold text-muted-foreground">TOTAL PENDENTE</p> {/* Fonte menor */}
            <p className="text-xl font-bold text-destructive">{formatCurrency(totalPendingAmount)}</p> {/* Fonte menor */}
          </div>
        </div>

        {/* Dados do Aluno e Responsável (Duas Colunas) */}
        <Card className="mb-6 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"> {/* Fonte menor */}
              <User className="h-4 w-4 text-accent" /> {/* Ícone menor */}
              Dados do Aluno e Responsável
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
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

        {/* Seção de Cobranças Pendentes (Resumo) */}
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"> {/* Fonte menor */}
          <DollarSign className="h-4 w-4 text-primary" /> {/* Ícone menor */}
          Detalhes das Cobranças Pendentes
        </h2>
        
        {pendingRevenues && pendingRevenues.length > 0 ? (
          <div className="overflow-x-auto mb-8">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px] text-xs">Vencimento</TableHead> {/* Fonte menor */}
                  <TableHead className="min-w-[150px] text-xs">Descrição</TableHead> {/* Fonte menor */}
                  <TableHead className="text-xs">Categoria</TableHead> {/* Fonte menor */}
                  <TableHead className="text-right min-w-[80px] text-xs">Valor</TableHead> {/* Fonte menor */}
                  <TableHead className="text-center min-w-[100px] print-hidden text-xs">Ações</TableHead> {/* Fonte menor */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRevenues.map((revenue) => (
                  <TableRow key={revenue.id}>
                    <TableCell className="text-xs">{format(new Date(revenue.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell> {/* Fonte menor */}
                    <TableCell className="font-medium text-xs">{revenue.description || 'Mensalidade'}</TableCell> {/* Fonte menor */}
                    <TableCell className="text-xs">{revenue.revenue_categories?.name || 'N/A'}</TableCell> {/* Fonte menor */}
                    <TableCell className="text-right font-bold text-xs">{formatCurrency(revenue.amount)}</TableCell> {/* Fonte menor */}
                    <TableCell className="text-center print-hidden">
                      <Button 
                        variant="outline" 
                        size="sm" /* Tamanho menor para o botão */
                        onClick={() => markAsPaidMutation.mutate(revenue.id)}
                        disabled={markAsPaidMutation.isPending}
                      >
                        {markAsPaidMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" /> /* Ícone menor */
                        ) : (
                          <CheckCircle className="h-3 w-3 mr-1" /> /* Ícone menor */
                        )}
                        Pago
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma cobrança pendente para este aluno.</p> /* Fonte menor */
        )}

        <Separator className="mb-8" />

        {/* Seção de Dados para Pagamento (Duas Colunas com QR Code) */}
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-accent" />
          Dados para Pagamento
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Força 2 colunas em md e acima */}
          {/* Coluna 1: PIX */}
          <Card className="p-4">
            <CardTitle className="text-lg mb-4">Pagamento via PIX</CardTitle>
            {isPixConfigured ? (
              <div className="flex flex-col items-center space-y-3 text-sm"> {/* Centraliza conteúdo */}
                <p><span className="font-semibold">Chave PIX:</span></p>
                <p className="text-primary font-mono break-all p-2 bg-muted rounded-md text-xs">{pixKey}</p> {/* Fonte menor */}
                {pixKey && (
                  <div className="p-2 border rounded-md bg-white">
                    <QRCodeSVG value={pixKey} size={80} /> {/* QR Code menor */}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">Valor total pendente: {formatCurrency(totalPendingAmount)}</p>
              </div>
            ) : (
              <p className="text-sm text-destructive py-4">Chave PIX não configurada nas Configurações da Escola.</p>
            )}
          </Card>

          {/* Coluna 2: Dados Bancários */}
          <Card className="p-4">
            <CardTitle className="text-lg mb-4">Transferência Bancária (TED/DOC)</CardTitle>
            {isBankConfigured ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p><span className="font-semibold">Banco:</span> {bankDetails.bankName}</p>
                  <p><span className="font-semibold">Agência:</span> {bankDetails.agency}</p>
                </div>
                <div className="space-y-2">
                  <p><span className="font-semibold">Conta Corrente:</span> {bankDetails.account}</p>
                  <p><span className="font-semibold">CNPJ:</span> {bankDetails.cnpj}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-destructive py-4">Dados bancários incompletos nas Configurações da Escola.</p>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              Por favor, envie o comprovante de pagamento para a secretaria da escola.
            </p>
          </Card>
        </div>

        {/* Rodapé do Documento (para impressão) */}
        <div className="mt-12 pt-4 border-t text-center text-xs text-muted-foreground print:mt-4">
          <p>Documento gerado pelo sistema Davi EDU em {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}.</p>
          <p>Este documento serve como um lembrete de cobrança. Para dúvidas, entre em contato com a secretaria da escola.</p>
        </div>
      </div>
    </React.Fragment>
  );
};

export default MonthlyFeeCollection;