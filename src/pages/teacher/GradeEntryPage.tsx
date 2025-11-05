import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Loader2 } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

const GradeEntryPage: React.FC = () => {
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <ClipboardList className="h-8 w-8 text-primary" />
        Lançamento de Notas
      </h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Minhas Turmas e Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta área será usada para você selecionar uma turma e lançar as notas dos seus alunos.
            Funcionalidades como seleção de turma, disciplina e tipo de avaliação serão adicionadas aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GradeEntryPage;