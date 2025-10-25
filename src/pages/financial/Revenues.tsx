import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import RevenuesTable from "@/components/financial/revenues/RevenuesTable";
import RevenueForm from "@/components/financial/revenues/RevenueForm";
import DeleteRevenueDialog from "@/components/financial/revenues/DeleteRevenueDialog";
import { Revenue } from "@/types/financial";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const Revenues = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | null>(null);
  const queryClient = useQueryClient();

  const handleAdd = () => {
    setSelectedRevenue(null);
    setIsFormOpen(true);
  };

  const handleEdit = (revenue: Revenue) => {
    setSelectedRevenue(revenue);
    setIsFormOpen(true);
  };

  const handleDelete = (revenue: Revenue) => {
    setSelectedRevenue(revenue);
    setIsDeleteDialogOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedRevenue(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedRevenue(null);
  };

  const deleteMutation = useMutation({
    mutationFn: async (revenueId: string) => {
      const { error } = await supabase.from("revenues").delete().eq("id", revenueId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Receita excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      closeDeleteDialog();
    },
    onError: (error: any) => {
      showError(`Erro ao excluir receita: ${error.message}`);
    },
  });

  const confirmDelete = () => {
    if (selectedRevenue) {
      deleteMutation.mutate(selectedRevenue.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestão de Receitas</h2>
          <p className="text-muted-foreground">
            Acompanhe e gerencie todas as suas fontes de receita.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Receita
        </Button>
      </div>

      <RevenuesTable onEdit={handleEdit} onDelete={handleDelete} />

      <RevenueForm
        isOpen={isFormOpen}
        onClose={closeForm}
        initialData={selectedRevenue}
      />

      {selectedRevenue && (
        <DeleteRevenueDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={confirmDelete}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default Revenues;