import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Student } from "@/types/academic";
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
import { format } from "date-fns";

interface StudentsTableProps {
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  searchTerm: string;
  statusFilter: string;
  classFilter: string;
}

const fetchStudents = async (
  searchTerm: string,
  statusFilter: string,
  classFilter: string
) => {
  let query = supabase.from("students").select("*");

  if (searchTerm) {
    query = query.or(
      `full_name.ilike.%${searchTerm}%,registration_code.ilike.%${searchTerm}%`
    );
  }

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  if (classFilter !== "all") {
    query = query.eq("class_id", classFilter);
  }

  const { data, error } = await query.order("full_name");
  if (error) throw new Error(error.message);
  return data;
};

const StudentsTable: React.FC<StudentsTableProps> = ({
  onEdit,
  onDelete,
  searchTerm,
  statusFilter,
  classFilter,
}) => {
  const {
    data: students,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["students", searchTerm, statusFilter, classFilter],
    queryFn: () => fetchStudents(searchTerm, statusFilter, classFilter),
  });

  const getStatusBadge = (status: Student["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white">
            Ativo
          </Badge>
        );
      case "inactive":
        return <Badge variant="destructive">Inativo</Badge>;
      case "suspended":
        return <Badge variant="secondary">Suspenso</Badge>;
      case "pre-enrolled":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
            Pré-Matriculado
          </Badge>
        );
      default:
        return <Badge variant="secondary">N/A</Badge>;
    }
  };

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
        Erro ao carregar os alunos: {error.message}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome Completo</TableHead>
            <TableHead>Matrícula</TableHead>
            <TableHead>Nascimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students && students.length > 0 ? (
            students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">
                  {student.full_name}
                </TableCell>
                <TableCell>{student.registration_code}</TableCell>
                <TableCell>
                  {student.birth_date
                    ? format(new Date(student.birth_date), "dd/MM/yyyy")
                    : "N/A"}
                </TableCell>
                <TableCell>{getStatusBadge(student.status)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEdit(student)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(student)}
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
                Nenhum aluno encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default StudentsTable;