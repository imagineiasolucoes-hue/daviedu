import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Roles from "./payroll/Roles";
import Employees from "./payroll/Employees";
import PayrollList from "./payroll/PayrollList";

const Payroll = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Folha de Pagamento</h2>
        <p className="text-muted-foreground">
          Gerencie cargos, funcionários e processe a folha de pagamento.
        </p>
      </div>
      <Tabs defaultValue="employees">
        <TabsList className="grid w-full grid-cols-3 md:w-[500px]">
          <TabsTrigger value="employees">Funcionários</TabsTrigger>
          <TabsTrigger value="roles">Cargos</TabsTrigger>
          <TabsTrigger value="payroll">Folha de Pagamento</TabsTrigger>
        </TabsList>
        <TabsContent value="employees" className="mt-6">
          <Employees />
        </TabsContent>
        <TabsContent value="roles" className="mt-6">
          <Roles />
        </TabsContent>
        <TabsContent value="payroll" className="mt-6">
          <PayrollList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Payroll;