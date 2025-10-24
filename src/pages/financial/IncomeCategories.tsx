import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Loader2, MoreHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { showError, showSuccess } from "@/utils/toast";
import { Category } from "@/types/financial";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const categorySchema = z.object({
  name: z.string().min(2, "O nome do tipo de receita é obrigatório."),
});

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Category;
}

const fetchTenantId = async (userId: string | undefined) => {
    if (!userId) return undefined;
    const { data, error } = await supabase.from("profiles").select("tenant_id").eq("id", userId).single();
    if (error) throw new Error("Failed to fetch tenant ID");
    return data?.tenant_id;
};

const fetchIncomeCategories = async (tenantId: string | undefined): Promise<Category[]> => {
  if (!tenantId) return [];
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, type, parent_id")
    .eq("tenant_id", tenantId)
    .eq("type", "income")
    .is("parent_id", null) // Only fetch top-level income categories
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data as Category[];
};

const CategoryFormDialog: React.FC<CategoryFormDialogProps> = ({ open, onOpenChange, initialData }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tenantId } = useQuery({
    queryKey: ['tenantId', user?.id],
    queryFn: () => fetchTenantId(user?.id),
    enabled: !!user,
  });

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name || "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof categorySchema>) => {
    if (!user || !tenantId) {
      showError("Você precisa estar logado para realizar esta ação.");
      return;
    }

    try {
      if (initialData) {
        // Update existing category
        const { error } = await supabase
          .from("categories")
          .update({ name: values.name })
          .eq("id", initialData.id);

        if (error) throw error;
        showSuccess("Tipo de receita atualizado com sucesso!");
      } else {
        // Add new category
        const { error } = await supabase.from("categories").insert({
          name: values.name,
          type: "income",
          tenant_id: tenantId,
          parent_id: null, // Top-level category
        });

        if (error) throw error;
        showSuccess("Tipo de receita adicionado com sucesso!");
      }
      queryClient.invalidateQueries({ queryKey: ["incomeCategories"] });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      showError(error.message || "Ocorreu um erro ao salvar o tipo de receita.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Tipo de Receita" : "Adicionar Tipo de Receita"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Edite o nome do tipo de receita." : "Adicione um novo tipo de receita para organizar suas entradas."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Tipo de Receita</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Mensalidade, Acordos, Variadas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Salvar Alterações" : "Adicionar Tipo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const IncomeCategories = () => {
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tenantId } = useQuery({
    queryKey: ['tenantId', user?.id],
    queryFn: () => fetchTenantId(user?.id),
    enabled: !!user,
  });

  const { data: categories = [], isLoading, error } = useQuery<Category[]>({
    queryKey: ["incomeCategories", tenantId],
    queryFn: () => fetchIncomeCategories(tenantId),
    enabled: !!tenantId,
  });

  const handleAddCategory = () => {
    setEditingCategory(undefined);
    setIsFormDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsFormDialogOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;
      showSuccess("Tipo de receita excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["incomeCategories"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] }); // Invalidate transactions as well
    } catch (error: any) {
      showError(error.message || "Ocorreu um erro ao excluir o tipo de receita.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tipos de Receita</CardTitle>
            <CardDescription>Gerencie os tipos de receita da sua instituição.</CardDescription>
          </div>
          <Button onClick={handleAddCategory}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Tipo
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : error ? (
            <div className="text-red-500 text-center">Falha ao carregar tipos de receita.</div>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Tipo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                                Editar
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 cursor-pointer">
                                    Excluir
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita. Isso excluirá permanentemente o tipo de receita "{category.name}" e desvinculará todas as transações associadas.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteCategory(category.id)} className="bg-red-500 hover:bg-red-600 text-white">
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        Nenhum tipo de receita encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <CategoryFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        initialData={editingCategory}
      />
    </div>
  );
};

export default IncomeCategories;