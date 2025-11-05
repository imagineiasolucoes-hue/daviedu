import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Loader2, CalendarDays } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

const ClassDiaryPage: React.FC = () => {
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
        <BookOpen className="h-8 w-8 text-primary" />
        Diário de Classe
      </h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Minhas Turmas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aqui você poderá selecionar uma turma e uma data para registrar as ocorrências e o conteúdo das aulas.
            Funcionalidades como seleção de turma, calendário e campo de texto para anotações serão implementadas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassDiaryPage;