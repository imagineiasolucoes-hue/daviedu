import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Users, DollarSign, TrendingUp, BookOpen } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import IndicatorCard from "@/components/dashboard/IndicatorCard";

const Dashboard = () => {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout failed:", error);
      showError("Falha ao sair.");
    } else {
      showSuccess("Você saiu com sucesso.");
    }
  };

  // Dados de exemplo para indicadores
  const indicators = [
    {
      title: "Total de Professores",
      value: 45,
      change: "+20.1% desde o mês passado",
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Despesas Mensais",
      value: "R$ 12.500,00",
      change: "-5.2% desde o mês passado",
      icon: DollarSign,
      color: "text-red-500",
    },
    {
      title: "Média de Notas",
      value: 8.7,
      change: "+0.3 pontos",
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      title: "Disciplinas Ativas",
      value: 18,
      change: "Nenhuma alteração",
      icon: BookOpen,
      color: "text-yellow-500",
    },
  ];

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Indicadores</h1>
        <Button variant="outline" size="icon" onClick={handleLogout} title="Sair">
          <LogOut className="h-4 w-4" />
        </Button>
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