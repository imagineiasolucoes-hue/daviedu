import { useState } from "react";
import { TenantsTable } from "@/components/superadmin";
import TenantForm from "@/components/superadmin/TenantForm"; // Importar o novo formulário
import usePageTitle from "@/hooks/usePageTitle";
import { Tenant } from "@/components/superadmin/TenantsTable"; // Importar o tipo Tenant

const SuperAdmin = () => {
  usePageTitle("Super Admin");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedTenant(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel Super Admin</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie clientes, assinaturas e configurações da plataforma.
        </p>
      </div>
      <TenantsTable onEdit={handleEditTenant} />
      <TenantForm
        isOpen={isFormOpen}
        onClose={closeForm}
        initialData={selectedTenant}
      />
    </div>
  );
};

export default SuperAdmin;