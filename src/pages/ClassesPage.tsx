import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

const ClassesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Turmas</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Turma
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Turmas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta área será usada para gerenciar as turmas e classes da escola.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassesPage;