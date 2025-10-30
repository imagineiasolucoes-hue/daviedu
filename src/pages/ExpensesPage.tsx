import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

const ExpensesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Despesas</h1>
        <Button variant="destructive">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Despesa
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta área será usada para registrar e acompanhar todas as despesas da escola.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesPage;