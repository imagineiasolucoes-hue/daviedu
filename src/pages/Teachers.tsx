import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Teachers = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Cadastro de Professores</h1>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Professor
        </Button>
      </header>
      
      <main>
        <div className="bg-card p-6 rounded-lg shadow">
          <p className="text-muted-foreground">
            Aqui será implementada a tabela e o formulário para gerenciar professores.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Teachers;