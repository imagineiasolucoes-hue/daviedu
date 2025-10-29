import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Class } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search } from "lucide-react";
import ClassesTable from "../../components/secretaria/classes/ClassesTable";
import ClassForm from "../../components/secretaria/classes/ClassForm";
import DeleteClassDialog from "../../components/secretaria/classes/DeleteClassDialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { academicLevels } from "@/lib/academic-options";

const Classes = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const queryClient = useQueryClient();

  const handleAdd = () => {
    setSelectedClass(null);
    setIsFormOpen(true);
  };

  const handleEdit = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsFormOpen(true);
  };

  const handleDelete = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsDeleteDialogOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedClass(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedClass(null);
  };

  const deleteMutation = useMutation({
    mutationFn: async (classId: string) => {
      const { error } = await supabase.from("classes").delete().eq("id", classId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Turma excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      closeDeleteDialog();
    },
    onError: (error: any) => {
      showError(`Erro ao excluir turma: ${error.message}`);
    },
  });

  const confirmDelete = () => {
    if (selectedClass) {
      deleteMutation.mutate(selectedClass.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Gerenciar Turmas</h3>
          <p className="text-sm text-muted-foreground">
            Organize os alunos em turmas por curso e ano letivo.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Turma
        </Button>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou sala..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filtrar por nível" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Níveis</SelectItem>
            {academicLevels.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filtrar por período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Períodos</SelectItem>
            <SelectItem value="Matutino">Matutino</SelectItem>
            <SelectItem value="Vespertino">Vespertino</SelectItem>
            <SelectItem value="Noturno">Noturno</SelectItem>
            <SelectItem value="Integral">Integral</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ClassesTable
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchTerm={searchTerm}
        levelFilter={levelFilter}
        periodFilter={periodFilter}
      />
      <ClassForm
        isOpen={isFormOpen}
        onClose={closeForm}
        initialData={selectedClass}
      />
      {selectedClass && (
        <DeleteClassDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={confirmDelete}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default Classes;