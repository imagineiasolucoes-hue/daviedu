import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Student, Class } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search } from "lucide-react";
import StudentsTable from "@/components/secretaria/students/StudentsTable";
import StudentForm from "@/components/secretaria/students/StudentForm";
import DeleteStudentDialog from "@/components/secretaria/students/DeleteStudentDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fetchClasses = async (): Promise<Class[]> => {
  const { data, error } = await supabase.from("classes").select("*").order("name");
  if (error) throw new Error(error.message);
  return data || [];
};

const Students = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: classes, isLoading: isLoadingClasses, error: classesError } = useQuery<Class[]>({
    queryKey: ["classes"],
    queryFn: fetchClasses,
  });

  const handleAdd = () => {
    setSelectedStudent(null);
    setIsFormOpen(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsFormOpen(true);
  };

  const handleDelete = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedStudent(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedStudent(null);
  };

  const deleteMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase.from("students").delete().eq("id", studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Aluno excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] }); // Update student count on dashboard
      closeDeleteDialog();
    },
    onError: (error: any) => {
      showError(`Erro ao excluir aluno: ${error.message}`);
    },
  });

  const confirmDelete = () => {
    if (selectedStudent) {
      deleteMutation.mutate(selectedStudent.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Gerenciar Alunos</h3>
          <p className="text-sm text-muted-foreground">
            Cadastre, edite e gerencie o status dos alunos da sua instituição.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Aluno
        </Button>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou matrícula..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
            <SelectItem value="suspended">Suspenso</SelectItem>
            <SelectItem value="pre-enrolled">Pré-Matriculado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={classFilter} onValueChange={setClassFilter} disabled={isLoadingClasses || !!classesError}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filtrar por turma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Turmas</SelectItem>
            {classes?.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name} ({cls.school_year})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <StudentsTable
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        classFilter={classFilter}
      />
      <StudentForm
        isOpen={isFormOpen}
        onClose={closeForm}
        initialData={selectedStudent}
      />
      {selectedStudent && (
        <DeleteStudentDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={confirmDelete}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default Students;