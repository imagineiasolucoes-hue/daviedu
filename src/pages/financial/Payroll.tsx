import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Payroll = () => {
  // This is a placeholder for the payroll management page.
  // Future functionality will include adding payroll transactions and viewing history.
  return (
    <Card>
      <CardHeader>
        <CardTitle>Folha de Pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Esta área será dedicada ao lançamento e gerenciamento da folha de pagamento.
          A funcionalidade completa será implementada em breve.
        </p>
      </CardContent>
    </Card>
  );
};

export default Payroll;