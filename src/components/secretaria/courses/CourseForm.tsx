import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchTenantId } from "@/lib/tenant";
import { showError, showSuccess } from "@/utils/toast";
import { Course } from "@/types/academic";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const courseSchema = z.object({
  name: z.string().min(3, "O nome do curso é obrigatório."),
  workload_hours: z.coerce.number().optional(),
});

interface CourseFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Course | null;
}

const CourseForm: React.FC<CourseFormProps> = ({ isOpen, onClose, initialData }) => {
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        workload_hours: initialData.workload_hours || undefined,
      });
    } else {
      form.reset({
        name: "",
        workload_hours: undefined,
      });
    }
  }, [initialData, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof courseSchema>) => {
      const { tenantId, error: tenantError } = await fetchTenantId();
      if (tenantError) throw new Error(tenantError);

      const submissionData = { ...values, tenant_id: tenantId };

      if (isEditMode) {
        const { error } = await supabase
          .from("courses")
          .update(submissionData)
          .eq("id", initialData!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("courses").insert(submissionData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      showSuccess(isEditMode ? "Curso atualizado!" : "Curso criado!");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      onClose();
    },
    onError: (error: any) => showError(error.message),
  });

  const onSubmit = (values: z.infer<typeof courseSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Curso" : "Adicionar Novo Curso"}</DialogTitle>
          <DialogDescription>
            Defina o nome e a carga horária do curso.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Curso</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ensino Fundamental I" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="workload_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carga Horária (horas)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 800" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CourseForm;