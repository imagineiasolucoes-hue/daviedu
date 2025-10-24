import ExpenseList from "@/components/expenses/ExpenseList";
import CreateExpenseButton from "@/components/expenses/CreateExpenseButton";

const Expenses = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gerenciador de Despesas</h1>
        <div className="flex items-center space-x-4">
          <CreateExpenseButton />
        </div>
      </header>
      
      <main>
        <ExpenseList />
      </main>
    </div>
  );
};

export default Expenses;