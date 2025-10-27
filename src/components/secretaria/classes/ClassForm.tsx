import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchTenantId } from "@/lib/tenant";
import { showError, showSuccess } from "@/utils/toast";
import { Class } from "@/types/academic";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  academicLevels,
  classOptions,
  AcademicLevel,
  getLevelByClassName,
} from "@/lib/academic-options";

// Extend the schema to include the temporary 'level' field for form logic
const classSchema = z.object({
  level: z.enum(academicLevels as [string, ...string[]], {
    required_error: "O nível de ensino é obrigatório.",
  }),
  name: z.string().min(3, "O nome da turma é obrigatório."),
  school_year: z.coerce.number().min(2000, "Ano inválido."),
  period: z.string().optional(),
  room: z.string().optional(),
});

interface ClassFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Class | null;
}

const ClassForm: React.FC<ClassFormProps> = ({ isOpen, onClose, initialData }) => {
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;

  const form = useForm<z.infer<typeof classSchema>>({
    resolver: zodResolver(classSchema),
  });

  const selectedLevel = form.watch("level");

  useEffect(() => {
    if (initialData) {
      const initialLevel = getLevelByClassName(initialData.name);
      form.reset({
        ...initialData,
        school_year: initialData.school_year,
        level: initialLevel, // Set the level based on the existing name
      });
    } else {
      form.reset({
        level: undefined,
        name: "",
        school_year: new Date().getFullYear(),
        period: "",
        room: "",
      });
    }
  }, [initialData, form]);

  // Reset class name when level changes
  useEffect(() => {
    if (selectedLevel) {
      form.setValue("name", "");
    }
  }, [selectedLevel, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof classSchema>) => {
      const { tenantId, error: tenantError } = await fetchTenantId();
      if (tenantError) throw new Error(tenantError);

      // Exclude 'level' from submission data as it's only for UI logic
      const { level, ...submissionData } = { ...values, tenant_id: tenantId };

      if (isEditMode) {
        const { error } = await supabase
          .from("classes")
          .update(submissionData)
          .eq("id", initialData!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("classes").insert(submissionData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      showSuccess(isEditMode ? "Turma atualizada!" : "Turma criada!");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      onClose();
    },
    onError: (error: any) => showError(error.message),
  });

  const onSubmit = (values: z.infer<typeof classSchema>) => {
    mutation.mutate(values);
  };

  const filteredClassNames = classOptions.filter(
    (opt) => opt.level === selectedLevel
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Turma" : "Adicionar Nova Turma"}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da turma, como nível, nome, ano e sala.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível de Ensino</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Turma</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedLevel}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedLevel ? "Selecione o nome da turma" : "Selecione o Nível primeiro"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredClassNames.map((option) => (
                          <SelectItem key={option.name} value={option.name}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="school_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano Letivo (Início do Ciclo)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder={`Ex: ${new Date().getFullYear()} (Será exibido como ${new Date().getFullYear()}/${new Date().getFullYear() + 1})`} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Matutino">Matutino</SelectItem>
                        <SelectItem value="Vespertino">Vespertino</SelectItem>
                        <SelectItem value="Noturno">Noturno</SelectItem>
                        <SelectItem value="Integral">Integral</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="room"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sala (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Sala 101" {...field} />
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

export default ClassForm;