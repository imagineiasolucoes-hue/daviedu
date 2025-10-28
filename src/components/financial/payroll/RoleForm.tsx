import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { showError, showSuccess } from "@/utils/toast";
import { Role } from "@/types/financial";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const roleSchema = z.object({
  name: z.string().min(3, "O nome do cargo é obrigatório."),
  department: z.string().optional(),
  description: z.string().optional(),
  base_salary_reference: z.coerce.number().optional(),
});

interface RoleFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Role | null;
}

const RoleForm: React.FC<RoleFormProps> = ({ isOpen, onClose, initialData }) => {
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();
  const isEditMode = !!initialData;

  const form = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        base_salary_reference: initialData.base_salary_reference ? Number(initialData.base_salary_reference) : undefined,
      });
    } else {
      form.reset({
        name: "",
        department: "",
        description: "",
        base_salary_reference: undefined,
      });
    }
  }, [initialData, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof roleSchema>) => {
      if (!tenantId) throw new Error("ID da escola não encontrado.");

      const submissionData = { ...values, tenant_id: tenantId };

      if (isEditMode) {
        const { error } = await supabase
          .from("roles")
          .update(submissionData)
          .eq("id", initialData!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("roles").insert(submissionData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      showSuccess(isEditMode ? "Cargo atualizado!" : "Cargo criado!");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      onClose();
    },
    onError: (error: any) => showError(error.message),
  });

  const onSubmit = (values: z.infer<typeof roleSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Cargo" : "Adicionar Novo Cargo"}</DialogTitle>
          <DialogDescription>
            Preencha as informações do cargo abaixo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cargo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Professor de Matemática" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Pedagógico" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="base_salary_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salário Base (Referência)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva as responsabilidades do cargo..." {...field} />
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

export default RoleForm;