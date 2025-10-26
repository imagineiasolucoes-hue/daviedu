import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/types/financial";
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
import { cn } from "@/lib/utils";

const fetchEmployees = async () => {
  const { data, error } = await supabase
    .from("employees")
    .select(
      `
      *,
      roles (name)
    `
    )
    .order("full_name");

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

interface EmployeesTableProps {
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

const EmployeesTable: React.FC<EmployeesTableProps> = ({ onEdit, onDelete }) => {
  const {
    data: employees,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
  });

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
        Erro ao carregar os funcionários: {error.message}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome Completo</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Salário Base</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees && employees.length > 0 ? (
            employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.full_name}</TableCell>
                <TableCell>{(employee.roles as any)?.name || "N/A"}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(employee.base_salary)}
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn({
                      "bg-green-500 text-white": employee.status === "active",
                      "bg-red-500 text-white": employee.status !== "active",
                    })}
                  >
                    {employee.status === "active" ? "Ativo" : "Inativo"}
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
                      <DropdownMenuItem onClick={() => onEdit(employee)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(employee)}
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
              <TableCell colSpan={5} className="h-24 text-center">
                Nenhum funcionário encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default EmployeesTable;