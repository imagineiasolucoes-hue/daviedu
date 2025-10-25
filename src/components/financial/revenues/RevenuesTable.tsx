import { useQuery } from "@tanstack/react-query";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { Revenue } from "@/types/financial";
import { cn } from "@/lib/utils";

const fetchRevenues = async () => {
  const { data, error } = await supabase
    .from("revenues")
    .select(
      `
      *,
      revenue_categories (name),
      students (full_name)
    `
    )
    .order("date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

interface RevenuesTableProps {
  onEdit: (revenue: Revenue) => void;
  onDelete: (revenue: Revenue) => void;
}

const RevenuesTable: React.FC<RevenuesTableProps> = ({ onEdit, onDelete }) => {
  const {
    data: revenues,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["revenues"],
    queryFn: fetchRevenues,
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
        Erro ao carregar as receitas: {error.message}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {revenues && revenues.length > 0 ? (
            revenues.map((revenue) => (
              <TableRow key={revenue.id}>
                <TableCell className="font-medium">
                  {revenue.description}
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(revenue.amount)}
                </TableCell>
                <TableCell>
                  {new Date(revenue.date).toLocaleDateString("pt-BR", { timeZone: 'UTC' })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      revenue.status === "pago"
                        ? "default"
                        : revenue.status === "pendente"
                        ? "secondary"
                        : "destructive"
                    }
                    className={cn({ "bg-green-500 text-white": revenue.status === "pago" })}
                  >
                    {revenue.status.charAt(0).toUpperCase() + revenue.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {revenue.revenue_categories?.name || "N/A"}
                </TableCell>
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
                      <DropdownMenuItem onClick={() => onEdit(revenue)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(revenue)}
                        className="text-red-600 focus:text-red-600"
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
              <TableCell colSpan={6} className="h-24 text-center">
                Nenhuma receita encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default RevenuesTable;