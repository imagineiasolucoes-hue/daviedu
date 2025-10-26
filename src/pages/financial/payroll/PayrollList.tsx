import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchTenantId } from "@/lib/tenant";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { Payroll } from "@/types/financial";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import PayrollTable from "@/components/financial/payroll/PayrollTable";
import PayrollForm from "@/components/financial/payroll/PayrollForm";
import DeletePayrollDialog from "@/components/financial/payroll/DeletePayrollDialog";

const PayrollList = () => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const queryClient = useQueryClient();

  const handleEdit = (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setIsFormOpen(true);
  };

  const handleDelete = (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setIsDeleteDialogOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedPayroll(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedPayroll(null);
  };

  const generatePayrollMutation = useMutation({
    mutationFn: async (month: Date) => {
      const toastId = showLoading("Gerando folha de pagamento...");
      try {
        const { tenantId, error: tenantError } = await fetchTenantId();
        if (tenantError) throw new Error(tenantError);

        const referenceMonth = format(month, "yyyy-MM-dd");

        // 1. Fetch active employees
        const { data: employees, error: employeesError } = await supabase
          .from("employees")
          .select("id, base_salary")
          .eq("tenant_id", tenantId)
          .eq("status", "active");
        if (employeesError) throw employeesError;
        if (!employees || employees.length === 0) {
          throw new Error("Nenhum funcionário ativo encontrado para gerar a folha.");
        }

        // 2. Fetch existing payrolls for the month to avoid duplicates
        const { data: existingPayrolls, error: existingError } = await supabase
          .from("payrolls")
          .select("employee_id")
          .eq("tenant_id", tenantId)
          .eq("reference_month", referenceMonth);
        if (existingError) throw existingError;
        const existingEmployeeIds = new Set(existingPayrolls.map(p => p.employee_id));

        // 3. Filter out employees who already have a payroll for the month
        const newPayrollsToCreate = employees
          .filter(emp => !existingEmployeeIds.has(emp.id))
          .map(emp => ({
            tenant_id: tenantId,
            employee_id: emp.id,
            reference_month: referenceMonth,
            gross_salary: emp.base_salary,
            net_salary: emp.base_salary, // Initially net = gross
            payment_status: 'pendente',
            discounts: 0,
            benefits: 0,
          }));

        if (newPayrollsToCreate.length === 0) {
          showSuccess("Nenhum novo pagamento a ser gerado. Todos os funcionários ativos já estão na folha deste mês.");
          return;
        }

        // 4. Insert new payrolls
        const { error: insertError } = await supabase.from("payrolls").insert(newPayrollsToCreate);
        if (insertError) throw insertError;

        showSuccess(`${newPayrollsToCreate.length} novo(s) pagamento(s) gerado(s) com sucesso!`);
      } finally {
        dismissToast(toastId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls", format(selectedMonth, "yyyy-MM")] });
    },
    onError: (error: any) => {
      showError(`Erro ao gerar folha: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (payrollId: string) => {
      const { error } = await supabase.from("payrolls").delete().eq("id", payrollId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Lançamento excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["payrolls", format(selectedMonth, "yyyy-MM")] });
      closeDeleteDialog();
    },
    onError: (error: any) => showError(error.message),
  });

  const confirmDelete = () => {
    if (selectedPayroll) {
      deleteMutation.mutate(selectedPayroll.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Folha de Pagamento</h3>
          <p className="text-sm text-muted-foreground">
            Selecione o mês e gere os pagamentos para seus funcionários.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedMonth}
                onSelect={(date) => date && setSelectedMonth(startOfMonth(date))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button onClick={() => generatePayrollMutation.mutate(selectedMonth)} disabled={generatePayrollMutation.isPending}>
            {generatePayrollMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar Folha do Mês
          </Button>
        </div>
      </div>

      <PayrollTable
        referenceMonth={selectedMonth}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <PayrollForm
        isOpen={isFormOpen}
        onClose={closeForm}
        initialData={selectedPayroll}
      />

      {selectedPayroll && (
        <DeletePayrollDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={confirmDelete}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default PayrollList;