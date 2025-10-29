import TenantsTable from "@/components/superadmin/TenantsTable";
import usePageTitle from "@/hooks/usePageTitle";

const SuperAdmin = () => {
  usePageTitle("Super Admin");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel Super Admin</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie clientes, assinaturas e configurações da plataforma.
        </p>
      </div>
      <TenantsTable />
    </div>
  );
};

export default SuperAdmin;