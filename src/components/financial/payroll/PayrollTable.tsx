import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Payroll } from "@/types/financial";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

interface PayrollTableProps {
  referenceMonth: Date;
  onEdit: (payroll: Payroll) => void;
  onDelete: (payroll: Payroll) => void;
}

const fetchPayrolls = async (month: Date) => {
  const startDate = format(startOfMonth(month), "yyyy-MM-dd");
  
  const { data, error } = await supabase
    .from("payrolls")
    .select(
      `
      *,
      employees (full_name)
    `
    )
    .eq("reference_month", startDate)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const PayrollTable: React.FC<PayrollTableProps> = ({ referenceMonth, onEdit, onDelete }) => {
  const {
    data: payrolls,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["payrolls", format(referenceMonth, "yyyy-MM")],
    queryFn: () => fetchPayrolls(referenceMonth),
  });

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-8">
        Erro ao carregar a folha de pagamento: {error.message}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Funcionário</TableHead>
            <TableHead>Salário Bruto</TableHead>
            <TableHead>Descontos</TableHead>
            <TableHead>Benefícios</TableHead>
            <TableHead>Salário Líquido</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payrolls && payrolls.length > 0 ? (
            payrolls.map((payroll) => (
              <TableRow key={payroll.id}>
                <TableCell className="font-medium">{(payroll.employees as any)?.full_name || "Funcionário não encontrado"}</TableCell>
                <TableCell>{formatCurrency(payroll.gross_salary)}</TableCell>
                <TableCell className="text-red-600">{formatCurrency(payroll.discounts)}</TableCell>
                <TableCell className="text-green-600">{formatCurrency(payroll.benefits)}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(payroll.net_salary)}</TableCell>
                <TableCell>
                  <Badge
                    className={cn({
                      "bg-green-500 text-white": payroll.payment_status === "pago",
                    })}
                  >
                    {payroll.payment_status.charAt(0).toUpperCase() + payroll.payment_status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEdit(payroll)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar Lançamento
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(payroll)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                Nenhum pagamento encontrado para este mês.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PayrollTable;