import { MadeWithDyad } from "@/components/made-with-dyad";
import { DollarSign } from "lucide-react";
import IndicatorCard from "@/components/dashboard/IndicatorCard";

const Dashboard = () => {
  // Dados de exemplo para indicadores (mantendo apenas Despesas Mensais)
  const indicators = [
    {
      title: "Despesas Mensais",
      value: "R$ 12.500,00",
      change: "-5.2% desde o mês passado",
      icon: DollarSign,
      color: "text-red-500",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Indicadores</h1>
      </header>
      
      <main className="space-y-8">
        {/* Indicadores */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {indicators.map((indicator, index) => (
            <IndicatorCard key={index} {...indicator} />
          ))}
        </div>

        {/* Gráficos e Detalhes (Placeholder) */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Visão Geral de Desempenho</h2>
            <p className="text-muted-foreground">Gráfico de desempenho aqui.</p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Atividades Recentes</h2>
            <p className="text-muted-foreground">Lista de atividades recentes aqui.</p>
          </div>
        </div>
      </main>

      <MadeWithDyad />
    </div>
  );
};

export default Dashboard;