import { MadeWithDyad } from "@/components/made-with-dyad";
import ExpenseList from "@/components/expenses/ExpenseList";
import CreateExpenseButton from "@/components/expenses/CreateExpenseButton";

const Index = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Expense Tracker</h1>
        <CreateExpenseButton />
      </header>
      
      <main>
        <ExpenseList />
      </main>

      <MadeWithDyad />
    </div>
  );
};

export default Index;