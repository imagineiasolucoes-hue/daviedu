import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Course } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import CoursesTable from "../../../components/secretaria/courses/CoursesTable";
import CourseForm from "../../../components/secretaria/courses/CourseForm";
import DeleteCourseDialog from "../../../components/secretaria/courses/DeleteCourseDialog";

const Courses = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const queryClient = useQueryClient();

  const handleAdd = () => {
    setSelectedCourse(null);
    setIsFormOpen(true);
  };

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setIsFormOpen(true);
  };

  const handleDelete = (course: Course) => {
    setSelectedCourse(course);
    setIsDeleteDialogOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedCourse(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedCourse(null);
  };

  const deleteMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", courseId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Curso excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      closeDeleteDialog();
    },
    onError: (error: any) => {
      showError(`Erro ao excluir curso: ${error.message}`);
    },
  });

  const confirmDelete = () => {
    if (selectedCourse) {
      deleteMutation.mutate(selectedCourse.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Gerenciar Cursos</h3>
          <p className="text-sm text-muted-foreground">
            Crie e edite os cursos oferecidos pela sua instituição.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Curso
        </Button>
      </div>
      <CoursesTable onEdit={handleEdit} onDelete={handleDelete} />
      <CourseForm
        isOpen={isFormOpen}
        onClose={closeForm}
        initialData={selectedCourse}
      />
      {selectedCourse && (
        <DeleteCourseDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={confirmDelete}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default Courses;