import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ExpenseForm from "./ExpenseForm";

const CreateExpenseButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-auto">Adicionar Nova Despesa</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Nova Despesa</DialogTitle>
        </DialogHeader>
        <ExpenseForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateExpenseButton;