import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Role } from "@/types/financial";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import RolesTable from "../../../components/financial/payroll/RolesTable";
import RoleForm from "../../../components/financial/payroll/RoleForm";
import DeleteRoleDialog from "../../../components/financial/payroll/DeleteRoleDialog";

const Roles = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const queryClient = useQueryClient();

  const handleAdd = () => {
    setSelectedRole(null);
    setIsFormOpen(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsFormOpen(true);
  };

  const handleDelete = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedRole(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedRole(null);
  };

  const deleteMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from("roles").delete().eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Cargo excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      closeDeleteDialog();
    },
    onError: (error: any) => {
      showError(`Erro ao excluir cargo: ${error.message}`);
    },
  });

  const confirmDelete = () => {
    if (selectedRole) {
      deleteMutation.mutate(selectedRole.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Gerenciar Cargos</h3>
          <p className="text-sm text-muted-foreground">
            Crie e edite os cargos e salários base da sua instituição.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Cargo
        </Button>
      </div>
      <RolesTable onEdit={handleEdit} onDelete={handleDelete} />
      <RoleForm
        isOpen={isFormOpen}
        onClose={closeForm}
        initialData={selectedRole}
      />
      {selectedRole && (
        <DeleteRoleDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={confirmDelete}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default Roles;