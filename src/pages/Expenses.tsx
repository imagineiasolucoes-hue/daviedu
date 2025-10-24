import { MadeWithDyad } from "@/components/made-with-dyad";
import ExpenseList from "@/components/expenses/ExpenseList";
import CreateExpenseButton from "@/components/expenses/CreateExpenseButton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";

const Expenses = () => {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout failed:", error);
      showError("Falha ao sair.");
    } else {
      showSuccess("Você saiu com sucesso.");
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gerenciador de Despesas</h1>
        <div className="flex items-center space-x-4">
          <CreateExpenseButton />
          <Button variant="outline" size="icon" onClick={handleLogout} title="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      
      <main>
        <ExpenseList />
      </main>

      <MadeWithDyad />
    </div>
  );
};

export default Expenses;