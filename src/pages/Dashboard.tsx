import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, DollarSign, BarChart, Activity, PlusCircle } from "lucide-react";
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const kpiData = [
  { title: "Total de Alunos", value: "1,250", icon: Users },
  { title: "Turmas Ativas", value: "42", icon: GraduationCap },
  { title: "Receita Mensal", value: "R$ 150.000", icon: DollarSign },
  { title: "Inadimplência", value: "5.2%", icon: BarChart },
];

const chartData = [
  { month: "Jan", newStudents: 12 },
  { month: "Fev", newStudents: 19 },
  { month: "Mar", newStudents: 3 },
  { month: "Abr", newStudents: 5 },
  { month: "Mai", newStudents: 2 },
  { month: "Jun", newStudents: 3 },
];

const recentActivities = [
    { user: "Ana Silva", action: "adicionou um novo aluno.", time: "5m atrás" },
    { user: "Carlos Souza", action: "gerou as mensalidades de Julho.", time: "1h atrás" },
    { user: "Secretaria", action: "atualizou a turma do 3º Ano.", time: "3h atrás" },
];

const Dashboard = () => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      {/* KPI Cards */}
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Novas Matrículas (Últimos 6 Meses)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={chartData}>
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip />
                <Bar dataKey="newStudents" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activities & Quick Actions */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-4">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-none">
                    <span className="font-semibold">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
            <Separator />
            <div>
                <h3 className="text-sm font-medium mb-2">Acesso Rápido</h3>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Aluno
                    </Button>
                    <Button variant="outline" size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova Turma
                    </Button>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;