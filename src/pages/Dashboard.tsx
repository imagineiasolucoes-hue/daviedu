import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, DollarSign, BarChart } from "lucide-react";

const kpiData = [
  { title: "Total de Alunos", value: "1,250", icon: Users },
  { title: "Turmas Ativas", value: "42", icon: GraduationCap },
  { title: "Receita Mensal", value: "R$ 150.000", icon: DollarSign },
  { title: "Inadimplência", value: "5.2%", icon: BarChart },
];

const Dashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Future charts and summaries will go here */}
    </div>
  );
};

export default Dashboard;