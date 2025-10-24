import { MadeWithDyad } from "@/components/made-with-dyad";
import CreateExpenseButton from "@/components/expenses/CreateExpenseButton";
import ExpenseList from "@/components/expenses/ExpenseList";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl w-full space-y-8">
        <h1 className="text-5xl font-extrabold text-center text-gray-900 dark:text-gray-50 mb-8">
          Gerenciador de Despesas
        </h1>

        <div className="flex justify-end mb-6">
          <CreateExpenseButton />
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <ExpenseList />
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;