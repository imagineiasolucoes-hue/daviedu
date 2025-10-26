import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { fetchTenantId } from "@/lib/tenant";
import { showError, showSuccess } from "@/utils/toast";
import { Employee, Role } from "@/types/financial";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const employeeSchema = z.object({
  full_name: z.string().min(3, "O nome completo é obrigatório."),
  role_id: z.string().optional(),
  base_salary: z.coerce.number().positive("O salário base é obrigatório."),
  hire_date: z.date({ required_error: "A data de contratação é obrigatória." }),
  status: z.enum(["active", "inactive"]),
  department: z.string().optional(),
  contract_type: z.string().optional(),
});

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Employee | null;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ isOpen, onClose, initialData }) => {
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        hire_date: parseISO(initialData.hire_date),
        base_salary: Number(initialData.base_salary),
        role_id: initialData.role_id || "",
      });
    } else {
      form.reset({
        full_name: "",
        role_id: "",
        base_salary: 0,
        hire_date: new Date(),
        status: "active",
        department: "",
        contract_type: "",
      });
    }
  }, [initialData, form]);

  const { data: roles } = useQuery<Pick<Role, 'id' | 'name'>[]>({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("roles").select("id, name");
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof employeeSchema>) => {
      const { tenantId, error: tenantError } = await fetchTenantId();
      if (tenantError) throw new Error(tenantError);

      const submissionData = {
        ...values,
        tenant_id: tenantId,
        hire_date: format(values.hire_date, "yyyy-MM-dd"),
        role_id: values.role_id || null,
      };

      if (isEditMode) {
        const { error } = await supabase
          .from("employees")
          .update(submissionData)
          .eq("id", initialData!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("employees").insert(submissionData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      showSuccess(isEditMode ? "Funcionário atualizado!" : "Funcionário criado!");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onClose();
    },
    onError: (error: any) => showError(error.message),
  });

  const onSubmit = (values: z.infer<typeof employeeSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Funcionário" : "Adicionar Novo Funcionário"}</DialogTitle>
          <DialogDescription>
            Preencha as informações do funcionário abaixo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cargo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles?.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
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
                name="base_salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salário Base</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hire_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Contratação</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "dd/MM/yyyy") : <span>Escolha uma data</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
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
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Pedagógico" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contract_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Contrato (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: CLT" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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

export default EmployeeForm;