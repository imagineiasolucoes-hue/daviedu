import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchTenantId } from "@/lib/tenant";
import { showError, showSuccess } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Pencil, Trash2, PlusCircle } from "lucide-react";
import CategoryForm from "./CategoryForm";
import { RevenueCategory } from "@/types/financial";

interface ManageCategoriesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageCategoriesDialog: React.FC<ManageCategoriesDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<Pick<
    RevenueCategory,
    "id" | "name"
  > | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["revenue_categories"],
    queryFn: async (): Promise<Pick<RevenueCategory, "id" | "name">[]> => {
      const { data, error } = await supabase
        .from("revenue_categories")
        .select("id, name")
        .order("name");
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const { tenantId, error: tenantError } = await fetchTenantId();
      if (tenantError) throw new Error(tenantError);
      const { error } = await supabase
        .from("revenue_categories")
        .insert({ name, tenant_id: tenantId });
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Categoria criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["revenue_categories"] });
      setIsAdding(false);
    },
    onError: (error: any) => showError(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("revenue_categories")
        .update({ name })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Categoria atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["revenue_categories"] });
      setEditingCategory(null);
    },
    onError: (error: any) => showError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("revenue_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Categoria excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["revenue_categories"] });
    },
    onError: (error: any) => showError(error.message),
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias de Receita</DialogTitle>
          <DialogDescription>
            Adicione, edite ou remova as categorias para organizar seus
            lançamentos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex justify-center">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {categories?.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 p-2 border rounded-md"
                >
                  {editingCategory?.id === cat.id ? (
                    <CategoryForm
                      initialData={cat}
                      isPending={updateMutation.isPending}
                      onSubmit={(values: { name: string }) =>
                        updateMutation.mutate({ id: cat.id, ...values })
                      }
                      onCancel={() => setEditingCategory(null)}
                    />
                  ) : (
                    <>
                      <span className="flex-1">{cat.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingCategory(cat)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(cat.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          {isAdding && (
            <CategoryForm
              isPending={createMutation.isPending}
              onSubmit={(values: { name: string }) => createMutation.mutate(values)}
              onCancel={() => setIsAdding(false)}
            />
          )}
          {!isAdding && (
            <Button
              variant="outline"
              onClick={() => setIsAdding(true)}
              className="w-full"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Nova Categoria
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageCategoriesDialog;